import api from "../lib/axios";
import type { AudioResponse, AudiosResponse } from "../types";

export const audioService = {
  // Generate audio from a summary
  async generateAudio(summaryId: string) {
    const response = await api.post<AudioResponse>(`/audio/${summaryId}`);
    return response.data;
  },

  // Get all audio summaries for current user
  async getAllAudio() {
    const response = await api.get<AudiosResponse>("/audio");
    return response.data;
  },

  // Get a specific audio summary
  async getAudio(audioId: string) {
    const response = await api.get<AudioResponse>(`/audio/${audioId}`);
    return response.data;
  },

  // Delete an audio summary
  async deleteAudio(audioId: string) {
    const response = await api.delete<AudioResponse>(`/audio/${audioId}`);
    return response.data;
  },
};
