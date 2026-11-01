import type { INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { RedisIoAdapter } from "./redis-io.adapter";
import { RealtimeRedis } from "./realtime.redis";

export function attachRealtime(app: INestApplication): void {
  const config = app.get(ConfigService);
  const redis = app.get(RealtimeRedis);

  app.useWebSocketAdapter(
    new RedisIoAdapter(
      app,
      redis.pub,
      redis.sub,
      config.getOrThrow<string>("CORS_ORIGIN"),
    ),
  );
}
