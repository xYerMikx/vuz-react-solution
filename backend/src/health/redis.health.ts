import { Injectable } from "@nestjs/common";
import { HealthIndicatorService } from "@nestjs/terminus";

import { RedisService } from "@/redis/redis.service";

@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly health: HealthIndicatorService,
    private readonly redis: RedisService,
  ) {}

  isHealthy(key: string) {
    return this.health.check(key).attempt(async () => {
      const reply = await this.redis.client.ping();
      if (reply !== "PONG") {
        throw new Error("Redis did not respond");
      }
    });
  }
}
