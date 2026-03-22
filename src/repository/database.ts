import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS flights (
    id TEXT PRIMARY KEY,
    callsign TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    time_scale REAL NOT NULL DEFAULT 60,
    started_at TEXT NOT NULL,
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS metrics_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flight_id TEXT NOT NULL REFERENCES flights(id),
    phase TEXT NOT NULL,
    altitude REAL NOT NULL,
    airspeed REAL NOT NULL,
    heading REAL NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    fuel_remaining REAL NOT NULL,
    outside_air_temperature REAL NOT NULL,
    eta REAL NOT NULL,
    elapsed_minutes REAL NOT NULL,
    timestamp TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_snapshots_flight_id
    ON metrics_snapshots(flight_id);

  CREATE INDEX IF NOT EXISTS idx_snapshots_flight_timestamp
    ON metrics_snapshots(flight_id, timestamp);
`;

export function createDatabase(dbPath: string): Database.Database {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);

  return db;
}
