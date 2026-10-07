import { describe, it, expect, vi, afterEach } from 'vitest';
import { recommendationService } from './skinToneService';

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const okResponse = (body: unknown) => ({ ok: true, status: 200, json: () => Promise.resolve(body) });

describe('recommendationService.analyze', () => {
  it('posts form data and normalizes products', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({
      success: true,
      recommendations: { topwear: [{ id: 't', price: '10', imageUrl: 'iu' }] },
      outfits: [{ topwear: { id: 'a', image_url: 'x', compare_price: 5 }, pants: {}, shoes: { price: 3 } }],
    }));
    vi.stubGlobal('fetch', fetchMock);
    const r = await recommendationService.analyze(new Blob(['x']));
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/recommendations$/);
    expect(fetchMock.mock.calls[0][1].method).toBe('POST');
    expect(r.recommendations.topwear[0]).toEqual({ id: 't', name: 'Formal Wear', price: 10, compare_price: 10, brand: 'Lux Atelier',
      color: 'Neutral', category: 'Formal Wear', image_url: 'iu' });
    expect(r.recommendations.pants).toEqual([]);
    expect(r.recommendations.shoes).toEqual([]);
    expect(r.outfits[0].topwear.compare_price).toBe(5);
    expect(r.outfits[0].pants.image_url).toMatch(/cloudinary/);
    expect(r.outfits[0].shoes.compare_price).toBe(3);
  });

  it('defaults missing outfits to empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({ recommendations: {} })));
    expect((await recommendationService.analyze(new Blob())).outfits).toEqual([]);
  });

  it('throws server error message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400, json: () => Promise.resolve({ error: 'no face' }) }));
    await expect(recommendationService.analyze(new Blob())).rejects.toThrow('no face');
  });

  it('throws status message when body is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502, json: () => Promise.reject(new Error('bad')) }));
    await expect(recommendationService.analyze(new Blob())).rejects.toThrow('Request failed with status 502');
  });
});

describe('recommendationService helpers', () => {
  it('dataUrlToBlob parses mime and bytes', async () => {
    const blob = recommendationService.dataUrlToBlob(`data:image/png;base64,${btoa('hi')}`);
    expect(blob.type).toBe('image/png');
    expect(blob.size).toBe(2);
  });

  it('dataUrlToBlob defaults mime to jpeg', () => {
    expect(recommendationService.dataUrlToBlob(`data,${btoa('a')}`).type).toBe('image/jpeg');
  });

  it('captureVideoBlob draws frame onto canvas', () => {
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage } as never);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(`data:image/jpeg;base64,${btoa('abc')}`);
    const video = { videoWidth: 0, videoHeight: 0 } as HTMLVideoElement;
    const blob = recommendationService.captureVideoBlob(video);
    expect(drawImage).toHaveBeenCalledWith(video, 0, 0);
    expect(blob.size).toBe(3);
    const video2 = { videoWidth: 100, videoHeight: 50 } as HTMLVideoElement;
    expect(recommendationService.captureVideoBlob(video2).type).toBe('image/jpeg');
  });

  it('getPreviewUrl uses createObjectURL', () => {
    const create = vi.fn().mockReturnValue('blob:x');
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: create }));
    expect(recommendationService.getPreviewUrl(new Blob())).toBe('blob:x');
  });
});
