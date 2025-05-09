import { Inject, Injectable } from "@nestjs/common";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { Express } from "express";

@Injectable()
export class CloudinaryService {
  constructor(@Inject("CLOUDINARY") private cloudinary) {}

  async uploadDocument(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        {
          folder: "documents",
          resource_type: "raw",
          ocr: "adv_ocr", // Enable advanced OCR
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(file.buffer);
    });
  }

  async uploadAudio(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        {
          folder: "audios", // Adjust folder as needed
          resource_type: "video", // Use 'video' for audio uploads
          // allowed_formats: ['mp3', 'wav', 'ogg'], // Optional: Restrict file types
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(file.buffer);
    });
  }

  async uploadProfiles(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        {
          folder: "profiles",
          // width: 150,
          // height: 150,
          crop: "fill",
          timeout: 60000,
        }, // Adjust folder as needed
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(file.buffer);
    });
  }

  async uploadImages(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        {
          folder: "room_images",
          // width: 150,
          // height: 150,
          crop: "fill",
          timeout: 60000,
        }, // Adjust folder as needed
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(file.buffer);
    });
  }

  // Function to extract text from a Cloudinary resource
  async extractTextFromDocument(publicId: string): Promise<string | null> {
    try {
      const result = await this.cloudinary.uploader.explicit(publicId, {
        type: "upload",
        ocr: "adv_ocr",
      });

      if (
        result &&
        result.info &&
        result.info.ocr &&
        result.info.ocr.adv_ocr &&
        result.info.ocr.adv_ocr.data.length > 0
      ) {
        // Concatenate all extracted text
        const fullText = result.info.ocr.adv_ocr.data
          .map((page) => page.full_text)
          .join("\n");
        return fullText;
      } else {
        return null; // Or throw an error, depending on your needs
      }
    } catch (error) {
      console.error("Error extracting text:", error);
      return null; // Or throw the error
    }
  }
}
