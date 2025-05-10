import { Module } from "@nestjs/common";
import { AudioService } from "./audio.service";
import { AudioController } from "./audio.controller";
import { DatabaseModule } from "src/infra/db/database.module";
import { SummaryModule } from "src/summary/summary.module";

@Module({
  controllers: [AudioController],
  providers: [AudioService],
  imports: [DatabaseModule, SummaryModule],
})
export class AudioModule {}
