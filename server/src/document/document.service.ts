import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { DocumentRepository } from "./document.repository";
import { ProcessingStatus } from "@generated/prisma";
import { CloudinaryService } from "src/infra/cloudinary/cloudinary.service";

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);
  constructor(
    private documentRepository: DocumentRepository,
    private cloudinaryService: CloudinaryService
  ) {}

  async uploadDocument(file: Express.Multer.File, userId: string) {
    try {
      this.logger.log(`Processing document upload: ${file.originalname}`);

      // Extract text from the PDF buffer
      const extractedText =
        await this.cloudinaryService.extractTextFromPdfBuffer(file.buffer);

      if (!extractedText) {
        this.logger.error("Failed to extract text from document .");
        throw new Error("Failed to extract text from document.");
      }

      // Save document metadata to database
      const document = await this.documentRepository.createDocument(
        file.originalname,
        file.mimetype,
        userId,
        extractedText,
        ProcessingStatus.PROCESSING
      );

      this.logger.log(`Document successfully uploaded: ${document.id}`);

      return {
        status: "success",
        error: false,
        statusCode: 200,
        data: {
          id: document.id,
          name: document.fileName,
          fileType: document.fileType,
          userId: document.userId,
          createdAt: document.uploadedAt,
        },
        message: "Document uploaded successfully",
      };
    } catch (error) {
      this.logger.error(
        `Error uploading document: ${error.message}`,
        error.stack
      );

      throw error; // Re-throw the error to be handled by the controller
    }
  }

  async extractText(documentId: string) {
    try {
      if (!documentId) {
        return {
          status: "error",
          error: true,
          statusCode: 400,
          message: "Missing document documentId",
        };
      }
      this.logger.log(`Starting text extraction for document: ${documentId}`);
      const extractedText =
        await this.documentRepository.getExtractedText(documentId);
      if (!extractedText) {
        this.logger.warn(
          `No text could be extracted from document: ${documentId}`
        );
        return {
          status: "error",
          error: true,
          statusCode: 400,
          message: "Text extraction failed",
        };
      }
      this.logger.log(
        `Text extraction successful for: ${documentId} (${extractedText.length} characters)`
      );
      return {
        status: "success",
        error: false,
        statusCode: 200,
        text: extractedText,
      };
    } catch (error) {
      // Log the error for debugging
      this.logger.error(
        `Text extraction failed for ${documentId}: ${error.message}`
      );

      // Return error response
      return {
        status: "error",
        error: true,
        statusCode: 500,
        message: "Internal server error during text extraction",
      };
    }
  }
}
