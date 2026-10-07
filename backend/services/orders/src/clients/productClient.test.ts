import { describe, it, expect, vi, beforeEach } from 'vitest';
import { randomBytes } from 'crypto';

vi.mock('axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
import axios from 'axios';
import { getProduct, getProducts, commitStock } from './productClient';

const mGet = vi.mocked(axios.get);
const mPost = vi.mocked(axios.post);
const TOKEN = randomBytes(16).toString('hex');

beforeEach(() => { vi.clearAllMocks(); process.env.INTERNAL_API_TOKEN = TOKEN; });

describe('productClient', () => {
  it('maps a product and sends the internal token', async () => {
    mGet.mockResolvedValueOnce({ data: { data: { id: 'p', name: 'N', price: '9.5', image_url: 'i', category: 'c', brand: 'b', inventory_quantity: 3, is_active: false } } });
    expect(await getProduct('p/1')).toEqual({ id: 'p', name: 'N', price: 9.5, imageUrl: 'i', category: 'c', brand: 'b', inventoryQuantity: 3, isActive: false });
    expect(mGet.mock.calls[0][0]).toContain('p%2F1');
    expect((mGet.mock.calls[0][1] as any).headers['x-internal-token']).toBe(TOKEN);
  });
  it('applies defaults', async () => {
    mGet.mockResolvedValueOnce({ data: { data: { id: 'p', name: 'N', price: 1 } } });
    expect(await getProduct('p')).toMatchObject({ imageUrl: '', category: '', brand: '', inventoryQuantity: 0, isActive: true });
  });
  it('returns null on 404 and rethrows other errors', async () => {
    mGet.mockRejectedValueOnce({ response: { status: 404 } });
    expect(await getProduct('p')).toBeNull();
    mGet.mockRejectedValueOnce(new Error('boom'));
    await expect(getProduct('p')).rejects.toThrow('boom');
  });
  it('sends an empty token when unset', async () => {
    delete process.env.INTERNAL_API_TOKEN;
    mGet.mockResolvedValueOnce({ data: { data: { id: 'p' } } });
    await getProduct('p');
    expect((mGet.mock.calls[0][1] as any).headers['x-internal-token']).toBe('');
  });
  it('getProducts dedupes and tolerates failures', async () => {
    mGet.mockImplementation(async (url: string) => {
      if (url.endsWith('/a')) return { data: { data: { id: 'a', name: 'A', price: 1 } } };
      throw new Error('x');
    });
    const m = await getProducts(['a', 'a', 'b']);
    expect(mGet).toHaveBeenCalledTimes(2);
    expect([...m.keys()]).toEqual(['a']);
  });
  it('commitStock posts and returns data', async () => {
    mPost.mockResolvedValueOnce({ data: { data: { shortages: [] } } });
    expect(await commitStock('o', 'sale', [{ productId: 'a', quantity: 1 }])).toEqual({ shortages: [] });
    expect(mPost.mock.calls[0][1]).toEqual({ orderId: 'o', direction: 'sale', items: [{ productId: 'a', quantity: 1 }] });
  });
});
