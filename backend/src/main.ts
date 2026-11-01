import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "@/app.module";
import { attachRealtime } from "@/realtime/attach-realtime";
import { setupApp } from "@/setup-app";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  setupApp(app);
  attachRealtime(app);
  app.enableShutdownHooks();
  await app.listen(app.get(ConfigService).getOrThrow<number>("PORT"));
}

void bootstrap();
