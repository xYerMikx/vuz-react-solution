import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  readonly client: Redis;

  constructor(config: ConfigService) {
    this.client = new Redis(config.getOrThrow<string>("REDIS_URL"), {
      connectTimeout: 1_000,
      commandTimeout: 1_000,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
  }

  async onModuleInit(): Promise<void> {
    if (this.client.status === "ready") return;
    await new Promise<void>((resolve) => {
      const finish = () => {
        this.client.off("ready", finish);
        this.client.off("error", finish);
        resolve();
      };
      this.client.once("ready", finish);
      this.client.once("error", finish);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
