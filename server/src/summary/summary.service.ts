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

    try {
      // Get document details to retrieve the file URL
      const document = await this.documentRepository.findDocumentById(documentId);

      if (!document) {
        this.logger.warn(`Document not found: ${documentId}`);
        return {
          status: "error",
          error: true,
          statusCode: 404,
          message: "Document not found",
        };
      }

      if (!document.fileUrl) {
        this.logger.warn(`No file URL found for document: ${documentId}`);
        return {
          status: "error",
          error: true,
          statusCode: 404,
          message: "Document file URL not found",
        };
      }

      this.logger.log(
        `Generating summary with Gemini API directly from file URL for document: ${documentId}`
      );

      // Create custom prompt for the AI model
      const promptTemplate = `
      Please create a comprehensive summary of this document.

      Provide:
      1. A concise overall summary
      2. Key points and insights (as bullet points starting with -)
      3. Important details to remember
      `;

      // Track time for summary generation
      const startTime = Date.now();
      const response = await this.geminiService.generateContentFromFileUrl(
        document.fileUrl,
        promptTemplate
      );
      const generationTime = Date.now() - startTime;

      const summaryContent =
        response.candidates[0].content.text ||
        response.candidates[0].content.parts[0].text;

      this.logger.log(
        `Summary generated successfully in ${generationTime}ms for document: ${documentId}`
      );

      if (typeof summaryContent !== "string") {
        console.log(`content: ${response.candidates[0].content}`);
        console.log(summaryContent);
        this.logger.error(
          `Summary content is not a string: ${typeof summaryContent}`
        );
        throw new Error("Summary content is not a string");
      }

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
        documentId
      );

      // Update document status
      this.logger.log(`Updating document status to COMPLETED: ${documentId}`);
      await this.documentRepository.updateDocument(documentId, {
        processingStatus: "COMPLETED",
        processedAt: new Date(),
      });

      // Delete the document from Supabase storage after successful summarization
      this.logger.log(`Deleting document from Supabase storage: ${documentId}`);
      if (document.filePath) {
        try {
          await this.documentService['supabaseService'].deleteDocument(document.filePath);
          this.logger.log(`Document successfully deleted from Supabase: ${documentId}`);
        } catch (deleteError) {
          this.logger.error(
            `Failed to delete document from Supabase: ${deleteError.message}`,
            deleteError.stack
          );
          // Continue execution even if deletion fails
        }
      }

      // Delete extracted text from database if it exists
      await this.documentRepository.deleteExtractedText(documentId);

      this.logger.log(
        `Summary generation complete for document: ${documentId}`
      );

      // Return the generated summary
      return {
        success: true,
        statusCode: 200,
        data: {
          id: summary.id,
          content: summaryContent,
          shortSummary: shortSummary,
          keyPoints: keyPoints,
          documentId: documentId,
          wasTruncated: false, // No truncation when using file URL
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
      await this.documentRepository.updateDocument(documentId, {
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

  async findAllSummaries() {
    const summaries = await this.summaryRepository.findAllSummaries();
    return {
      success: true,
      statusCode: 200,
      data: summaries,
      message: "Summaries retrieved successfully",
    };
  }

  async findAllSummariesByUserId(userId: string) {
    const summaries =
      await this.summaryRepository.findSummariesByUserId(userId);
    return {
      success: true,
      statusCode: 200,
      data: summaries,
      message: "Summaries retrieved successfully",
    };
  }
}
