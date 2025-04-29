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
          folder: "documents", // Adjust folder as needed
          resource_type: "raw", // Important for non-image files
          // allowed_formats: ['pdf'], // Optional: Restrict file types
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
}
