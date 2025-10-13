import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as pdfParse from 'pdf-parse';
import { Express } from 'express';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient;
  private readonly BUCKET_NAME = 'documents';

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Service Key must be provided');
    }

    // Use service role key to bypass RLS policies
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'X-Client-Info': 'recapify-server',
        },
        fetch: fetch.bind(globalThis),
      },
    });

    this.logger.log('Supabase client initialized successfully with service role key');
  }

  /**
   * Upload document to Supabase Storage and return public URL
   */
  async uploadDocument(
    file: Express.Multer.File,
    userId: string,
  ): Promise<{ publicUrl: string; path: string }> {
    try {
      // Generate unique file path
      const timestamp = Date.now();
      const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${userId}/${timestamp}-${sanitizedFilename}`;

      this.logger.log(
        `Uploading document: ${file.originalname} (${Math.round(file.size / 1024)} KB) to path: ${filePath}`,
      );

      // First, check if bucket exists
      const { data: buckets, error: bucketError } = await this.supabase.storage.listBuckets();

      if (bucketError) {
        this.logger.error(`Failed to list buckets: ${bucketError.message}`);
        this.logger.error(`Full bucket error:`, JSON.stringify(bucketError, null, 2));
      } else {
        this.logger.log(`Available buckets: ${buckets.map(b => b.name).join(', ')}`);
        const bucketExists = buckets.some(b => b.name === this.BUCKET_NAME);
        if (!bucketExists) {
          throw new Error(`Bucket '${this.BUCKET_NAME}' does not exist. Available buckets: ${buckets.map(b => b.name).join(', ')}`);
        }
      }

      // Upload file to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        this.logger.error(`Supabase upload error: ${error.message}`);
        this.logger.error(`Full error details:`, JSON.stringify(error, null, 2));
        throw new Error(`Failed to upload document: ${error.message}`);
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = this.supabase.storage.from(this.BUCKET_NAME).getPublicUrl(filePath);

      this.logger.log(`Document uploaded successfully: ${publicUrl}`);

      return {
        publicUrl,
        path: filePath,
      };
    } catch (error) {
      this.logger.error(`Error uploading document: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Extract text from PDF buffer
   */
  async extractTextFromPdfBuffer(fileBuffer: Buffer): Promise<string | null> {
    try {
      const data = await pdfParse(fileBuffer);
      return data.text;
    } catch (error) {
      this.logger.error(
        `Error extracting text from PDF: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Delete document from Supabase Storage
   */
  async deleteDocument(filePath: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        this.logger.error(`Failed to delete document: ${error.message}`);
        return false;
      }

      this.logger.log(`Document deleted successfully: ${filePath}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Error deleting document: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Upload audio file to Supabase Storage
   */
  async uploadAudio(
    buffer: Buffer,
    filename: string,
    userId: string,
  ): Promise<{ publicUrl: string; path: string }> {
    try {
      const timestamp = Date.now();
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `audios/${userId}/${timestamp}-${sanitizedFilename}`;

      this.logger.log(
        `Uploading audio: ${filename} (${Math.round(buffer.length / 1024)} KB)`,
      );

      const { data, error } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, buffer, {
          contentType: 'audio/mpeg',
          upsert: false,
        });

      if (error) {
        this.logger.error(`Supabase audio upload error: ${error.message}`);
        throw new Error(`Failed to upload audio: ${error.message}`);
      }

      const {
        data: { publicUrl },
      } = this.supabase.storage.from(this.BUCKET_NAME).getPublicUrl(filePath);

      this.logger.log(`Audio uploaded successfully: ${publicUrl}`);

      return {
        publicUrl,
        path: filePath,
      };
    } catch (error) {
      this.logger.error(`Error uploading audio: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get Supabase client instance (for advanced usage)
   */
  getClient(): SupabaseClient {
    return this.supabase;
  }
}
