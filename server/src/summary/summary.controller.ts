import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from "@nestjs/common";
import { SummaryService } from "./summary.service";
import { AuthGuard } from "src/guard/auth.guard";
import { AuthRequest } from "src/types/auth.request";

@UseGuards(AuthGuard)
@Controller("summary")
export class SummaryController {
  constructor(private readonly summaryService: SummaryService) {}

  @Post(":documentId")
  create(@Param("documentId") documentId: string) {
    return this.summaryService.generateSummary(documentId);
  }

  // Get summary for a document
  @Get(":documentId")
  getSummary(@Param("documentId") documentId: string) {
    return this.summaryService.getSummaryByDocumentId(documentId);
  }

  @Get()
  findAll(@Req() req: AuthRequest) {
    const userId = req.user.id;
    return this.summaryService.findAllSummariesByUserId(userId);
  }
}
