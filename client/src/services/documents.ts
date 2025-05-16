import api from "../lib/axios";
import { DocumentResponse, DocumentsResponse, SummaryResponse } from "../types";

export const documentService = {
  // Upload a document
  async uploadDocument(file: File, onProgress?: (percentage: number) => void) {
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
      }
    );

    return response.data;
  },

  // Get all documents for current user
  async getAllDocuments() {
    const response = await api.get<DocumentsResponse>("/documents");
    return response;
  },

  // Get a specific document
  async getDocument(documentId: string) {
    const response = await api.get<DocumentResponse>(
      `/documents/${documentId}`
    );
    return response.data;
  },

  // Delete a document
  async deleteDocument(documentId: string) {
    const response = await api.delete<DocumentResponse>(
      `/documents/${documentId}`
    );
    return response.data;
  },

  // Get summary for a document
  async getSummary(documentId: string) {
    const response = await api.get<SummaryResponse>(`/summary/${documentId}`);
    return response.data;
  },
};
