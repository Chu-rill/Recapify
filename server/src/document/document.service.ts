import { Injectable } from "@nestjs/common";
import { SummaryService } from "../summary/summary.service";
import { DocumentRepository } from "./document.repository";
import { ProcessingStatus } from "@generated/prisma";
import { CloudinaryService } from "src/infra/cloudinary/cloudinary.service";

@Injectable()
export class DocumentService {
  constructor(
    private documentRepository: DocumentRepository,
    private summaryService: SummaryService,
    private cloudinaryService: CloudinaryService
  ) {}

  async processDocument(file: Express.Multer.File, userId: string) {
    if (!file) {
      return {
        status: "error",
        error: true,
        statusCode: 400,
        message: "No file uploaded",
      };
    }
    try {
      // Upload file to Cloudinary
      const cloudinaryResponse =
        await this.cloudinaryService.uploadProfiles(file);

      // Save document metadata to database
      const document = await this.documentRepository.createDocument(
        file.originalname,
        cloudinaryResponse.secure_url,
        file.mimetype,
        userId,
        ProcessingStatus.PROCESSING
      );

      // Update the document processing status to "PROCESSING"
      await this.documentRepository.updateDocument(document.id, {
        processingStatus: "PROCESSING",
      });

      // Start the summary generation process asynchronously
      await this.summaryService.generateSummary(document.id).catch((error) => {
        console.error(
          `Error generating summary for document ${document.id}:`,
          error
        );
        this.documentRepository.updateDocument(document.id, {
          processingStatus: "FAILED",
        });
      });

      return {
        id: document.id,
        message: "Document uploaded successfully and processing has begun",
      };
    } catch (error) {
      console.error("Error processing document:", error);
      throw error; // Re-throw the error to be handled by the controller
    }
  }
}
