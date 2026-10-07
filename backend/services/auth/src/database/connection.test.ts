import { describe, it, expect, vi } from 'vitest';

vi.mock('pg', () => ({ Pool: vi.fn() }));

import { connectDB, query, getPool } from './connection';

describe('auth database connection', () => {
  it('exposes the shared database helpers, unconnected until connectDB', () => {
    expect(typeof connectDB).toBe('function');
    expect(() => query('SELECT 1')).toThrow('Database not connected');
    expect(() => getPool()).toThrow('Database not connected');
  });
});
