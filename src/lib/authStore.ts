import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { UserSession } from "@/data/types";
import { getSupabase } from "@/lib/supabase";

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

function normalizeUserRow(row: UserRow | null): UserRow | null {
  if (!row || !["member", "leader"].includes(row.role)) return null;
  return row;
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

export async function getUserByUsername(username: string): Promise<AuthUser | null> {
  const row = await getUserWithPassword(username);
  return row ? rowToUser(row) : null;
}

export async function renameUser(oldUsername: string, newUsername: string): Promise<AuthUser | null> {
  const existing = await getUserByUsername(newUsername);
  if (existing && existing.username !== oldUsername) return null;

  const { error } = await getSupabase()
    .from("users")
    .update({ username: newUsername, updated_at: new Date().toISOString() })
    .eq("username", oldUsername);

  if (error) throw error;

  return getUserByUsername(newUsername);
}

export async function updateUserRole(username: string, role: "member" | "leader"): Promise<AuthUser | null> {
  const { error } = await getSupabase()
    .from("users")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("username", username);

  if (error) throw error;

  return getUserByUsername(username);
}

export async function getUserCountByDormCode(dormCode: string): Promise<number> {
  const { count, error } = await getSupabase()
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("dorm_code", dormCode);

  if (error) throw error;

  return count || 0;
}

export async function getUserWithPassword(username: string): Promise<UserRow | null> {
  const { data, error } = await getSupabase()
    .from("users")
    .select("id, username, password_hash, dorm_code, role")
    .eq("username", username)
    .maybeSingle<UserRow>();

  if (error) throw error;

  return normalizeUserRow(data);
}

export async function createUser(
  username: string,
  password: string,
  dormCode: string,
  role: "member" | "leader"
): Promise<AuthUser> {
  const id = `user-${Date.now()}-${randomBytes(6).toString("hex")}`;
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();

  const { error } = await getSupabase()
    .from("users")
    .insert({
      id,
      username,
      password_hash: passwordHash,
      dorm_code: dormCode,
      role,
      created_at: now,
      updated_at: now,
    });

  if (error) throw error;

  return { id, username, dormCode, role };
}

export async function authenticateUser(username: string, password: string): Promise<AuthUser | null> {
  const row = await getUserWithPassword(username);
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
