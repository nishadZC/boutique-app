import { describe, it, expect, vi } from 'vitest';

const db = vi.hoisted(() => ({ connectDB: vi.fn(), query: vi.fn(), getPool: vi.fn() }));
const createDatabase = vi.hoisted(() => vi.fn(() => db));
vi.mock('@boutique/shared', () => ({ createDatabase }));
import { connectDB, query, getPool } from './connection';

describe('database connection', () => {
  it('creates the products_db pool and re-exports its helpers', () => {
    expect(createDatabase).toHaveBeenCalledWith({ defaultDatabase: 'products_db', label: 'product service' });
    expect(connectDB).toBe(db.connectDB);
    expect(query).toBe(db.query);
    expect(getPool).toBe(db.getPool);
  });
});
