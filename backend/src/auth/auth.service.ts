import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Prisma, type PrismaClient } from "@generated/prisma/client";
import * as argon2 from "argon2";

import { PrismaService } from "@/prisma/prisma.service";

import { normalizeEmail } from "./normalize-email";
import { createRefreshToken, hashToken } from "./token-hash";

const UNIQUE_CONSTRAINT_FAILED = "P2002";

export interface PublicUser {
  id: string;
  email: string;
}

export interface Session {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

type Database = PrismaClient | Prisma.TransactionClient;

interface RefreshRow {
  id: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

@Injectable()
export class AuthService {
  private dummyHashPromise: Promise<string> | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(email: string, password: string): Promise<Session> {
    const normalizedEmail = normalizeEmail(email);
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { email: normalizedEmail, passwordHash },
        });
        return this.issueSession(tx, user);
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_FAILED
      ) {
        throw new ConflictException({
          error: "EMAIL_TAKEN",
          message: "Email is already registered",
        });
      }
      throw error;
    }
  }

  async login(email: string, password: string): Promise<Session> {
    const user = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
    });
    const passwordHash = user?.passwordHash ?? (await this.dummyHash());
    const matches = await argon2.verify(passwordHash, password);
    if (!user || !matches) {
      throw new UnauthorizedException({
        error: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      });
    }
    return this.prisma.$transaction((tx) => this.issueSession(tx, user));
  }

  async refresh(rawToken: string | undefined): Promise<Session> {
    if (!rawToken) {
      throw new UnauthorizedException({
        error: "UNAUTHORIZED",
        message: "Missing refresh token",
      });
    }

    const outcome = await this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<RefreshRow[]>`
        SELECT id, "userId", "expiresAt", "revokedAt"
        FROM "RefreshToken"
        WHERE "tokenHash" = ${hashToken(rawToken)}
        FOR UPDATE
      `;
      const row = rows[0];

      if (!row) {
        return { kind: "invalid" as const };
      }

      if (row.revokedAt) {
        await tx.refreshToken.updateMany({
          where: { userId: row.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });

        return { kind: "reused" as const };
      }

      if (new Date(row.expiresAt).getTime() <= Date.now()) {
        await tx.refreshToken.update({
          where: { id: row.id },
          data: { revokedAt: new Date() },
        });

        return { kind: "expired" as const };
      }

      await tx.refreshToken.update({
        where: { id: row.id },
        data: { revokedAt: new Date() },
      });
      const user = await tx.user.findUniqueOrThrow({
        where: { id: row.userId },
      });
      const session = await this.issueSession(tx, user);

      return { kind: "ok" as const, session };
    });

    if (outcome.kind === "ok") {
      return outcome.session;
    }

    throw new UnauthorizedException({
      error: "UNAUTHORIZED",
      message:
        outcome.kind === "reused"
          ? "Refresh token reuse"
          : "Invalid refresh token",
    });
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;

    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException({
        error: "UNAUTHORIZED",
        message: "Invalid access token",
      });
    }

    return { id: user.id, email: user.email };
  }

  private async issueSession(
    db: Database,
    user: { id: string; email: string },
  ): Promise<Session> {
    const refreshToken = createRefreshToken();
    const ttlSeconds = this.config.getOrThrow<number>("REFRESH_TTL_SECONDS");
    await db.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + ttlSeconds * 1000),
      },
    });
    const accessToken = await this.jwt.signAsync({ sub: user.id });
    return {
      user: { id: user.id, email: user.email },
      accessToken,
      refreshToken,
    };
  }

  private dummyHash(): Promise<string> {
    this.dummyHashPromise ??= argon2.hash("not-a-user-password", {
      type: argon2.argon2id,
    });
    return this.dummyHashPromise;
  }
}
