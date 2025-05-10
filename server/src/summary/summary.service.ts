import { Injectable, Logger } from "@nestjs/common";
import { GeminiService } from "src/gemini/gemini.service";
import { SummaryRepository } from "./summary.repository";
import { DocumentRepository } from "src/document/document.repository";
import { DocumentService } from "src/document/document.service";

@Injectable()
export class SummaryService {
  private readonly logger = new Logger(SummaryService.name);

  constructor(
    private summaryRepository: SummaryRepository,
    private documentRepository: DocumentRepository,
    private documentService: DocumentService,
    private geminiService: GeminiService
  ) {}

  async generateSummary(documentId: string) {
    this.logger.log(`Starting summary generation for document: ${documentId}`);

    // Get document from database
    const document = await this.documentRepository.findDocumentById(documentId);

    if (!document) {
      this.logger.warn(`Document not found: ${documentId}`);
      throw new Error(`Document not found: ${documentId}`);
    }

    try {
      this.logger.log(`Extracting text from document: ${document.public_id}`);
      const extractedText = await this.documentService.extractText(
        document.public_id
      );

      // If extraction failed, return the error
      if (extractedText.error) {
        this.logger.warn(`Text extraction failed: ${extractedText.message}`);
        return {
          status: "error",
          error: true,
          statusCode: extractedText.statusCode,
          message: extractedText.message,
        };
      }

      if (!extractedText.text) {
        this.logger.warn(`No text content found in document: ${documentId}`);
        return {
          status: "error",
          error: true,
          statusCode: 404,
          message: "Extracted text not found",
        };
      }

      // Truncate text if needed to respect token limits
      const MAX_CHARS = 1000000; // 1 million characters
      const textForSummary = extractedText.text.substring(0, MAX_CHARS);

      // Check if text was truncated to inform user
      const wasTruncated = extractedText.text.length > MAX_CHARS;
      if (wasTruncated) {
        this.logger.warn(
          `Document text truncated from ${extractedText.text.length} to ${MAX_CHARS} characters`
        );
      }

      this.logger.log(
        `Generating summary with Gemini API for document: ${documentId}`
      );

      // Create prompt template for the AI model
      const promptTemplate = `
      Please create a comprehensive summary of the following document:
      
      ${textForSummary}
      
      Provide:
      1. A concise overall summary
      2. Key points and insights
      3. Important details to remember
      `;

      // Track time for summary generation
      const startTime = Date.now();
      const summaryContent =
        await this.geminiService.generateContent(promptTemplate);
      const generationTime = Date.now() - startTime;

      this.logger.log(
        `Summary generated successfully in ${generationTime}ms for document: ${documentId}`
      );

      // Extract key points
      this.logger.debug(`Extracting key points from summary`);
      const keyPoints = this.extractKeyPoints(summaryContent);
      this.logger.debug(`Found ${keyPoints.length} key points`);

      // Create short summary
      this.logger.debug(`Creating short summary`);
      const shortSummary = this.createShortSummary(summaryContent);

      // Save summary to database
      this.logger.log(`Saving summary to database for document: ${documentId}`);
      const summary = await this.summaryRepository.createSummary(
        summaryContent,
        shortSummary,
        keyPoints,
        document.id
      );

      // Update document status
      this.logger.log(`Updating document status to COMPLETED: ${documentId}`);
      await this.documentRepository.updateDocument(document.id, {
        processingStatus: "COMPLETED",
        processedAt: new Date(),
      });

      this.logger.log(
        `Summary generation complete for document: ${documentId}`
      );

      // Return the generated summary
      return {
        status: "success",
        error: false,
        statusCode: 200,
        data: {
          id: summary.id,
          content: summaryContent,
          shortSummary: shortSummary,
          keyPoints: keyPoints,
          documentId: document.id,
          wasTruncated: wasTruncated,
          textLength: extractedText.text.length,
          processedAt: new Date(),
        },
        message: "Summary generated successfully",
      };
    } catch (error) {
      this.logger.error(
        `Error generating summary for document ${documentId}: ${error.message}`,
        error.stack
      );

      // Update document status to failed
      this.logger.warn(`Updating document status to FAILED: ${documentId}`);
      await this.documentRepository.updateDocument(document.id, {
        processingStatus: "FAILED",
      });

      throw error;
    }
  }

  private createShortSummary(fullSummary: string): string {
    try {
      // Create a shorter version (first paragraph or first X characters)
      const firstParagraph = fullSummary.split("\n\n")[0];
      return (
        firstParagraph.substring(0, 300) +
        (firstParagraph.length > 300 ? "..." : "")
      );
    } catch (error) {
      this.logger.warn(`Error creating short summary: ${error.message}`);
      // Fallback method if there are any issues with paragraph splitting
      return fullSummary.substring(0, 300) + "...";
    }
  }

  private extractKeyPoints(summary: string): string[] {
    try {
      // Basic extraction of key points - you can improve this with better text analysis
      const keyPointRegex = /- ([^\n]+)/g;
      const matches = [...summary.matchAll(keyPointRegex)];
      return matches.map((match) => match[1].trim());
    } catch (error) {
      this.logger.warn(`Error extracting key points: ${error.message}`);
      return []; // Return empty array if extraction fails
    }
  }

  async getSummaryByDocumentId(documentId: string) {
    this.logger.log(`Retrieving summary for document: ${documentId}`);
    try {
      const summary =
        await this.summaryRepository.findSummaryByDocumentId(documentId);

      if (!summary) {
        this.logger.warn(`No summary found for document: ${documentId}`);
        return {
          status: "error",
          error: true,
          statusCode: 404,
          message: "Summary not found",
        };
      }

      this.logger.log(
        `Summary retrieved successfully for document: ${documentId}`
      );
      return {
        status: "success",
        error: false,
        statusCode: 200,
        data: summary,
      };
    } catch (error) {
      this.logger.error(
        `Error retrieving summary: ${error.message}`,
        error.stack
      );
      return {
        status: "error",
        error: true,
        statusCode: 500,
        message: `Error retrieving summary: ${error.message}`,
      };
    }
  }
}
