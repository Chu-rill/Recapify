import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import * as bodyParser from "body-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("/api/v1");
  const limiter = rateLimit({
    max: 100, // 100 requests
    windowMs: 60 * 60 * 1000, // 1 hour
    message:
      "We have received too many requests from this IP. Please try again after one hour.",
  });
  app.use(limiter);
  app.use(helmet());
  app.use(bodyParser.json({ limit: "50mb" }));
  app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
  const corsOrigin = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",")
    : ["http://localhost:5173", "https://localhost:5174"];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list
      if (corsOrigin.indexOf(origin) !== -1 || corsOrigin.includes('*')) {
        callback(null, true);
      } else {
        // For production, you might want to be more strict
        // For now, allow all Vercel preview deployments
        if (origin.includes('.vercel.app') || origin.includes('localhost')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });
  let port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`📍 Server: http://localhost:${port}`);
}
bootstrap();
