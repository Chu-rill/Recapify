import { Module } from "@nestjs/common";
import { DocumentService } from "./document.service";
import { DocumentController } from "./document.controller";
import { DocumentRepository } from "./document.repository";
import { DatabaseModule } from "src/infra/db/database.module";
import { CloudinaryModule } from "src/infra/cloudinary/cloudinary.module";

@Module({
  controllers: [DocumentController],
  providers: [DocumentService, DocumentRepository],
  exports: [DocumentService, DocumentRepository],
  imports: [DatabaseModule, CloudinaryModule],
})
export class DocumentModule {}
