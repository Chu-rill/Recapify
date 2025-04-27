import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/infra/db/prisma.service";

@Injectable()
export class DocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createDocument(
    title: string,
    fileName: string,
    fileUrl: string,
    fileSize: number,
    fileType: string,
    userId: string,
    pageCount?: number
  ) {
    const document = await this.prisma.document.create({
      data: {
        title,
        fileName,
        fileUrl,
        fileSize,
        fileType,
        userId,
        pageCount,
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
