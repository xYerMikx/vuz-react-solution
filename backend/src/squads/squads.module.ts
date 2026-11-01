import { Module } from "@nestjs/common";

import { AuthModule } from "@/auth/auth.module";
import { RealtimeModule } from "@/realtime/realtime.module";

import { SquadsController } from "./squads.controller";
import { SquadsService } from "./squads.service";

@Module({
  imports: [AuthModule, RealtimeModule],
  controllers: [SquadsController],
  providers: [SquadsService],
})
export class SquadsModule {}
