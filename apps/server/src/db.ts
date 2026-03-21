import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { config } from './config.js';
import type { Road } from '@cartrack/shared';

mkdirSync(dirname(config.dbPath), { recursive: true });

const db = new Database(config.dbPath);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ─────────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS roads (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    bbox_min_lon REAL NOT NULL,
    bbox_min_lat REAL NOT NULL,
    bbox_max_lon REAL NOT NULL,
    bbox_max_lat REAL NOT NULL,
    created_at  TEXT NOT NULL
  );
`);

// ── Helpers ────────────────────────────────────────────────────────────────────

function rowToRoad(row: Record<string, unknown>): Road {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | undefined,
    bbox: [
      row.bbox_min_lon as number,
      row.bbox_min_lat as number,
      row.bbox_max_lon as number,
      row.bbox_max_lat as number,
    ],
    createdAt: row.created_at as string,
  };
}

// ── Queries ────────────────────────────────────────────────────────────────────

const stmts = {
  listRoads: db.prepare('SELECT * FROM roads ORDER BY created_at ASC'),

  getRoad: db.prepare('SELECT * FROM roads WHERE id = ?'),

  insertRoad: db.prepare(`
    INSERT INTO roads (id, name, description, bbox_min_lon, bbox_min_lat, bbox_max_lon, bbox_max_lat, created_at)
    VALUES (@id, @name, @description, @bbox_min_lon, @bbox_min_lat, @bbox_max_lon, @bbox_max_lat, @created_at)
  `),

  updateRoad: db.prepare(`
    UPDATE roads
    SET name = COALESCE(@name, name),
        description = COALESCE(@description, description),
        bbox_min_lon = COALESCE(@bbox_min_lon, bbox_min_lon),
        bbox_min_lat = COALESCE(@bbox_min_lat, bbox_min_lat),
        bbox_max_lon = COALESCE(@bbox_max_lon, bbox_max_lon),
        bbox_max_lat = COALESCE(@bbox_max_lat, bbox_max_lat)
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
      description: road.description ?? null,
      bbox_min_lon: road.bbox[0],
      bbox_min_lat: road.bbox[1],
      bbox_max_lon: road.bbox[2],
      bbox_max_lat: road.bbox[3],
      created_at: road.createdAt,
    });
  },

  update(id: string, patch: Partial<Omit<Road, 'id' | 'createdAt'>>): Road | undefined {
    stmts.updateRoad.run({
      id,
      name: patch.name ?? null,
      description: patch.description ?? null,
      bbox_min_lon: patch.bbox?.[0] ?? null,
      bbox_min_lat: patch.bbox?.[1] ?? null,
      bbox_max_lon: patch.bbox?.[2] ?? null,
      bbox_max_lat: patch.bbox?.[3] ?? null,
    });
    return roadsDb.get(id);
  },

  delete(id: string): boolean {
    const result = stmts.deleteRoad.run(id);
    return result.changes > 0;
  },
};
