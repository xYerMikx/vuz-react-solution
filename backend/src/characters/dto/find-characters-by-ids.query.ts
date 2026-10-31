import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class FindCharactersByIdsQuery {
  @ApiProperty({
    description:
      "Comma-separated character ids, 1 to 6, unique. The response uses this order",
  })
  @IsString()
  ids!: string;
}
