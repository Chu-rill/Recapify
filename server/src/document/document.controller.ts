// document.controller.ts
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { DocumentService } from "./document.service";
import { diskStorage } from "multer";
import { extname } from "path";
import { AuthGuard } from "src/guard/auth.guard";
import { AuthRequest } from "src/types/auth.request";

@UseGuards(AuthGuard)
@Controller("documents")
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads",
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + "-" + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (file.mimetype !== "application/pdf") {
          return callback(new Error("Only PDF files are allowed"), false);
        }
        callback(null, true);
      },
    })
  )
  async uploadDocument(@UploadedFile() file, @Body() body, req: AuthRequest) {
    const userId = req.user.id;
    return this.documentService.processDocument(file, userId);
  }
}
