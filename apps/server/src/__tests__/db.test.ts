import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@server/config.js', () => ({
  config: { port: 3001, tomtomApiKey: '', dbPath: ':memory:' },
}));

// Import after mock so the DB is created in-memory
const { roadsDb } = await import('@server/db.js');

const ROAD = {
  id: 'road-1',
  name: 'A38 Bristol',
  description: 'Morning school run',
  bbox: [-2.6, 51.4, -2.5, 51.5] as [number, number, number, number],
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('roadsDb', () => {
  beforeEach(() => {
    // Clear the table between tests
    for (const r of roadsDb.list()) roadsDb.delete(r.id);
  });

  it('list() returns empty array initially', () => {
    expect(roadsDb.list()).toEqual([]);
  });

  it('insert() and list() round-trips a road', () => {
    roadsDb.insert(ROAD);
    const list = roadsDb.list();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: 'road-1', name: 'A38 Bristol' });
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
    expect(updated?.description).toBe('Morning school run');
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

  it('insert() stores bbox correctly', () => {
    roadsDb.insert(ROAD);
    const r = roadsDb.get('road-1');
    expect(r?.bbox).toEqual([-2.6, 51.4, -2.5, 51.5]);
  });

  it('insert() allows undefined description', () => {
    roadsDb.insert({ ...ROAD, id: 'road-2', description: undefined });
    const r = roadsDb.get('road-2');
    expect(r?.description).toBeFalsy();
  });
});
