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

  async uploadDocument(file: Express.Multer.File, userId: string) {
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
        await this.cloudinaryService.uploadDocument(file);

      if (!cloudinaryResponse) {
        throw new Error("Document upload failed.");
      }

      // Save document metadata to database
      const document = await this.documentRepository.createDocument(
        file.originalname,
        cloudinaryResponse.secure_url,
        cloudinaryResponse.public_id,
        file.mimetype,
        userId,
        ProcessingStatus.COMPLETED
      );

      return {
        status: "success",
        error: true,
        statusCode: 200,
        data: {
          id: document.id,
          public_id: cloudinaryResponse.public_id,
        },
        message: "Document uploaded successfully",
      };
    } catch (error) {
      console.error("Error processing document:", error);
      throw error; // Re-throw the error to be handled by the controller
    }
  }

  async extractText(public_id: string) {
    try {
      if (!public_id) {
        return {
          status: "error",
          error: true,
          statusCode: 400,
          message: "Missing document public_id",
        };
      }
      const extractedText =
        await this.cloudinaryService.extractTextFromDocument(public_id);
      if (!extractedText) {
        return {
          status: "error",
          error: true,
          statusCode: 400,
          message: "Text extraction failed",
        };
      }
      return {
        status: "success",
        error: false,
        statusCode: 200,
        text: extractedText,
      };
    } catch (error) {
      // Log the error for debugging
      this.logger.error(
        `Text extraction failed for ${public_id}: ${error.message}`
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
