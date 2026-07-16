import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { UserSession } from "@/data/types";

const COOKIE_NAME = "dormmate_session";
const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7;

function getSecret() {
  return process.env.DORM_SESSION_SECRET || "dormmate-dev-session-secret";
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function encodeSession(session: UserSession) {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeSession(value: string): UserSession | null {
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as UserSession;
    if (!parsed.nickname || !parsed.dormCode || !["member", "leader"].includes(parsed.role)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  return value ? decodeSession(value) : null;
}

export async function setSession(session: UserSession): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_WEEK_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
