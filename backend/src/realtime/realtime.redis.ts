import { Injectable, OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RealtimeRedis implements OnApplicationShutdown {
  readonly pub: Redis;
  readonly sub: Redis;

  constructor(config: ConfigService) {
    this.pub = new Redis(config.getOrThrow<string>("REDIS_URL"), {
      maxRetriesPerRequest: null,
    });
    this.sub = this.pub.duplicate();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.sub.quit();
    await this.pub.quit();
  }
}
