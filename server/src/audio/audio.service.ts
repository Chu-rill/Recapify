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

interface UnrealSpeechResponse {
  SynthesisTask?: {
    // Make SynthesisTask optional in case the API returns a different structure on error
    CreationTime: string;
    OutputUri: string;
    RequestCharacters: number;
    TaskId: string;
    TaskStatus: string;
    TimestampsUri: string;
    VoiceId: string;
  };
}

@Injectable()
export class AudioService {
  private readonly logger = new Logger(AudioService.name);
  private readonly unrealSpeechApiKey: string;
  private readonly unrealSpeechBaseUrl = "https://api.v8.unrealspeech.com";

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
    this.logger.log("AudioService initialized with UnrealSpeech v8 API");
  }

  async generateAudio(summaryId: string, voiceType: string) {
    // Map Google voice types to UnrealSpeech voice IDs
    // Updated with the newer UnrealSpeech voice options
    const voiceMap = {
      "en-US-Neural2-F": "Eleanor", // Female voice
      "en-US-Neural2-C": "Amelia", // Alternative female voice
      "en-US-Neural2-A": "Daniel", // Male voice
      "en-US-Neural2-J": "Jasper", // Alternative male voice
      "en-US-Studio-O": "Oliver", // Another male voice
      "en-US-Wavenet-J": "Sierra", // Another female voice
      // Add more mappings as needed
    };

    // Get UnrealSpeech voice ID or use default if not found
    const voice = voiceMap[voiceType] || "Eleanor"; // Default to Nova female voice if not found

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

      const audioUrls: string[] = [];
      let totalCharacters = 0;

      // Process each chunk
      for (let i = 0; i < textChunks.length; i++) {
        const chunk = textChunks[i];
        totalCharacters += chunk.length;

        this.logger.debug(
          `Processing chunk ${i + 1}/${textChunks.length} with length ${chunk.length}`
        );

        const startTime = Date.now();
        this.logger.debug(`Calling UnrealSpeech API for chunk ${i + 1}`);

        // Add retry mechanism for API calls
        let retryCount = 0;
        const maxRetries = 3;
        let audioResponse: UnrealSpeechResponse | undefined;

        while (retryCount < maxRetries) {
          try {
            audioResponse = await this.synthesizeSpeechWithUnrealSpeech(
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

        if (!audioResponse || !audioResponse.SynthesisTask?.OutputUri) {
          throw new Error("Failed to generate audio or retrieve audio URL");
        }

        audioUrls.push(audioResponse.SynthesisTask.OutputUri);

        const duration = Date.now() - startTime;
        this.logger.debug(
          `UnrealSpeech API call completed in ${duration}ms for chunk ${i + 1}`
        );
      }

      // Calculate estimated duration (approximately 15 characters per second for speech)
      const estimatedDuration = Math.ceil(totalCharacters / 15);

      // Create audio track record using the first audio URL (or combine them logically in your frontend)
      this.logger.log(`Creating audio track record in database`);

      // Store all URLs if there are multiple chunks
      const audioUrl =
        audioUrls.length === 1 ? audioUrls[0] : JSON.stringify(audioUrls);

      const audioTrack = await this.audioRepository.createAudio(
        `${summary.document.fileName} - Audio Summary`,
        estimatedDuration,
        audioUrl, // Using the direct URL from UnrealSpeech (no need for Cloudinary)
        totalCharacters, // Size in characters instead of bytes
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
  ): Promise<UnrealSpeechResponse> {
    if (!this.unrealSpeechApiKey) {
      throw new Error("UnrealSpeech API key is not configured");
    }

    // Validate the text (example)
    if (!text || text.length > 5000) {
      // adjust length as needed
      throw new Error("Invalid text: Text is too long or empty.");
    }

    // Validate the voice (example) - improve this validation
    const validVoices = [
      "Eleanor",
      "Amelia",
      "Daniel",
      "Jasper",
      "Oliver",
      "Sierra",
    ]; // get the actual voices from UnrealSpeech
    if (!validVoices.includes(voice)) {
      throw new Error(
        `Invalid voice: ${voice}.  Must be one of: ${validVoices.join(", ")}`
      );
    }

    try {
      // UnrealSpeech text-to-speech endpoint
      const url = `${this.unrealSpeechBaseUrl}/synthesisTasks`;

      const requestData = {
        Text: text,
        VoiceId: voice,
        Bitrate: "320k", // High quality audio
        AudioFormat: "mp3",
        OutputFormat: "uri", // Important: We want a URL, not binary data
        TimestampType: "sentence", // Get timestamps for sentences
        sync: false, // Asynchronous processing
      };

      // Log request details for debugging (remove sensitive info)
      this.logger.debug(`Calling UnrealSpeech API at: ${url}`);
      // this.logger.debug(
      //   `UnrealSpeech API Request Data: ${JSON.stringify(requestData)}`
      // ); // LOG THE REQUEST!

      const response = await axios({
        method: "post",
        url,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.unrealSpeechApiKey}`,
        },
        data: requestData, // Use the defined requestData object

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

      if (response.status !== 200) {
        // Log more details in case of an error
        this.logger.error(
          `UnrealSpeech API returned status code ${response.status}`
        );
        this.logger.error(
          `Response headers: ${JSON.stringify(response.headers)}`
        ); //log response headers
        this.logger.error(`Response data: ${JSON.stringify(response.data)}`); //log response data
        throw new Error(
          `UnrealSpeech API returned status code ${response.status}`
        );
      }

      // API now returns a JSON with URLs instead of binary data
      const audioResponseData: UnrealSpeechResponse = response.data;

      this.logger.debug(
        `UnrealSpeech API Response Data: ${JSON.stringify(audioResponseData)}`
      );

      const taskStatus = audioResponseData?.SynthesisTask?.TaskStatus;
      const taskId = audioResponseData?.SynthesisTask?.TaskId;
      const outputUri = audioResponseData?.SynthesisTask?.OutputUri;

      if (taskStatus === "completed" && outputUri) {
        return audioResponseData; // Task is complete!
      } else if (taskStatus === "scheduled" || taskStatus === "processing") {
        // Start polling
        this.logger.debug(`Starting polling for task ${taskId}`);
        if (!taskId) {
          return Promise.reject(new Error("Task ID is missing"));
        }
        const completedResponse = await this.pollForCompletion(taskId);
        return completedResponse; // Or handle errors within pollForCompletion
      } else {
        throw new Error(
          `UnrealSpeech task failed or is in an unknown state: ${taskStatus}`
        );
      }
    } catch (error) {
      this.logger.error(
        `Error calling UnrealSpeech API: ${error.message}`,
        error.stack
      );

      if (error.response) {
        this.logger.error(
          `UnrealSpeech API error status: ${error.response.status}`
        );

        this.logger.error(
          `UnrealSpeech API error data: ${JSON.stringify(error.response.data)}`
        );
      }

      // Special handling for redirect errors
      if (error.code === "ERR_FR_TOO_MANY_REDIRECTS") {
        this.logger.error(
          "Too many redirects detected. UnrealSpeech API endpoint might have changed."
        );

        // Try alternative endpoint or approach
        return this.fallbackSynthesizeSpeech(text, voice);
      }

      throw new Error(
        `Failed to synthesize speech with UnrealSpeech: ${error.message}`
      );
    }
  }

  // Separate function to poll for completion
  private async pollForCompletion(
    taskId: string
  ): Promise<UnrealSpeechResponse> {
    let attempt = 0;
    const maxAttempts = 30; // Adjust as needed
    let delay = 2000; // Initial delay in milliseconds

    while (attempt < maxAttempts) {
      attempt++;
      this.logger.debug(`Polling attempt ${attempt} for task ${taskId}`);

      try {
        const taskDetails = await this.getTaskDetails(taskId); // Implement this function

        const taskStatus = taskDetails?.SynthesisTask?.TaskStatus;
        const outputUri = taskDetails?.SynthesisTask?.OutputUri;

        if (taskStatus === "completed" && outputUri) {
          this.logger.debug(`Task ${taskId} completed successfully`);
          return taskDetails; // Return the full response
        } else if (taskStatus === "failed") {
          this.logger.error(`Task ${taskId} failed`);
          throw new Error(`UnrealSpeech task ${taskId} failed`);
        } else {
          this.logger.debug(
            `Task ${taskId} still pending (status: ${taskStatus})`
          );
        }
      } catch (error) {
        this.logger.warn(
          `Error during polling attempt ${attempt} for task ${taskId}: ${error.message}`
        );
        // Consider breaking the loop if the error is unrecoverable
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 2, 30000); // Exponential backoff with a maximum delay
    }

    throw new Error(`Task ${taskId} did not complete within the allowed time`);
  }

  // Implement this function to get the task details from the API
  private async getTaskDetails(taskId: string): Promise<UnrealSpeechResponse> {
    const url = `${this.unrealSpeechBaseUrl}/synthesisTasks/${taskId}`; // Adjust URL if different
    this.logger.debug(
      `Calling UnrealSpeech API to get task details for ${taskId}`
    );
    try {
      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.unrealSpeechApiKey}`,
        },
      });

      if (response.status !== 200) {
        throw new Error(
          `UnrealSpeech API returned status code ${response.status} for task ${taskId}`
        );
      }

      const audioResponseData: UnrealSpeechResponse = response.data;
      this.logger.debug(
        `UnrealSpeech API Response Data for task ${taskId}: ${JSON.stringify(audioResponseData)}`
      );
      return audioResponseData;
    } catch (error) {
      this.logger.error(
        `Error getting UnrealSpeech API task details: ${error.message}`,
        error.stack
      );

      if (error.response) {
        this.logger.error(
          `UnrealSpeech API error status: ${error.response.status}`
        );

        this.logger.error(
          `UnrealSpeech API error data: ${JSON.stringify(error.response.data)}`
        );
      }

      throw new Error(
        `Failed to get UnrealSpeech API task details: ${error.message}`
      );
    }
  }

  // Fallback method when the primary endpoint has redirect issues
  private async fallbackSynthesizeSpeech(
    text: string,
    voice: string
  ): Promise<UnrealSpeechResponse> {
    try {
      // Try alternative endpoint - could be v7 or another version
      const altUrl = `https://api.v7.unrealspeech.com/speech`;

      this.logger.debug(`Using fallback UnrealSpeech API endpoint: ${altUrl}`);

      const response = await axios({
        method: "post",
        url: altUrl,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.unrealSpeechApiKey}`,
        },
        data: {
          Text: text,
          VoiceId: voice,
          Bitrate: "320k",
          AudioFormat: "mp3",
          OutputFormat: "uri",
          TimestampType: "sentence",
          sync: false,
        },
        maxRedirects: 5,
      });

      return response.data;
    } catch (error) {
      this.logger.error(
        `Fallback speech synthesis also failed: ${error.message}`,
        error.stack
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
