// document.controller.ts
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { DocumentService } from "./document.service";
import { AuthGuard } from "src/guard/auth.guard";
import { AuthRequest } from "src/types/auth.request";

@UseGuards(AuthGuard)
@Controller("documents")
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthRequest
  ) {
    const userId = req.user.id;
    return this.documentService.processDocument(file, userId);
  }
}
