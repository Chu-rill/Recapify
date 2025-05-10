import { Module } from "@nestjs/common";
import { SummaryService } from "./summary.service";
import { SummaryController } from "./summary.controller";
import { DocumentModule } from "src/document/document.module";
import { SummaryRepository } from "./summary.repository";
import { GeminiModule } from "src/gemini/gemini.module";
import { DatabaseModule } from "src/infra/db/database.module";

@Module({
  controllers: [SummaryController],
  providers: [SummaryService, SummaryRepository],
  imports: [DocumentModule, GeminiModule, DatabaseModule],
  exports: [SummaryService, SummaryRepository],
})
export class SummaryModule {}
