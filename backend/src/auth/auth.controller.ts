import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { AccessTokenGuard } from "./access-token.guard";
import {
  clearSessionCookies,
  REFRESH_COOKIE,
  writeSessionCookies,
} from "./auth.cookies";
import { AuthService, type Session } from "./auth.service";
import { CurrentUserId } from "./current-user-id";
import { CredentialsDto } from "./dto/credentials.dto";

interface CookieRequest {
  cookies?: Record<string, unknown>;
}

interface CookieResponse {
  cookie(name: string, value: string, options: object): void;
  clearCookie(name: string, options: object): void;
}

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post("register")
  @ApiOperation({ summary: "Create an account and start a session" })
  @ApiOkResponse({ description: "The new user. Tokens are set as cookies" })
  async register(
    @Body() body: CredentialsDto,
    @Res({ passthrough: true }) response: CookieResponse,
  ) {
    const session = await this.auth.register(body.email, body.password);
    this.attach(response, session);
    return session.user;
  }

  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "Start a session" })
  @ApiOkResponse({ description: "The user. Tokens are set as cookies" })
  async login(
    @Body() body: CredentialsDto,
    @Res({ passthrough: true }) response: CookieResponse,
  ) {
    const session = await this.auth.login(body.email, body.password);
    this.attach(response, session);
    return session.user;
  }

  @Post("refresh")
  @HttpCode(200)
  @ApiOperation({
    summary: "Rotate the refresh cookie and issue a new access cookie",
  })
  async refresh(
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: CookieResponse,
  ) {
    try {
      const session = await this.auth.refresh(this.refreshCookie(request));
      this.attach(response, session);
      return session.user;
    } catch (error) {
      clearSessionCookies(response, this.config);
      throw error;
    }
  }

  @Post("logout")
  @HttpCode(204)
  @ApiOperation({
    summary: "Revoke the current refresh token and clear both cookies",
  })
  async logout(
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: CookieResponse,
  ): Promise<void> {
    await this.auth.logout(this.refreshCookie(request));
    clearSessionCookies(response, this.config);
  }

  @Get("me")
  @UseGuards(AccessTokenGuard)
  @ApiOperation({ summary: "The user for the access cookie" })
  me(@CurrentUserId() userId: string) {
    return this.auth.me(userId);
  }

  private attach(response: CookieResponse, session: Session): void {
    writeSessionCookies(response, this.config, session);
  }

  private refreshCookie(request: CookieRequest): string | undefined {
    const value = request.cookies?.[REFRESH_COOKIE];
    return typeof value === "string" ? value : undefined;
  }
}
