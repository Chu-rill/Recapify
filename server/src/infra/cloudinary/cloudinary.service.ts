import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiOptions,
} from "cloudinary";
import { Express } from "express";
import * as pdfParse from "pdf-parse";

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  // Default timeout increased to 5 minutes (300000ms)
  private readonly DEFAULT_TIMEOUT = 300000;

  constructor(@Inject("CLOUDINARY") private cloudinary) {
    // Set global configuration for Cloudinary
    this.cloudinary.config({
      upload_timeout: this.DEFAULT_TIMEOUT,
    });
  }

  async uploadDocument(file: Express.Multer.File): Promise<UploadApiResponse> {
    const uploadOptions: UploadApiOptions = {
      folder: "documents",
      resource_type: "raw",
      // ocr: "adv_ocr", // Remove OCR here
      timeout: this.DEFAULT_TIMEOUT,
    };

    this.logger.log(
      `Uploading document: ${file.originalname} (${Math.round(file.size / 1024)} KB)`
    );
    return this.uploadToCloudinary(file, uploadOptions);
  }

  async extractTextFromPdfBuffer(fileBuffer: Buffer): Promise<string | null> {
    try {
      const data = await pdfParse(fileBuffer);
      return data.text;
    } catch (error) {
      this.logger.error(
        `Error extracting text from PDF: ${error.message}`,
        error.stack
      );
      return null;
    }
  }

  async uploadAudio(file: Express.Multer.File) {
    const uploadOptions: UploadApiOptions = {
      folder: "audios",
      resource_type: "video", // Use 'video' for audio uploads
      timeout: this.DEFAULT_TIMEOUT,
    };

    this.logger.log(
      `Uploading audio: ${file.originalname} (${Math.round(file.size / 1024)} KB)`
    );
    return this.uploadToCloudinary(file, uploadOptions);
  }

  async uploadProfiles(file: Express.Multer.File) {
    const uploadOptions: UploadApiOptions = {
      folder: "profiles",
      crop: "fill",
      timeout: this.DEFAULT_TIMEOUT,
    };

    this.logger.log(
      `Uploading profile image: ${file.originalname} (${Math.round(file.size / 1024)} KB)`
    );
    return this.uploadToCloudinary(file, uploadOptions);
  }

  async uploadImages(file: Express.Multer.File) {
    const uploadOptions: UploadApiOptions = {
      folder: "room_images",
      crop: "fill",
      timeout: this.DEFAULT_TIMEOUT,
    };

    this.logger.log(
      `Uploading room image: ${file.originalname} (${Math.round(file.size / 1024)} KB)`
    );
    return this.uploadToCloudinary(file, uploadOptions);
  }

  private uploadToCloudinary(
    file: Express.Multer.File,
    options: UploadApiOptions
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const uploadStream = this.cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) {
            this.logger.error(`Upload failed: ${error.message}`, error.stack);
            return reject(error);
          }

          const uploadTime = Date.now() - startTime;
          this.logger.log(
            `Upload successful: ${result.public_id} (took ${uploadTime}ms)`
          );
          resolve(result);
        }
      );

      uploadStream.end(file.buffer);
    });
  }

  // Function to extract text from a Cloudinary resource
  // async extractTextFromDocument(publicId: string): Promise<string | null> {
  //   try {
  //     const result = await this.cloudinary.uploader.explicit(publicId, {
  //       type: "upload",
  //       ocr: "adv_ocr",
  //       timeout: this.DEFAULT_TIMEOUT,
  //     });

  //     if (
  //       result &&
  //       result.info &&
  //       result.info.ocr &&
  //       result.info.ocr.adv_ocr &&
  //       result.info.ocr.adv_ocr.data.length > 0
  //     ) {
  //       // Concatenate all extracted text
  //       const fullText = result.info.ocr.adv_ocr.data
  //         .map((page) => page.full_text)
  //         .join("\n");
  //       return fullText;
  //     } else {
  //       return null; // Or throw an error, depending on your needs
  //     }
  //   } catch (error) {
  //     console.error("Error extracting text:", error);
  //     return null; // Or throw the error
  //   }
  // }
}
