import {
  BadRequestException,
  ValidationPipe,
  type INestApplication,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { type ValidationError } from "class-validator";
import cookieParser from "cookie-parser";

import { ApiExceptionFilter } from "@/common/filters/api-exception.filter";

export function setupApp(app: INestApplication): void {
  const config = app.get(ConfigService);

  app.use(cookieParser());
  app.setGlobalPrefix("api/v1", { exclude: ["health"] });
  app.enableCors({
    origin: config.getOrThrow<string>("CORS_ORIGIN"),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) =>
        new BadRequestException({
          error: "VALIDATION_ERROR",
          message: errors.flatMap((error) =>
            Object.values(error.constraints ?? {}),
          ),
        }),
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());

  SwaggerModule.setup(
    "api/docs",
    app,
    SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle("Squad of Champions")
        .setDescription("API for the Squad of Champions challenge")
        .setVersion("1.0")
        .addCookieAuth("access_token")
        .build(),
    ),
  );
}
