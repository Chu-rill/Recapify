// pdf.service.ts
import { Injectable } from "@nestjs/common";
import * as pdfParse from "pdf-parse";
import * as fs from "fs";

@Injectable()
export class PdfService {
  async extractText(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    try {
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }
}
