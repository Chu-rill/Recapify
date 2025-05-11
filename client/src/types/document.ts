export interface Document {
  id: string;
  name: string;
  fileType: string;
  userId: string;
  createdAt: string;
  status?: "pending" | "processing" | "completed" | "failed";
}

export interface DocumentResponse {
  status: string;
  error: boolean;
  statusCode: number;
  data: Document;
  message: string;
}

export interface DocumentsResponse {
  status: string;
  error: boolean;
  statusCode: number;
  data: Document[];
  message: string;
}
