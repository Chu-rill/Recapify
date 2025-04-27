// summary.service.ts
import { Injectable } from "@nestjs/common";
import { GeminiService } from "src/gemini/gemini.service";
import { SummaryRepository } from "./summary.repository";
import { PdfService } from "src/document/pdf.service";

@Injectable()
export class SummaryService {
  constructor(
    private summaryRepository: SummaryRepository,
    private pdfService: PdfService,
    private geminiService: GeminiService
  ) {}

  async generateSummary(documentId: string): Promise<void> {
    // Get document from database
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    try {
      // Extract text from PDF
      const pdfText = await this.pdfService.extractText(document.fileUrl);

      // Generate summary using Google Gemini
      const promptTemplate = `
        Please create a comprehensive summary of the following document:
        
        ${pdfText.substring(0, 100000)} // Take first 100k chars to respect token limits
        
        Provide:
        1. A concise overall summary
        2. Key points and insights
        3. Important details to remember
      `;

      const summaryContent =
        await this.geminiService.generateContent(promptTemplate);

      // Extract key points (this is a simple method, you might want to use more sophisticated parsing)
      const keyPoints = this.extractKeyPoints(summaryContent);

      // Save summary to database
      await this.prisma.summary.create({
        data: {
          content: summaryContent,
          shortSummary: this.createShortSummary(summaryContent),
          keyPoints,
          documentId: document.id,
        },
      });

      // Update document status
      await this.prisma.document.update({
        where: { id: document.id },
        data: {
          processingStatus: "COMPLETED",
          processedAt: new Date(),
        },
      });
    } catch (error) {
      // Update document status to failed
      await this.prisma.document.update({
        where: { id: document.id },
        data: { processingStatus: "FAILED" },
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
