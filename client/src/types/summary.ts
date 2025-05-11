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
