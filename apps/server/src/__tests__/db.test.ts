import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@server/config.js', () => ({
  config: { port: 3001, tomtomApiKey: '', dbPath: ':memory:' },
}));

// Import after mock so the DB is created in-memory
const { roadsDb } = await import('@server/db.js');

const ROAD = {
  id: 'road-1',
  name: 'A41: West Hampstead → Elstree',
  origin: [51.55, -0.19] as [number, number],
  destination: [51.65, -0.31] as [number, number],
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('roadsDb', () => {
  beforeEach(() => {
    for (const r of roadsDb.list()) roadsDb.delete(r.id);
  });

  it('list() returns empty array initially', () => {
    expect(roadsDb.list()).toEqual([]);
  });

  it('insert() and list() round-trips a road', () => {
    roadsDb.insert(ROAD);
    const list = roadsDb.list();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: 'road-1', name: 'A41: West Hampstead → Elstree' });
  });

  it('insert() stores origin and destination correctly', () => {
    roadsDb.insert(ROAD);
    const r = roadsDb.get('road-1');
    expect(r?.origin).toEqual([51.55, -0.19]);
    expect(r?.destination).toEqual([51.65, -0.31]);
  });

  it('get() returns a road by id', () => {
    roadsDb.insert(ROAD);
    expect(roadsDb.get('road-1')).toMatchObject({ id: 'road-1' });
  });

  it('get() returns undefined for unknown id', () => {
    expect(roadsDb.get('missing')).toBeUndefined();
  });

  it('update() patches name', () => {
    roadsDb.insert(ROAD);
    const updated = roadsDb.update('road-1', { name: 'M5 South' });
    expect(updated?.name).toBe('M5 South');
    expect(updated?.origin).toEqual([51.55, -0.19]);
  });

  it('update() returns undefined for unknown id', () => {
    expect(roadsDb.update('missing', { name: 'X' })).toBeUndefined();
  });

  it('delete() removes road and returns true', () => {
    roadsDb.insert(ROAD);
    expect(roadsDb.delete('road-1')).toBe(true);
    expect(roadsDb.list()).toHaveLength(0);
  });

  it('delete() returns false for unknown id', () => {
    expect(roadsDb.delete('missing')).toBe(false);
  });
});
