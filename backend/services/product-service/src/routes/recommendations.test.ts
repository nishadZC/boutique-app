import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../database/connection', () => ({ query: vi.fn(), getPool: vi.fn() }));
vi.mock('node-fetch', () => ({ default: vi.fn() }));
import fetch from 'node-fetch';
import { recommendationRoutes } from './recommendations';
import { query } from '../database/connection';

const app = express();
app.use('/recommendations', recommendationRoutes);
app.use((err: any, _req: any, res: any, _next: any) => res.status(500).json({ error: err.message }));
const q = vi.mocked(query);
const f = vi.mocked(fetch as any);
const img = Buffer.from([0xff, 0xd8, 0xff]);
const send = () => request(app).post('/recommendations').attach('image', img, { filename: 'f.jpg', contentType: 'image/jpeg' });
const tone = {
  skinTone: { hex: '#a', name: 'Warm', group: 'medium', confidence: 0.9, face_detected: true },
  recommendedColors: ['Navy'], shirtColors: ['White'], pantColors: ['Grey'], shoeColors: [],
};
const ok = (data: any) => ({ ok: true, json: async () => data });
const item = (n: string) => ({ id: n, name: n, color: 'c', image_url: 'u', price: 1, extra: 'x' });

beforeEach(() => { q.mockReset(); f.mockReset(); vi.spyOn(console, 'error').mockImplementation(() => {}); });

describe('POST /recommendations', () => {
  it('400 without image', async () => {
    expect((await request(app).post('/recommendations')).status).toBe(400);
  });
  it('rejects non-image uploads via multer error', async () => {
    const res = await request(app).post('/recommendations').attach('image', img, { filename: 'a.txt', contentType: 'text/plain' });
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Only image files are allowed');
  });
  it('422 when no face detected', async () => {
    f.mockResolvedValue({ ok: false, status: 422, json: async () => ({ detail: 'No face detected in image' }) });
    const res = await send();
    expect(res.status).toBe(422);
    expect(res.body.error).toBe('No face detected in image');
  });
  it('503 when service errors with unparsable body', async () => {
    f.mockResolvedValue({ ok: false, status: 500, json: async () => { throw new Error('bad json'); } });
    expect((await send()).status).toBe(503);
  });
  it('503 when fetch throws', async () => {
    f.mockRejectedValue(new Error('ECONNREFUSED'));
    expect((await send()).status).toBe(503);
  });
  it('builds outfits, falling back where colours do not match', async () => {
    f.mockResolvedValue(ok(tone));
    q.mockImplementation(async (sql: string, params: any[]) => {
      if (params[0] === 'Formal Shirts' && params[1] === 'White') return { rows: [item('s1'), item('s2')] };
      if (params[0] === 'Trousers & Pants') return params[1] === 'Grey' ? { rows: [] } : { rows: [item('t1')] };
      if (params[0] === 'Formal Shoes') return { rows: [item('h1'), item('h2'), item('h3')] };
      return { rows: [] };
    });
    const res = await send();
    expect(res.status).toBe(200);
    expect(res.body.skinTone).toEqual({ name: 'Warm', hex: '#a', confidence: 0.9, faceDetected: true });
    expect(res.body.recommendations.pants[0].id).toBe('t1');
    expect(res.body.outfits).toHaveLength(3);
    expect(res.body.outfits[2]).toEqual({
      topwear: { id: 's1', name: 's1', color: 'c', image_url: 'u', price: 1 },
      pants: { id: 't1', name: 't1', color: 'c', image_url: 'u', price: 1 },
      shoes: { id: 'h3', name: 'h3', color: 'c', image_url: 'u', price: 1 },
    });
    // shoeColors is empty -> no colour query for shoes; only the fallback query runs
    const shoeCalls = q.mock.calls.filter(c => c[1][0] === 'Formal Shoes');
    expect(shoeCalls).toHaveLength(1);
    expect(shoeCalls[0][0]).toMatch(/LIMIT 4/);
  });
  it('no outfits when a category is empty', async () => {
    f.mockResolvedValue(ok(tone));
    q.mockResolvedValue({ rows: [] });
    const res = await send();
    expect(res.body.outfits).toEqual([]);
  });
  it('500 when the database fails', async () => {
    f.mockResolvedValue(ok(tone));
    q.mockRejectedValue(new Error('db'));
    const res = await send();
    expect(res.status).toBe(500);
    expect(res.body.details).toBe('db');
  });
});
