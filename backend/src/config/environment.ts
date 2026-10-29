import { plainToInstance, Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  validateSync,
} from "class-validator";

import { readCookieSecure } from "@/auth/read-cookie-secure";

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

  @IsString()
  @MinLength(16)
  JWT_SECRET!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  JWT_ACCESS_TTL_SECONDS: number = 900;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  REFRESH_TTL_SECONDS: number = 2_592_000;

  @IsBoolean()
  COOKIE_SECURE: boolean = false;
}

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(
    EnvironmentVariables,
    { ...config, COOKIE_SECURE: readCookieSecure(config["COOKIE_SECURE"]) },
    {
      enableImplicitConversion: true,
    },
  );
  const errors = validateSync(validated, {
    skipMissingProperties: false,
    whitelist: true,
  });

  if (errors.length > 0) {
    throw new Error(`Invalid environment:\n${errors.toString()}`);
  }

  return validated;
}
