import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { AudioService } from "./audio.service";

@Controller("audio")
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  @Post(":summaryId")
  create(@Param("summaryId") summaryId: string) {
    let voiceType: string = "en-US-Neural2-F";
    return this.audioService.generateAudio(summaryId, voiceType);
  }
}
