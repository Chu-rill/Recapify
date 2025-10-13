import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenAI } from "@google/genai";

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private ai: GoogleGenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>("GOOGLE_API_KEY");
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY is not defined in environment variables");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateContent(prompt: string): Promise<any> {
    let model = "gemini-2.0-flash";
    try {
      const response = await this.ai.models.generateContent({
        model,
        contents: prompt,
      });
      return response;
    } catch (error) {
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }

  /**
   * Generate content from a file URL (PDF, DOC, etc.)
   * First uploads file to Gemini File API, then processes it
   */
  async generateContentFromFileUrl(fileUrl: string, prompt?: string): Promise<any> {
    const model = "gemini-2.0-flash";

    try {
      this.logger.log(`Fetching file from URL: ${fileUrl}`);

      // Step 1: Download the file from Supabase URL
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }

      const fileBuffer = Buffer.from(await response.arrayBuffer());
      const mimeType = this.getMimeTypeFromUrl(fileUrl);
      const displayName = fileUrl.split('/').pop() || 'document.pdf';

      this.logger.log(`Downloaded file: ${displayName} (${Math.round(fileBuffer.length / 1024)} KB)`);

      // Step 2: Upload file to Gemini File API
      this.logger.log(`Uploading file to Gemini File API...`);

      // Create a Blob from the buffer
      const blob = new Blob([fileBuffer], { type: mimeType });

      const uploadResult = await this.ai.files.upload({
        file: blob,
        config: {
          displayName: displayName,
          mimeType: mimeType,
        },
      });

      this.logger.log(`File uploaded to Gemini: ${uploadResult.uri}`);

      // Step 3: Wait for file to be processed (if needed)
      if (!uploadResult.name) {
        throw new Error('Failed to get file name from upload result');
      }

      let fileInfo = uploadResult;
      const geminiFileName = uploadResult.name;

      while (fileInfo.state === 'PROCESSING') {
        this.logger.log('Waiting for Gemini to process file...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        fileInfo = await this.ai.files.get({ name: geminiFileName });
      }

      if (fileInfo.state === 'FAILED') {
        throw new Error('Gemini failed to process the file');
      }

      this.logger.log(`File ready for processing. State: ${fileInfo.state}`);

      // Step 4: Generate content using the uploaded file
      const contents = [
        {
          role: "user",
          parts: [
            {
              fileData: {
                mimeType: fileInfo.mimeType,
                fileUri: fileInfo.uri,
              },
            },
            {
              text: prompt || `
                Please create a comprehensive summary of this document.

                Provide:
                1. A concise overall summary
                2. Key points and insights (as bullet points starting with -)
                3. Important details to remember
              `,
            },
          ],
        },
      ];

      const geminiResponse = await this.ai.models.generateContent({
        model,
        contents,
      });

      this.logger.log(`Successfully generated content from file`);

      // Step 5: Clean up - delete file from Gemini after processing
      try {
        await this.ai.files.delete({ name: geminiFileName });
        this.logger.log(`Cleaned up file from Gemini: ${geminiFileName}`);
      } catch (deleteError) {
        this.logger.warn(`Failed to delete file from Gemini: ${deleteError.message}`);
      }

      return geminiResponse;
    } catch (error) {
      this.logger.error(`Failed to generate content from file URL: ${error.message}`, error.stack);
      throw new Error(`Failed to generate content from file: ${error.message}`);
    }
  }

  /**
   * Determine MIME type from file URL
   */
  private getMimeTypeFromUrl(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();

    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
    };

    return mimeTypes[extension || 'pdf'] || 'application/pdf';
  }
}
