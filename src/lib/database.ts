import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "dormmate.sqlite");

let database: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (database) return database;

  const databasePath = process.env.DORM_DATABASE_PATH || DEFAULT_DB_PATH;
  const databaseDirectory = path.dirname(databasePath);

  if (!existsSync(databaseDirectory)) {
    mkdirSync(databaseDirectory, { recursive: true });
  }

  database = new DatabaseSync(databasePath);
  database.exec(`
    CREATE TABLE IF NOT EXISTS dorm_states (
      dorm_code TEXT PRIMARY KEY,
      state_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_dorm_states_updated_at
      ON dorm_states(updated_at);

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      dorm_code TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_dorm_code
      ON users(dorm_code);
  `);

  return database;
}
