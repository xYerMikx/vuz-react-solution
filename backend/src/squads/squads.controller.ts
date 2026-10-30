import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { AccessTokenGuard } from "@/auth/access-token.guard";
import { CurrentUserId } from "@/auth/current-user-id";

import { CreateSquadDto } from "./dto/create-squad.dto";
import { UpdateSquadDto } from "./dto/update-squad.dto";
import { SquadsService } from "./squads.service";

@ApiTags("squads")
@ApiCookieAuth("access_token")
@UseGuards(AccessTokenGuard)
@Controller("squads")
export class SquadsController {
  constructor(private readonly squads: SquadsService) {}

  @Get()
  @ApiOperation({ summary: "The current user's squads" })
  list(@CurrentUserId() userId: string) {
    return this.squads.list(userId);
  }

  @Post()
  @ApiOperation({ summary: "Create a squad of at most 6 characters" })
  create(@CurrentUserId() userId: string, @Body() body: CreateSquadDto) {
    return this.squads.create(userId, body);
  }

  @Get(":id")
  @ApiOperation({
    summary: "One of the current user's squads, with statistics",
  })
  findOne(
    @CurrentUserId() userId: string,
    @Param("id", ParseUUIDPipe) squadId: string,
  ) {
    return this.squads.findOne(userId, squadId);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Rename a squad or replace its roster" })
  update(
    @CurrentUserId() userId: string,
    @Param("id", ParseUUIDPipe) squadId: string,
    @Body() body: UpdateSquadDto,
  ) {
    return this.squads.update(userId, squadId, body);
  }

  @Delete(":id")
  @HttpCode(204)
  @ApiOperation({ summary: "Delete a squad and its members" })
  remove(
    @CurrentUserId() userId: string,
    @Param("id", ParseUUIDPipe) squadId: string,
  ) {
    return this.squads.remove(userId, squadId);
  }

  @Post(":id/characters/:characterId")
  @ApiOperation({ summary: "Add a character if the squad has room" })
  addMember(
    @CurrentUserId() userId: string,
    @Param("id", ParseUUIDPipe) squadId: string,
    @Param("characterId", ParseIntPipe) characterId: number,
  ) {
    return this.squads.addMember(userId, squadId, characterId);
  }

  @Delete(":id/characters/:characterId")
  @ApiOperation({ summary: "Remove a character from the squad" })
  removeMember(
    @CurrentUserId() userId: string,
    @Param("id", ParseUUIDPipe) squadId: string,
    @Param("characterId", ParseIntPipe) characterId: number,
  ) {
    return this.squads.removeMember(userId, squadId, characterId);
  }
}
