import { Pool } from 'pg';
import { expect, it } from 'vitest';
import { pool } from './connection';

it('exports a lazily-connecting pg Pool', async () => {
  expect(pool).toBeInstanceOf(Pool);
  await pool.end();
});
