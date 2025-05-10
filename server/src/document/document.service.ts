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
    if (!file) {
      return {
        status: "error",
        error: true,
        statusCode: 400,
        message: "No file uploaded",
      };
    }

    this.logger.log(
      `Starting document upload for user ${userId}: ${file.originalname}`
    );
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
        ProcessingStatus.PROCESSING
      );

      this.logger.log(`Document successfully uploaded: ${document.id}`);

      return {
        status: "success",
        error: false,
        statusCode: 200,
        data: {
          id: document.id,
          public_id: cloudinaryResponse.public_id,
          filename: file.originalname,
          fileType: file.mimetype,
          uploadedAt: document.uploadedAt,
        },
        message: "Document uploaded successfully",
      };
    } catch (error) {
      this.logger.error(
        `Error uploading document: ${error.message}`,
        error.stack
      );

      // Create more specific error responses based on the error type
      if (error.http_code === 413) {
        throw new BadRequestException("File too large for upload");
      } else if (error.http_code === 415) {
        throw new BadRequestException("Unsupported file type");
      } else if (error.http_code === 429) {
        throw new BadRequestException(
          "Upload rate limit exceeded, please try again later"
        );
      } else if (error.http_code) {
        throw new BadRequestException(`Upload error: ${error.message}`);
      }
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
      this.logger.log(`Starting text extraction for document: ${public_id}`);
      const extractedText =
        await this.cloudinaryService.extractTextFromDocument(public_id);
      if (!extractedText) {
        this.logger.warn(
          `No text could be extracted from document: ${public_id}`
        );
        return {
          status: "error",
          error: true,
          statusCode: 400,
          message: "Text extraction failed",
        };
      }
      this.logger.log(
        `Text extraction successful for: ${public_id} (${extractedText.length} characters)`
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
