import api from "./api";
import { DocumentResponse, DocumentsResponse } from "../types/document";

export const uploadDocument = async (file: File): Promise<DocumentResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<DocumentResponse>(
    "/api/v1/documents/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const getDocuments = async (): Promise<DocumentsResponse> => {
  const response = await api.get<DocumentsResponse>("/api/v1/documents");
  return response.data;
};

export const getDocument = async (
  documentId: string
): Promise<DocumentResponse> => {
  const response = await api.get<DocumentResponse>(
    `/api/v1/documents/${documentId}`
  );
  return response.data;
};

export const deleteDocument = async (
  documentId: string
): Promise<DocumentResponse> => {
  const response = await api.delete<DocumentResponse>(
    `/api/v1/documents/${documentId}`
  );
  return response.data;
};
