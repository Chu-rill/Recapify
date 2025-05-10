// summary.service.ts
import { Injectable } from "@nestjs/common";
import { GeminiService } from "src/gemini/gemini.service";
import { SummaryRepository } from "./summary.repository";
import { DocumentRepository } from "src/document/document.repository";
import { DocumentService } from "src/document/document.service";

@Injectable()
export class SummaryService {
  constructor(
    private summaryRepository: SummaryRepository,
    private documentRepository: DocumentRepository,
    private documentService: DocumentService,
    private geminiService: GeminiService
  ) {}

  async generateSummary(documentId: string) {
    // Get document from database
    const document = await this.documentRepository.findDocumentById(documentId);

    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    try {
      const extractedText = await this.documentService.extractText(
        document.public_id
      );

      // If extraction failed, return the error
      if (extractedText.error) {
        return {
          status: "error",
          error: true,
          statusCode: extractedText.statusCode,
          message: extractedText.message,
        };
      }
      if (!extractedText.text) {
        return {
          status: "error",
          error: true,
          statusCode: 404,
          message: "extracted not found",
        };
      }

      // Truncate text if needed to respect token limits
      const MAX_CHARS = 1000000; //1 million
      const textForSummary = extractedText.text.substring(0, MAX_CHARS);

      // Check if text was truncated to inform user
      const wasTruncated = extractedText.text.length > MAX_CHARS;

      // Create prompt template for the AI model
      const promptTemplate = `
      Please create a comprehensive summary of the following document:
      
      ${textForSummary}
      
      Provide:
      1. A concise overall summary
      2. Key points and insights
      3. Important details to remember
    `;

      const summaryContent =
        await this.geminiService.generateContent(promptTemplate);

      // Extract key points (this is a simple method, you might want to use more sophisticated parsing)
      const keyPoints = this.extractKeyPoints(summaryContent);

      const shortSummary = this.createShortSummary(summaryContent);

      // Save summary to database
      const summary = await this.summaryRepository.createSummary(
        summaryContent,
        shortSummary,
        keyPoints,
        document.id
      );

      // Update document status
      await this.documentRepository.updateDocument(document.id, {
        processingStatus: "COMPLETED",
        processedAt: new Date(),
      });
    } catch (error) {
      // Update document status to failed
      await this.documentRepository.updateDocument(document.id, {
        processingStatus: "FAILED",
      });
      throw error;
    }
  }

  private createShortSummary(fullSummary: string): string {
    // Create a shorter version (first paragraph or first X characters)
    return fullSummary.split("\n\n")[0].substring(0, 300) + "...";
  }

  private extractKeyPoints(summary: string): string[] {
    // Basic extraction of key points - you can improve this with better text analysis
    const keyPointRegex = /- ([^\n]+)/g;
    const matches = [...summary.matchAll(keyPointRegex)];
    return matches.map((match) => match[1].trim());
  }
}
