import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { CharactersService } from "./characters.service";
import { ListCharactersQuery } from "./dto/list-characters.query";

@ApiTags("characters")
@Controller("characters")
export class CharactersController {
  constructor(private readonly characters: CharactersService) {}

  @Get()
  @ApiOperation({ summary: "List characters, filtered and paginated" })
  @ApiOkResponse({ description: "A page of characters and the next cursor" })
  list(@Query() query: ListCharactersQuery) {
    return this.characters.list(query);
  }

  @Get("filters")
  @ApiOperation({ summary: "Tag and universe values for the filter UI" })
  @ApiOkResponse({
    description: "Tags in first-appearance order, then universes",
  })
  filters() {
    return this.characters.filters();
  }

  @Get(":id")
  @ApiOperation({ summary: "One character" })
  @ApiOkResponse({ description: "The character" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.characters.findOne(id);
  }
}
