import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

import { SQUAD_NAME_MAX_LENGTH } from "@/squads/normalize-squad-name";
import { SQUAD_SIZE_LIMIT } from "@/squads/squad.rules";

export class CreateSquadDto {
  @ApiProperty({ minLength: 1, maxLength: SQUAD_NAME_MAX_LENGTH })
  @IsString()
  @MinLength(1)
  @MaxLength(SQUAD_NAME_MAX_LENGTH)
  name!: string;

  @ApiPropertyOptional({ type: [Number], maxItems: SQUAD_SIZE_LIMIT })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(SQUAD_SIZE_LIMIT)
  @IsInt({ each: true })
  characterIds?: number[];
}
