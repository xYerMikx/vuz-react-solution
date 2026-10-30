import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import type { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import request from "supertest";

import { AppModule } from "@/app.module";
import { setupApp } from "@/setup-app";

import { cookieLines, cookieValue } from "./cookie";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readErrorCode(body: unknown): string {
  if (!isRecord(body) || typeof body.error !== "string") {
    throw new Error("Unexpected error payload");
  }

  return body.error;
}

function readUser(body: unknown): { id: string; email: string } {
  if (
    !isRecord(body) ||
    typeof body.id !== "string" ||
    typeof body.email !== "string"
  ) {
    throw new Error("Unexpected user payload");
  }
  return { id: body.id, email: body.email };
}

describe("Auth", () => {
  let app: INestApplication;
  const email = `fighter-${randomUUID()}@example.com`;
  const password = "correct-horse";

  beforeAll(async () => {
    app = await NestFactory.create(AppModule, { logger: false });
    setupApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("rejects a short password", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/register")
      .send({ email, password: "short" })
      .expect(400);
    expect(readErrorCode(response.body)).toBe("VALIDATION_ERROR");
  });

  it("registers, reads /me from the access cookie, and rejects a duplicate email", async () => {
    const server = app.getHttpServer();
    const registered = await request(server)
      .post("/api/v1/auth/register")
      .send({ email, password })
      .expect(201);

    const user = readUser(registered.body);
    expect(user.email).toBe(email);
    expect(registered.body).not.toHaveProperty("accessToken");
    expect(registered.body).not.toHaveProperty("passwordHash");

    const access = cookieLines(registered).find((line) =>
      line.startsWith("access_token="),
    );
    const refresh = cookieLines(registered).find((line) =>
      line.startsWith("refresh_token="),
    );
    expect(access?.toLowerCase()).toContain("httponly");
    expect(access?.toLowerCase()).toContain("samesite=strict");
    expect(access).toContain("Path=/api/v1");
    expect(refresh).toContain("Path=/api/v1/auth");

    const me = await request(server)
      .get("/api/v1/auth/me")
      .set("Cookie", `access_token=${cookieValue(registered, "access_token")}`)
      .expect(200);
    expect(readUser(me.body).id).toBe(user.id);

    const duplicate = await request(server)
      .post("/api/v1/auth/register")
      .send({ email: email.toUpperCase(), password })
      .expect(409);
    expect(readErrorCode(duplicate.body)).toBe("EMAIL_TAKEN");
  });

  it("uses the same error for an unknown email and a wrong password", async () => {
    const server = app.getHttpServer();
    const unknown = await request(server)
      .post("/api/v1/auth/login")
      .send({ email: `missing-${randomUUID()}@example.com`, password })
      .expect(401);
    const wrong = await request(server)
      .post("/api/v1/auth/login")
      .send({ email, password: "wrong-password" })
      .expect(401);

    expect(readErrorCode(unknown.body)).toBe("INVALID_CREDENTIALS");
    expect(readErrorCode(wrong.body)).toBe("INVALID_CREDENTIALS");
  });

  it("rotates the refresh cookie and revokes every session if the old one is reused", async () => {
    const server = app.getHttpServer();
    const loggedIn = await request(server)
      .post("/api/v1/auth/login")
      .send({ email, password })
      .expect(200);
    const firstRefresh = cookieValue(loggedIn, "refresh_token");

    const rotated = await request(server)
      .post("/api/v1/auth/refresh")
      .set("Cookie", `refresh_token=${firstRefresh}`)
      .expect(200);
    const secondRefresh = cookieValue(rotated, "refresh_token");
    expect(secondRefresh).not.toBe(firstRefresh);

    const reuse = await request(server)
      .post("/api/v1/auth/refresh")
      .set("Cookie", `refresh_token=${firstRefresh}`)
      .expect(401);
    expect(readErrorCode(reuse.body)).toBe("UNAUTHORIZED");

    await request(server)
      .post("/api/v1/auth/refresh")
      .set("Cookie", `refresh_token=${secondRefresh}`)
      .expect(401);
  });

  it("clears the session on logout", async () => {
    const server = app.getHttpServer();
    const loggedIn = await request(server)
      .post("/api/v1/auth/login")
      .send({ email, password })
      .expect(200);

    await request(server)
      .post("/api/v1/auth/logout")
      .set("Cookie", [
        `access_token=${cookieValue(loggedIn, "access_token")}`,
        `refresh_token=${cookieValue(loggedIn, "refresh_token")}`,
      ])
      .expect(204);

    await request(server)
      .post("/api/v1/auth/refresh")
      .set("Cookie", `refresh_token=${cookieValue(loggedIn, "refresh_token")}`)
      .expect(401);
  });

  it("rejects /me without an access cookie", async () => {
    await request(app.getHttpServer()).get("/api/v1/auth/me").expect(401);
  });
});
