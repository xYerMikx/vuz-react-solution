import type { INestApplication } from "@nestjs/common";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import type { Redis } from "ioredis";
import type { Server, ServerOptions } from "socket.io";

import { REALTIME_PATH } from "./realtime.path";

export class RedisIoAdapter extends IoAdapter {
  constructor(
    app: INestApplication,
    private readonly pub: Redis,
    private readonly sub: Redis,
    private readonly origin: string,
  ) {
    super(app);
  }

  override createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, {
      ...options,
      path: REALTIME_PATH,
      cors: { origin: this.origin, credentials: true },
    } as ServerOptions);

    server.adapter(createAdapter(this.pub, this.sub));

    return server;
  }
}
