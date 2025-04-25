import { Injectable } from "@nestjs/common";
import { SummaryService } from "../summary/summary.service";
import { DocumentRepository } from "./document.repository";

@Injectable()
export class DocumentService {
  constructor(
    private documentRepository: DocumentRepository,
    private summaryService: SummaryService
  ) {}

  async processDocument(file, userId: string) {
    // Save document metadata to database
    const document = await this.prisma.document.create({
      data: {
        title: file.originalname.replace(/\.[^/.]+$/, ""), // Remove extension
        fileName: file.filename,
        fileUrl: `uploads/${file.filename}`,
        fileSize: file.size,
        fileType: file.mimetype,
        processingStatus: "PROCESSING",
        userId,
      },
    });

    // Start the summary generation process asynchronously
    this.summaryService.generateSummary(document.id).catch((error) => {
      console.error(
        `Error generating summary for document ${document.id}:`,
        error
      );
      this.prisma.document.update({
        where: { id: document.id },
        data: { processingStatus: "FAILED" },
      });
    });

    return {
      id: document.id,
      message: "Document uploaded successfully and processing has begun",
    };
  }
}
