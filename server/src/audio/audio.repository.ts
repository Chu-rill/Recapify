import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/infra/db/prisma.service";

@Injectable()
export class AudioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createAudio(
    title: string,
    duration: number,
    fileUrl: string,
    fileSize: number,
    format: string,
    voiceType: string,
    documentId: string,
    summaryId: string,
    userId: string
  ) {
    return this.prisma.audioTrack.create({
      data: {
        title,
        duration,
        fileUrl,
        fileSize,
        format,
        voiceType,
        documentId,
        summaryId,
        userId,
      },
    });
  }

  async findAllAudios() {
    return this.prisma.audioTrack.findMany();
  }
  async findAudioById(id: string) {
    return this.prisma.audioTrack.findUnique({
      where: { id },
    });
  }

  async findAudiosByUserId(userId: string) {
    return this.prisma.audioTrack.findMany({
      where: { userId },
    });
  }
}
