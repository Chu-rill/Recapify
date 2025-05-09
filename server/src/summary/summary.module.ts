import { Module } from "@nestjs/common";
import { SummaryService } from "./summary.service";
import { SummaryController } from "./summary.controller";
import { DocumentModule } from "src/document/document.module";

@Module({
  controllers: [SummaryController],
  providers: [SummaryService],
  imports: [DocumentModule],
})
export class SummaryModule {}
