import api from "./api";
import { AudioResponse, AudiosResponse } from "../types/audio";

export const generateAudio = async (
  summaryId: string
): Promise<AudioResponse> => {
  const response = await api.post<AudioResponse>(`/api/v1/audio/${summaryId}`);
  return response.data;
};

export const getAudios = async (): Promise<AudiosResponse> => {
  const response = await api.get<AudiosResponse>("/api/v1/audio");
  return response.data;
};

export const getAudio = async (audioId: string): Promise<AudioResponse> => {
  const response = await api.get<AudioResponse>(`/api/v1/audio/${audioId}`);
  return response.data;
};
