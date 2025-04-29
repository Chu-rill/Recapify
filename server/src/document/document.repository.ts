import { ProcessingStatus } from "@generated/prisma";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/infra/db/prisma.service";

@Injectable()
export class DocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createDocument(
    fileName: string,
    fileUrl: string,
    fileType: string,
    userId: string,
    processingStatus: ProcessingStatus
  ) {
    const document = await this.prisma.document.create({
      data: {
        fileName,
        fileUrl,
        fileType,
        userId,
        processingStatus,
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
    return this.prisma.document.delete({
      where: { id },
    });
  }
}
