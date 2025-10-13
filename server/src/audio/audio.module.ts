import { Module } from "@nestjs/common";
import { AudioService } from "./audio.service";
import { AudioController } from "./audio.controller";
import { DatabaseModule } from "src/infra/db/database.module";
import { SummaryModule } from "src/summary/summary.module";
import { ConfigModule } from "@nestjs/config";
import { AudioRepository } from "./audio.repository";

@Module({
  controllers: [AudioController],
  providers: [AudioService, AudioRepository],
  imports: [DatabaseModule, SummaryModule, ConfigModule],
  exports: [AudioService],
})
export class AudioModule {}
