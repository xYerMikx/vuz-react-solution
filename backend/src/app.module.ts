import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AuthModule } from "@/auth/auth.module";
import { CharactersModule } from "@/characters/characters.module";
import { validateEnvironment } from "@/config/environment";
import { HealthModule } from "@/health/health.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { RedisModule } from "@/redis/redis.module";
import { SquadsModule } from "@/squads/squads.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    PrismaModule,
    RedisModule,
    HealthModule,
    CharactersModule,
    AuthModule,
    SquadsModule,
  ],
})
export class AppModule {}
