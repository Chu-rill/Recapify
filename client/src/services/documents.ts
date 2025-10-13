import api from "../lib/axios";
import { DocumentResponse, DocumentsResponse, SummaryResponse } from "../types";

// File size constants
export const FILE_SIZE_LIMITS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB - More realistic for PDFs and documents
  MIN_FILE_SIZE: 1 * 1024, // 1KB - Minimum file size
};

// Supported file types
export const SUPPORTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
} as const;

export const SUPPORTED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt"];

// Validation helpers
export const validateFileSize = (file: File): { valid: boolean; error?: string } => {
  if (file.size > FILE_SIZE_LIMITS.MAX_FILE_SIZE) {
    const maxSizeMB = FILE_SIZE_LIMITS.MAX_FILE_SIZE / (1024 * 1024);
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit. Please upload a smaller file.`
    };
  }

  if (file.size < FILE_SIZE_LIMITS.MIN_FILE_SIZE) {
    return {
      valid: false,
      error: "File is too small or empty. Please upload a valid document."
    };
  }

  return { valid: true };
};

export const validateFileType = (file: File): { valid: boolean; error?: string } => {
  const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;

  if (!SUPPORTED_EXTENSIONS.includes(fileExtension)) {
    return {
      valid: false,
      error: `Unsupported file type. Please upload ${SUPPORTED_EXTENSIONS.join(', ')} files.`
    };
  }

  return { valid: true };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const documentService = {
  // Upload a document with validation
  async uploadDocument(file: File, onProgress?: (percentage: number) => void) {
    // Validate file type
    const typeValidation = validateFileType(file);
    if (!typeValidation.valid) {
      throw new Error(typeValidation.error);
    }

    // Validate file size
    const sizeValidation = validateFileSize(file);
    if (!sizeValidation.valid) {
      throw new Error(sizeValidation.error);
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<DocumentResponse>(
      "/documents/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percentage = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentage);
          }
        },
        timeout: 300000, // 5 minutes timeout for large files
      }
    );

    return response.data;
  },

  // Get all documents for current user
  async getAllDocuments() {
    try {
      const response = await api.get<DocumentsResponse>("/documents");
      return response;
    } catch (error) {
      console.error("Error fetching documents:", error);
      throw new Error("Failed to fetch documents. Please try again.");
    }
  },

  // Get a specific document
  async getDocument(documentId: string) {
    if (!documentId) {
      throw new Error("Document ID is required");
    }

    try {
      const response = await api.get<DocumentResponse>(
        `/documents/${documentId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching document ${documentId}:`, error);
      throw new Error("Failed to fetch document. Please try again.");
    }
  },

  // Delete a document
  async deleteDocument(documentId: string) {
    if (!documentId) {
      throw new Error("Document ID is required");
    }

    try {
      const response = await api.delete<DocumentResponse>(
        `/documents/${documentId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error deleting document ${documentId}:`, error);
      throw new Error("Failed to delete document. Please try again.");
    }
  },

  // Get summary for a document
  async getSummary(documentId: string) {
    if (!documentId) {
      throw new Error("Document ID is required");
    }

    try {
      const response = await api.get<SummaryResponse>(`/summary/${documentId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching summary for document ${documentId}:`, error);
      throw new Error("Failed to fetch summary. Please try again.");
    }
  },

  // Batch upload multiple documents
  async uploadMultipleDocuments(
    files: File[],
    onProgress?: (fileIndex: number, percentage: number) => void
  ) {
    const uploadPromises = files.map((file, index) =>
      this.uploadDocument(file, (percentage) => {
        onProgress?.(index, percentage);
      })
    );

    try {
      const results = await Promise.allSettled(uploadPromises);
      const successful = results.filter((r) => r.status === "fulfilled");
      const failed = results.filter((r) => r.status === "rejected");

      return {
        successful: successful.length,
        failed: failed.length,
        total: files.length,
        results,
      };
    } catch (error) {
      console.error("Error uploading multiple documents:", error);
      throw new Error("Failed to upload documents. Please try again.");
    }
  },
};
