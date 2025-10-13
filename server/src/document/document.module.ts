import { Module } from "@nestjs/common";
import { DocumentService } from "./document.service";
import { DocumentController } from "./document.controller";
import { DocumentRepository } from "./document.repository";
import { DatabaseModule } from "src/infra/db/database.module";
import { SupabaseModule } from "src/infra/supabase/supabase.module";
import { JwtModule } from "@nestjs/jwt";

@Module({
  controllers: [DocumentController],
  providers: [DocumentService, DocumentRepository],
  exports: [DocumentService, DocumentRepository],
  imports: [DatabaseModule, SupabaseModule, JwtModule],
})
export class DocumentModule {}
