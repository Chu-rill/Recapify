import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "src/infra/db/prisma.service";
import { SummaryRepository } from "src/summary/summary.repository";
import * as fs from "fs";
import * as util from "util";
import * as path from "path";
import axios from "axios";
import { ConfigService } from "@nestjs/config";
import { CloudinaryService } from "src/infra/cloudinary/cloudinary.service";
import { AudioRepository } from "./audio.repository";

@Injectable()
export class AudioService {
  private readonly logger = new Logger(AudioService.name);
  private readonly unrealSpeechApiKey: string;
  private readonly unrealSpeechBaseUrl = "https://api.v6.unrealspeech.com/";

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private cloudinaryService: CloudinaryService,
    private audioRepository: AudioRepository,
    private summaryRepository: SummaryRepository
  ) {
    this.unrealSpeechApiKey =
      this.configService.get<string>("UNREALSPEECH_API_KEY") ?? "";
    if (!this.unrealSpeechApiKey) {
      this.logger.warn("UNREALSPEECH_API_KEY not set in environment variables");
    }
    this.logger.log("AudioService initialized with UnrealSpeech");
  }

  async generateAudio(summaryId: string, voiceType: string) {
    // Map Google voice types to UnrealSpeech voice IDs
    const voiceMap = {
      "en-US-Neural2-F": "female-voice-1", // Map to female voice
      "en-US-Neural2-C": "female-voice-2", // Map to alternative female voice
      "en-US-Neural2-A": "male-voice-1", // Map to male voice
      "en-US-Neural2-J": "male-voice-2", // Map to alternative male voice
      "en-US-Studio-O": "male-voice-3", // Map to another male voice
      "en-US-Wavenet-J": "female-voice-3", // Map to another female voice
      // Add more mappings as needed
    };

    // Get UnrealSpeech voice ID or use default if not found
    const voice = voiceMap[voiceType] || "female-voice-1"; // Default to female voice if not found

    this.logger.log(
      `Starting audio generation for summary: ${summaryId} with voice: ${voiceType} (UnrealSpeech voice: ${voice})`
    );

    const summary = await this.summaryRepository.findSummaryById(summaryId);

    if (!summary) {
      this.logger.warn(`Summary not found: ${summaryId}`);
      throw new Error(`Summary not found: ${summaryId}`);
    }

    this.logger.debug(
      `Found summary with document: ${summary.document.fileName}`
    );

    try {
      // Split long text into chunks (UnrealSpeech may have its own limits)
      this.logger.debug(`Splitting text into chunks with max length: 5000`);
      const textChunks = this.splitTextIntoChunks(summary.content, 5000);
      this.logger.debug(`Text split into ${textChunks.length} chunks`);

      const audioBuffers: Buffer[] = [];

      // Process each chunk
      for (let i = 0; i < textChunks.length; i++) {
        const chunk = textChunks[i];
        this.logger.debug(
          `Processing chunk ${i + 1}/${textChunks.length} with length ${chunk.length}`
        );

        const startTime = Date.now();
        this.logger.debug(`Calling UnrealSpeech API for chunk ${i + 1}`);

        // Add retry mechanism for API calls
        let retryCount = 0;
        const maxRetries = 3;
        let audioBuffer: Buffer | undefined;

        while (retryCount < maxRetries) {
          try {
            audioBuffer = await this.synthesizeSpeechWithUnrealSpeech(
              chunk,
              voice
            );
            // If successful, break the retry loop
            break;
          } catch (error) {
            retryCount++;
            this.logger.warn(
              `Attempt ${retryCount}/${maxRetries} failed: ${error.message}`
            );

            // If we've reached max retries, throw the error
            if (retryCount >= maxRetries) {
              throw error;
            }

            // Wait before retrying (exponential backoff)
            const delay = 1000 * Math.pow(2, retryCount);
            this.logger.debug(`Waiting ${delay}ms before retry`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }

        if (!audioBuffer) throw new Error("Failed to generate audio buffer");
        audioBuffers.push(audioBuffer);

        const duration = Date.now() - startTime;
        this.logger.debug(
          `UnrealSpeech API call completed in ${duration}ms for chunk ${i + 1}`
        );
      }

      // Combine all audio chunks
      this.logger.debug(`Combining ${audioBuffers.length} audio buffers`);
      const combinedBuffer = Buffer.concat(audioBuffers);
      this.logger.debug(`Combined audio size: ${combinedBuffer.length} bytes`);

      // Generate a filename for the audio
      const fileName = `${Date.now()}-${summary.document.fileName}.mp3`;

      // Upload audio to Cloudinary
      this.logger.debug(`Uploading audio to Cloudinary`);
      const cloudinaryResult =
        await this.cloudinaryService.uploadBufferToCloudinary(
          combinedBuffer,
          fileName
        );

      // Estimate duration (mp3 bitrate is typically around 32kbps for speech)
      const estimatedDuration = Math.floor(combinedBuffer.length / 4000); // Rough estimate in seconds

      // Create audio track record
      this.logger.log(`Creating audio track record in database`);
      const audioTrack = await this.audioRepository.createAudio(
        `${summary.document.fileName} - Audio Summary`,
        estimatedDuration,
        cloudinaryResult.secure_url,
        combinedBuffer.length,
        "mp3",
        voiceType, // Store the original voice type name for consistency
        summary.document.id,
        summary.id,
        summary.document.userId
      );

      this.logger.log(
        `Audio generation complete for summary: ${summaryId}, created audioTrack: ${audioTrack.id}`
      );
      return {
        success: true,
        statusCode: 200,
        data: audioTrack,
        message: "Audio generated successfully",
      };
    } catch (error) {
      this.logger.error(
        `Error generating audio for summary ${summaryId}: ${error.message}`,
        error.stack
      );
      throw new Error(`Error generating audio: ${error.message}`);
    }
  }

  async getAudioById(id: string) {
    this.logger.log(`Fetching audio by ID: ${id}`);
    const audio = await this.audioRepository.findAudioById(id);
    if (!audio) {
      this.logger.warn(`Audio not found: ${id}`);
      throw new Error(`Audio not found: ${id}`);
    }
    return {
      success: true,
      statusCode: 200,
      data: audio,
      message: "Audio retrieved successfully",
    };
  }

  async getAudiosByUserId(userId: string) {
    this.logger.log(`Fetching audios for user ID: ${userId}`);
    const audios = await this.audioRepository.findAudiosByUserId(userId);
    if (!audios || audios.length === 0) {
      this.logger.warn(`No audios found for user ID: ${userId}`);
      throw new Error(`No audios found for user ID: ${userId}`);
    }
    return {
      success: true,
      statusCode: 200,
      data: audios,
      message: "Audios retrieved successfully",
    };
  }

  async getAudios() {
    const audios = await this.audioRepository.findAllAudios();
    return {
      success: true,
      statusCode: 200,
      data: audios,
      message: "Audios retrieved successfully",
    };
  }

  private async synthesizeSpeechWithUnrealSpeech(
    text: string,
    voice: string
  ): Promise<Buffer> {
    if (!this.unrealSpeechApiKey) {
      throw new Error("UnrealSpeech API key is not configured");
    }

    try {
      // UnrealSpeech text-to-speech endpoint
      const url = `${this.unrealSpeechBaseUrl}/speech`;

      // Log request details for debugging (remove sensitive info)
      this.logger.debug(`Calling UnrealSpeech API at: ${url}`);

      const response = await axios({
        method: "post",
        url,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.unrealSpeechApiKey}`,
          Accept: "audio/mpeg",
        },
        data: {
          Text: text,
          VoiceId: voice,
          Bitrate: "192k", // High quality audio
          Speed: "0", // Normal speed
          Pitch: "1", // Default pitch
          Codec: "libmp3lame",
        },
        responseType: "arraybuffer",
        // Configure axios to handle redirects correctly
        maxRedirects: 5, // Limit redirects to 5
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Accept all 2xx and 3xx responses, reject 4xx and 5xx
        },
      });

      // Handle potential 3xx responses that weren't automatically followed
      if (response.status >= 300 && response.status < 400) {
        this.logger.warn(
          `Received ${response.status} redirect response but wasn't followed automatically`
        );
        throw new Error(
          `Received ${response.status} redirect that couldn't be followed`
        );
      }

      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error(
        `Error calling UnrealSpeech API: ${error.message}`,
        error.stack
      );

      if (error.response) {
        this.logger.error(
          `UnrealSpeech API error status: ${error.response.status}`
        );

        // Try to parse the error data if it's a Buffer
        if (error.response.data && error.response.data.type === "Buffer") {
          try {
            const errorText = Buffer.from(error.response.data.data).toString(
              "utf8"
            );
            this.logger.error(`UnrealSpeech API error details: ${errorText}`);
          } catch (parseError) {
            this.logger.error(
              `UnrealSpeech API error data: ${JSON.stringify(error.response.data)}`
            );
          }
        } else {
          this.logger.error(
            `UnrealSpeech API error data: ${JSON.stringify(error.response.data)}`
          );
        }
      }

      // Special handling for redirect errors
      if (error.code === "ERR_FR_TOO_MANY_REDIRECTS") {
        this.logger.error(
          "Too many redirects detected. UnrealSpeech API endpoint might have changed."
        );

        // Try alternative endpoint or approach
        return this.fallbackSynthesizeSpeech(text, voice);
      }

      // Implement retry logic for network errors
      if (
        error.code === "ECONNREFUSED" ||
        error.code === "ENOTFOUND" ||
        error.code === "EAI_AGAIN"
      ) {
        this.logger.warn(
          `Network error when calling UnrealSpeech API, could retry`
        );
        // Retries are now handled by the outer function
      }

      throw new Error(
        `Failed to synthesize speech with UnrealSpeech: ${error.message}`
      );
    }
  }

  // Fallback method when the primary endpoint has redirect issues
  private async fallbackSynthesizeSpeech(
    text: string,
    voice: string
  ): Promise<Buffer> {
    try {
      // Try alternative endpoint
      // For now, we'll try the same endpoint but with a specific version path added
      const altUrl = `${this.unrealSpeechBaseUrl}/v2/synthesisTasks`;

      this.logger.debug(`Using fallback UnrealSpeech API endpoint: ${altUrl}`);

      const response = await axios({
        method: "post",
        url: altUrl,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.unrealSpeechApiKey}`,
          Accept: "audio/mpeg",
        },
        data: {
          Text: text,
          VoiceId: voice,
          Bitrate: "192k",
          Speed: "0",
          Pitch: "1",
          Codec: "libmp3lame",
          // Some APIs require a client version - add if needed
          ClientVersion: "1.0.0",
        },
        responseType: "arraybuffer",
        maxRedirects: 5,
      });

      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error(
        `Fallback speech synthesis also failed: ${error.message}`,
        error.stack
      );

      // As a last resort, check if UnrealSpeech API documentation has been updated
      this.logger.warn(
        "UnrealSpeech API may have changed. Check for API updates or consider an alternative service."
      );

      throw new Error(`All speech synthesis attempts failed: ${error.message}`);
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
