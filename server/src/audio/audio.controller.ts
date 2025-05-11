import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AudioService } from "./audio.service";
import { AuthRequest } from "src/types/auth.request";
import { AuthGuard } from "src/guard/auth.guard";

@UseGuards(AuthGuard)
@Controller("audio")
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  @Post(":summaryId")
  create(@Param("summaryId") summaryId: string) {
    let voiceType: string = "en-US-Neural2-F";
    return this.audioService.generateAudio(summaryId, voiceType);
  }

  @Get(":audioId")
  findOne(@Param("audioId") audioId: string) {
    return this.audioService.getAudioById(audioId);
  }
  @Get()
  findAll(@Req() req: AuthRequest) {
    const userId = req.user.id;
    return this.audioService.getAudiosByUserId(userId);
  }
}
