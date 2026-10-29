import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { ACCESS_COOKIE } from "./auth.cookies";

interface AccessRequest {
  cookies?: Record<string, unknown>;
  userId?: string;
}

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AccessRequest>();
    const token = request.cookies?.[ACCESS_COOKIE];
    if (typeof token !== "string" || token.length === 0) {
      throw new UnauthorizedException({
        error: "UNAUTHORIZED",
        message: "Missing access token",
      });
    }

    try {
      const payload = this.jwt.verify<{ sub: string }>(token);
      if (typeof payload.sub !== "string" || payload.sub.length === 0) {
        throw new Error("missing subject");
      }
      request.userId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException({
        error: "UNAUTHORIZED",
        message: "Invalid access token",
      });
    }
  }
}
