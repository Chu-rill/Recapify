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
}
