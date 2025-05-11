import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/infra/db/prisma.service";

@Injectable()
export class SummaryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createSummary(
    content: string,
    shortSummary: string | null,
    keyPoints: string[],
    documentId: string
  ) {
    return this.prisma.summary.create({
      data: {
        content,
        shortSummary,
        keyPoints,
        documentId,
      },
    });
  }

  async findSummaryByDocumentId(documentId: string) {
    return this.prisma.summary.findUnique({
      where: { documentId },
    });
  }
  async findSummaryById(id: string) {
    return this.prisma.summary.findUnique({
      where: { id },
      include: {
        document: {
          select: {
            id: true,
            fileName: true,
            userId: true,
          },
        },
      },
    });
  }

  async updateSummary(id: string, data: any) {
    return this.prisma.summary.update({
      where: { id },
      data,
    });
  }

  async deleteSummary(id: string) {
    return this.prisma.summary.delete({
      where: { id },
    });
  }

  async findAllSummaries() {
    return this.prisma.summary.findMany();
  }

  async findSummariesByUserId(userId: string) {
    return this.prisma.summary.findMany({
      where: {
        document: {
          userId: userId,
        },
      },
    });
  }
}
