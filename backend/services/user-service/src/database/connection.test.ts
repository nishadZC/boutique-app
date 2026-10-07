import { describe, it, expect, vi } from 'vitest';

const h = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] })) }));
vi.mock('pg', () => ({ Pool: vi.fn(function () { return { query: h.query }; }) }));

import { query, pool } from './connection';

describe('user-service database connection', () => {
  it('forwards queries to the pool', async () => {
    expect(pool).toBeTruthy();
    await query('SELECT 1', [1]);
    expect(h.query).toHaveBeenCalledWith('SELECT 1', [1]);
  });
});
