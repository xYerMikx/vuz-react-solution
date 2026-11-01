import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";

import { RealtimeGateway } from "./realtime.gateway";
import { RealtimeRedis } from "./realtime.redis";
import { SquadRealtime } from "./squad-realtime";

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: config.getOrThrow<number>("JWT_ACCESS_TTL_SECONDS"),
        },
      }),
    }),
  ],
  providers: [RealtimeRedis, RealtimeGateway, SquadRealtime],
  exports: [SquadRealtime],
})
export class RealtimeModule {}
