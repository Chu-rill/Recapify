import { ProcessingStatus } from "@generated/prisma";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/infra/db/prisma.service";

@Injectable()
export class DocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createDocument(
    fileName: string,
    fileType: string,
    userId: string,
    extractedText: string,
    processingStatus: ProcessingStatus,
    fileUrl?: string,
    filePath?: string,
  ) {
    const document = await this.prisma.document.create({
      data: {
        fileName,
        fileType,
        userId,
        extractedText,
        processingStatus,
        fileUrl,
        filePath,
      },
    });
    return document;
  }

  async findDocumentById(id: string) {
    return this.prisma.document.findUnique({
      where: { id },
    });
  }

  async findDocumentsByUserId(userId: string) {
    return this.prisma.document.findMany({
      where: { userId },
    });
  }

  async updateDocument(id: string, data: any) {
    return this.prisma.document.update({
      where: { id },
      data,
    });
  }

  async deleteDocument(id: string) {
    try {
      // Check if document exists first
      const documentExists = await this.prisma.document.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!documentExists) {
        return { success: false, message: "Document not found" };
      }

      // If document exists, delete it
      await this.prisma.document.delete({
        where: { id },
      });

      return { success: true };
    } catch (error) {
      // Handle any other errors that might occur
      console.error(`Error while deleting document ${id}:`, error);
      throw error;
    }
  }

  async getExtractedText(id: string): Promise<string> {
    const document = await this.prisma.document.findUnique({
      where: { id },
      select: { extractedText: true },
    });
    if (!document) {
      return "No document";
    }
    return document.extractedText;
  }
  async deleteExtractedText(id: string): Promise<void> {
    await this.prisma.document.update({
      where: { id },
      data: { extractedText: "" },
    });
  }

  async findAllDocument() {
    return this.prisma.document.findMany();
  }

  async findDocumentByUserId(userId: string) {
    return this.prisma.document.findMany({
      where: { userId },
    });
  }
  async findFirstDocumentByUserId(userId: string) {
    return this.prisma.document.findFirst({
      where: { userId },
    });
  }
}
