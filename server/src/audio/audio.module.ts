import { Module } from "@nestjs/common";
import { AudioService } from "./audio.service";
import { AudioController } from "./audio.controller";
import { DatabaseModule } from "src/infra/db/database.module";
import { SummaryModule } from "src/summary/summary.module";
import { ConfigModule } from "@nestjs/config";
import { CloudinaryModule } from "src/infra/cloudinary/cloudinary.module";
import { AudioRepository } from "./audio.repository";

@Module({
  controllers: [AudioController],
  providers: [AudioService, AudioRepository],
  imports: [DatabaseModule, SummaryModule, ConfigModule, CloudinaryModule],
  exports: [AudioService],
})
export class AudioModule {}
