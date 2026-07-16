import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { getDatabase } from "@/lib/database";
import type { UserSession } from "@/data/types";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

type UserRow = {
  id: string;
  username: string;
  password_hash: string;
  dorm_code: string;
  role: "member" | "leader";
};

export type AuthUser = {
  id: string;
  username: string;
  dormCode: string;
  role: "member" | "leader";
};

function rowToUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    username: row.username,
    dormCode: row.dorm_code,
    role: row.role,
  };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const [salt, hash] = passwordHash.split(":");
  if (!salt || !hash) return false;

  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  const storedKey = Buffer.from(hash, "hex");
  if (storedKey.length !== derivedKey.length) return false;
  return timingSafeEqual(storedKey, derivedKey);
}

export function getUserByUsername(username: string): AuthUser | null {
  const db = getDatabase();
  const row = db
    .prepare("SELECT id, username, password_hash, dorm_code, role FROM users WHERE username = ?")
    .get(username) as UserRow | undefined;

  return row ? rowToUser(row) : null;
}

export function renameUser(oldUsername: string, newUsername: string): AuthUser | null {
  const db = getDatabase();
  const existing = getUserByUsername(newUsername);
  if (existing && existing.username !== oldUsername) return null;

  db.prepare(`
    UPDATE users
    SET username = ?, updated_at = datetime('now')
    WHERE username = ?
  `).run(newUsername, oldUsername);

  return getUserByUsername(newUsername);
}

export function updateUserRole(username: string, role: "member" | "leader"): AuthUser | null {
  const db = getDatabase();
  db.prepare(`
    UPDATE users
    SET role = ?, updated_at = datetime('now')
    WHERE username = ?
  `).run(role, username);

  return getUserByUsername(username);
}

export function getUserCountByDormCode(dormCode: string): number {
  const db = getDatabase();
  const row = db
    .prepare("SELECT COUNT(*) AS count FROM users WHERE dorm_code = ?")
    .get(dormCode) as { count: number } | undefined;

  return row?.count || 0;
}

export function getUserWithPassword(username: string): UserRow | null {
  const db = getDatabase();
  const row = db
    .prepare("SELECT id, username, password_hash, dorm_code, role FROM users WHERE username = ?")
    .get(username) as UserRow | undefined;

  return row || null;
}

export async function createUser(
  username: string,
  password: string,
  dormCode: string,
  role: "member" | "leader"
): Promise<AuthUser> {
  const db = getDatabase();
  const id = `user-${Date.now()}-${randomBytes(6).toString("hex")}`;
  const passwordHash = await hashPassword(password);

  db.prepare(`
    INSERT INTO users (id, username, password_hash, dorm_code, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(id, username, passwordHash, dormCode, role);

  return { id, username, dormCode, role };
}

export async function authenticateUser(username: string, password: string): Promise<AuthUser | null> {
  const row = getUserWithPassword(username);
  if (!row) return null;

  const valid = await verifyPassword(password, row.password_hash);
  return valid ? rowToUser(row) : null;
}

export function toUserSession(user: AuthUser): UserSession {
  return {
    nickname: user.username,
    dormCode: user.dormCode,
    role: user.role,
  };
}
