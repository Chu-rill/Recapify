import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "src/infra/db/prisma.service";
import { SummaryRepository } from "src/summary/summary.repository";
import * as fs from "fs";
import * as util from "util";
import * as path from "path";
import axios from "axios";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AudioService {
  private readonly logger = new Logger(AudioService.name);
  private readonly elevenLabsApiKey: string | undefined;
  private readonly elevenLabsBaseUrl = "https://api.elevenlabs.io/v1";

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private summaryRepository: SummaryRepository
  ) {
    this.elevenLabsApiKey =
      this.configService.get<string>("ELEVENLABS_API_KEY");
    if (!this.elevenLabsApiKey) {
      this.logger.warn("ELEVENLABS_API_KEY not set in environment variables");
    }
    this.logger.log("AudioService initialized with ElevenLabs");
  }

  async generateAudio(summaryId: string, voiceId: string) {
    this.logger.log(
      `Starting audio generation for summary: ${summaryId} with voice ID: ${voiceId}`
    );

    const summary = await this.summaryRepository.findSummaryById(summaryId);

    if (!summary) {
      this.logger.warn(`Summary not found: ${summaryId}`);
      throw new Error(`Summary not found: ${summaryId}`);
    }

    this.logger.debug(
      `Found summary with document: ${summary.document.fileName}`
    );

    const outputDir = "./uploads/audio";
    if (!fs.existsSync(outputDir)) {
      this.logger.debug(`Creating output directory: ${outputDir}`);
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${summary.document.fileName}.mp3`;
    const outputFile = path.join(outputDir, fileName);
    this.logger.debug(`Output file will be: ${outputFile}`);

    try {
      // Split long text into chunks (ElevenLabs has a limit of ~4096 tokens)
      this.logger.debug(`Splitting text into chunks with max length: 4000`);
      const textChunks = this.splitTextIntoChunks(summary.content, 4000);
      this.logger.debug(`Text split into ${textChunks.length} chunks`);

      const audioBuffers: Buffer[] = [];

      // Process each chunk
      for (let i = 0; i < textChunks.length; i++) {
        const chunk = textChunks[i];
        this.logger.debug(
          `Processing chunk ${i + 1}/${textChunks.length} with length ${chunk.length}`
        );

        const startTime = Date.now();
        this.logger.debug(`Calling ElevenLabs API for chunk ${i + 1}`);

        const audioBuffer = await this.synthesizeSpeechWithElevenLabs(
          chunk,
          voiceId
        );
        audioBuffers.push(audioBuffer);

        const duration = Date.now() - startTime;
        this.logger.debug(
          `ElevenLabs API call completed in ${duration}ms for chunk ${i + 1}`
        );
      }

      // Combine all audio chunks
      this.logger.debug(`Combining ${audioBuffers.length} audio buffers`);
      const combinedBuffer = Buffer.concat(audioBuffers);
      this.logger.debug(`Combined audio size: ${combinedBuffer.length} bytes`);

      // Write to file
      this.logger.debug(`Writing audio to file: ${outputFile}`);
      const writeFile = util.promisify(fs.writeFile);
      await writeFile(outputFile, combinedBuffer);

      // Get file size
      const stats = fs.statSync(outputFile);
      this.logger.debug(
        `Audio file created: ${outputFile}, size: ${stats.size} bytes`
      );

      // Estimate duration (mp3 bitrate is typically around 32kbps for speech)
      const estimatedDuration = Math.floor(stats.size / 4000); // Rough estimate in seconds

      // Create audio track record
      this.logger.log(`Creating audio track record in database`);
      const audioTrack = await this.prisma.audioTrack.create({
        data: {
          title: `${summary.document.fileName} - Audio Summary`,
          duration: estimatedDuration,
          fileUrl: `audio/${fileName}`,
          fileSize: stats.size,
          format: "mp3",
          voiceType: voiceId,
          documentId: summary.document.id,
          summaryId: summary.id,
          userId: summary.document.userId,
        },
      });

      this.logger.log(
        `Audio generation complete for summary: ${summaryId}, created audioTrack: ${audioTrack.id}`
      );
      return audioTrack;
    } catch (error) {
      this.logger.error(
        `Error generating audio for summary ${summaryId}: ${error.message}`,
        error.stack
      );
      throw new Error(`Error generating audio: ${error.message}`);
    }
  }

  private async synthesizeSpeechWithElevenLabs(
    text: string,
    voiceId: string
  ): Promise<Buffer> {
    if (!this.elevenLabsApiKey) {
      throw new Error("ElevenLabs API key is not configured");
    }

    try {
      // ElevenLabs text-to-speech endpoint
      const url = `${this.elevenLabsBaseUrl}/text-to-speech/${voiceId}`;

      const response = await axios({
        method: "post",
        url,
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": this.elevenLabsApiKey,
          Accept: "audio/mpeg",
        },
        data: {
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        },
        responseType: "arraybuffer",
      });

      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error(
        `Error calling ElevenLabs API: ${error.message}`,
        error.stack
      );

      if (error.response) {
        this.logger.error(
          `ElevenLabs API error status: ${error.response.status}`
        );
        this.logger.error(
          `ElevenLabs API error data: ${JSON.stringify(error.response.data)}`
        );
      }

      throw new Error(
        `Failed to synthesize speech with ElevenLabs: ${error.message}`
      );
    }
  }

  private splitTextIntoChunks(text: string, maxLength: number): string[] {
    this.logger.debug(
      `Splitting text of length ${text.length} into chunks of max length ${maxLength}`
    );

    // Ensure text is a string
    const content = String(text);
    const chunks: string[] = [];
    let start = 0;

    while (start < content.length) {
      let end = Math.min(start + maxLength, content.length);

      // Try to end at a sentence or paragraph break if possible
      if (end < content.length) {
        const possibleBreaks = [". ", "! ", "? ", "\n\n"];

        for (const breakChar of possibleBreaks) {
          const breakPos = content.lastIndexOf(breakChar, end);
          if (breakPos > start && breakPos <= end - 1) {
            end = breakPos + 1;
            this.logger.debug(
              `Found natural break at position ${breakPos} with break character "${breakChar}"`
            );
            break;
          }
        }
      }

      const chunk = content.substring(start, end).trim();
      chunks.push(chunk);
      this.logger.debug(
        `Created chunk ${chunks.length} with length ${chunk.length}`
      );

      start = end;
    }

    this.logger.debug(`Split text into ${chunks.length} chunks`);
    return chunks;
  }
}
