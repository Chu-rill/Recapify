// User types
export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  role: string;
  isVerified: boolean;
}

export interface AuthResponse {
  statusCode: number;
  message: string;
  data: User;
  token?: string;
}

// Document types
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

// Summary types
export interface Summary {
  id: string;
  content: string;
  shortSummary: string;
  keyPoints: string[];
  documentId: string;
  wasTruncated: boolean;
  textLength: number;
  processedAt: string;
}

export interface SummaryResponse {
  status: string;
  error: boolean;
  statusCode: number;
  data: Summary;
  message: string;
}

export interface AllSummaryResponse {
  status: string;
  error: boolean;
  statusCode: number;
  data: Summary[];
  message: string;
}

// Audio types
export interface Audio {
  id: string;
  title: string;
  duration: number;
  fileUrl: string;
  fileSize: number;
  format: string;
  voiceType: string;
  documentId: string;
  summaryId: string;
  userId: string;
}

export interface AudioResponse {
  success: boolean;
  statusCode: number;
  data: Audio;
  message: string;
}

export interface AudiosResponse {
  success: boolean;
  statusCode: number;
  data: Audio[];
  message: string;
}
