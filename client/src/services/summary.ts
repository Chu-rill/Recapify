import api from "../lib/axios";
import { AllSummaryResponse, SummaryResponse } from "../types";

const BASE_URL = "/summary"; // Assuming your NestJS controller route is '/summary'

export const summaryService = {
  /**
   * Fetches a summary for a specific document.
   * @param documentId The ID of the document to fetch the summary for.
   * @returns A promise that resolves to a SummaryResponse object.
   */
  async getSummary(documentId: string) {
    try {
      const response = await api.get<SummaryResponse>(
        `${BASE_URL}/${documentId}`
      );
      return response.data.data;
    } catch (error: any) {
      // Handle errors appropriately
      console.error("Error fetching summary:", error);
      throw error; // Re-throw the error for the calling function to handle
    }
  },

  async getAllSummary() {
    try {
      const response = await api.get<AllSummaryResponse>(`${BASE_URL}`);
      return response;
    } catch (error: any) {
      // Handle errors appropriately
      console.error("Error fetching summary:", error);
      throw error; // Re-throw the error for the calling function to handle
    }
  },

  async createSummary(documentId: string) {
    try {
      const response = await api.post<SummaryResponse>(
        `${BASE_URL}/${documentId}`
      );
      return response.data.data;
    } catch (error: any) {
      // Handle errors appropriately
      console.error("Error fetching summary:", error);
      throw error; // Re-throw the error for the calling function to handle
    }
  },
};
