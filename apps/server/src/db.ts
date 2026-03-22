import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { config } from '@server/config.js';
import type { Road } from '@cartrack/shared';

mkdirSync(dirname(config.dbPath), { recursive: true });

const db = new Database(config.dbPath);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ─────────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS roads (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    origin_name  TEXT,
    dest_name    TEXT,
    origin_lat   REAL NOT NULL,
    origin_lon   REAL NOT NULL,
    dest_lat     REAL NOT NULL,
    dest_lon     REAL NOT NULL,
    created_at   TEXT NOT NULL
  );
`);

// ── Helpers ────────────────────────────────────────────────────────────────────

function rowToRoad(row: Record<string, unknown>): Road {
  return {
    id: row.id as string,
    name: row.name as string,
    originName: (row.origin_name as string | null) ?? undefined,
    destinationName: (row.dest_name as string | null) ?? undefined,
    origin: [row.origin_lat as number, row.origin_lon as number],
    destination: [row.dest_lat as number, row.dest_lon as number],
    createdAt: row.created_at as string,
  };
}

// ── Queries ────────────────────────────────────────────────────────────────────

const stmts = {
  listRoads: db.prepare('SELECT * FROM roads ORDER BY created_at ASC'),

  getRoad: db.prepare('SELECT * FROM roads WHERE id = ?'),

  insertRoad: db.prepare(`
    INSERT INTO roads (id, name, origin_name, dest_name, origin_lat, origin_lon, dest_lat, dest_lon, created_at)
    VALUES (@id, @name, @origin_name, @dest_name, @origin_lat, @origin_lon, @dest_lat, @dest_lon, @created_at)
  `),

  updateRoad: db.prepare(`
    UPDATE roads
    SET name        = COALESCE(@name, name),
        origin_name = COALESCE(@origin_name, origin_name),
        dest_name   = COALESCE(@dest_name, dest_name),
        origin_lat  = COALESCE(@origin_lat, origin_lat),
        origin_lon  = COALESCE(@origin_lon, origin_lon),
        dest_lat    = COALESCE(@dest_lat, dest_lat),
        dest_lon    = COALESCE(@dest_lon, dest_lon)
    WHERE id = @id
  `),

  deleteRoad: db.prepare('DELETE FROM roads WHERE id = ?'),
};

export const roadsDb = {
  list(): Road[] {
    return (stmts.listRoads.all() as Record<string, unknown>[]).map(rowToRoad);
  },

  get(id: string): Road | undefined {
    const row = stmts.getRoad.get(id) as Record<string, unknown> | undefined;
    return row ? rowToRoad(row) : undefined;
  },

  insert(road: Road): void {
    stmts.insertRoad.run({
      id: road.id,
      name: road.name,
      origin_name: road.originName ?? null,
      dest_name: road.destinationName ?? null,
      origin_lat: road.origin[0],
      origin_lon: road.origin[1],
      dest_lat: road.destination[0],
      dest_lon: road.destination[1],
      created_at: road.createdAt,
    });
  },

  update(id: string, patch: Partial<Omit<Road, 'id' | 'createdAt'>>): Road | undefined {
    stmts.updateRoad.run({
      id,
      name: patch.name ?? null,
      origin_name: patch.originName ?? null,
      dest_name: patch.destinationName ?? null,
      origin_lat: patch.origin?.[0] ?? null,
      origin_lon: patch.origin?.[1] ?? null,
      dest_lat: patch.destination?.[0] ?? null,
      dest_lon: patch.destination?.[1] ?? null,
    });
    return roadsDb.get(id);
  },

  delete(id: string): boolean {
    const result = stmts.deleteRoad.run(id);
    return result.changes > 0;
  },
};
