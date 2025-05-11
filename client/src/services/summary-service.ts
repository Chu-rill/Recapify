import api from "./api";
import { SummaryResponse } from "../types/summary";

export const getSummary = async (
  documentId: string
): Promise<SummaryResponse> => {
  const response = await api.get<SummaryResponse>(
    `/api/v1/summary/${documentId}`
  );
  return response.data;
};

export const generateSummary = async (
  documentId: string
): Promise<SummaryResponse> => {
  const response = await api.post<SummaryResponse>(
    `/api/v1/summary/${documentId}`
  );
  return response.data;
};
