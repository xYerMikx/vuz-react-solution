import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { validateEnvironment } from "@/config/environment";
import { HealthModule } from "@/health/health.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { RedisModule } from "@/redis/redis.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    PrismaModule,
    RedisModule,
    HealthModule,
  ],
})
export class AppModule {}
