import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
} from "@nestjs/terminus";

import { PrismaService } from "@/prisma/prisma.service";
import { RedisHealthIndicator } from "./redis.health";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
    private readonly redis: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: "Database and Redis status" })
  @ApiOkResponse({ description: "Both dependencies are reachable" })
  check() {
    return this.health.check([
      () => this.database.pingCheck("database", this.prisma),
      () => this.redis.isHealthy("redis"),
    ]);
  }
}
