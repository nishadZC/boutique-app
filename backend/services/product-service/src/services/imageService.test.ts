import { describe, it, expect, vi, beforeEach } from 'vitest';
import { randomBytes } from 'crypto';

const cl = vi.hoisted(() => ({ config: vi.fn(), upload_stream: vi.fn() }));
vi.mock('cloudinary', () => ({ v2: { config: cl.config, uploader: { upload_stream: cl.upload_stream } } }));

const KEYS = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'] as const;
const setEnv = () => KEYS.forEach(k => { process.env[k] = randomBytes(8).toString('hex'); });

beforeEach(() => { vi.resetModules(); cl.config.mockReset(); cl.upload_stream.mockReset(); });

describe('imageService', () => {
  it('throws without cloudinary config', async () => {
    KEYS.forEach(k => { delete process.env[k]; });
    await expect(import('./imageService')).rejects.toThrow(/CLOUDINARY_CLOUD_NAME/);
  });

  it('configures cloudinary and resolves the secure url', async () => {
    setEnv();
    const end = vi.fn();
    cl.upload_stream.mockImplementation((opts: any, cb: any) => ({ end: (b: Buffer) => { end(b); cb(null, { secure_url: 'https://cdn/x.jpg' }); } }));
    const { uploadProductImage } = await import('./imageService');
    expect(cl.config).toHaveBeenCalledWith(expect.objectContaining({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, secure: true }));
    const buf = Buffer.from('abc');
    await expect(uploadProductImage(buf, 'p1')).resolves.toBe('https://cdn/x.jpg');
    expect(cl.upload_stream.mock.calls[0][0]).toMatchObject({ folder: 'boutique/products', public_id: 'p1', overwrite: true });
    expect(end).toHaveBeenCalledWith(buf);
  });

  it('rejects with the upload error', async () => {
    setEnv();
    cl.upload_stream.mockImplementation((_o: any, cb: any) => ({ end: () => cb(new Error('quota')) }));
    const { uploadProductImage } = await import('./imageService');
    await expect(uploadProductImage(Buffer.from('a'), 'p')).rejects.toThrow('quota');
  });

  it('rejects when there is no result', async () => {
    setEnv();
    cl.upload_stream.mockImplementation((_o: any, cb: any) => ({ end: () => cb(null, undefined) }));
    const { uploadProductImage } = await import('./imageService');
    await expect(uploadProductImage(Buffer.from('a'), 'p')).rejects.toThrow(/no upload result/);
  });
});
