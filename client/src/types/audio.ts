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
