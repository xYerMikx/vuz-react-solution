import { plainToInstance, Type } from "class-transformer";
import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  validateSync,
} from "class-validator";

class EnvironmentVariables {
  @IsString()
  @MinLength(1)
  DATABASE_URL!: string;

  @IsString()
  @MinLength(1)
  REDIS_URL!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  PORT: number = 3000;

  @IsString()
  @MinLength(1)
  CORS_ORIGIN: string = "http://localhost:5173";

  @IsOptional()
  @IsString()
  CHARACTERS_JSON_PATH?: string;
}

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, {
    skipMissingProperties: false,
    whitelist: true,
  });

  if (errors.length > 0) {
    throw new Error(`Invalid environment:\n${errors.toString()}`);
  }

  return validated;
}
