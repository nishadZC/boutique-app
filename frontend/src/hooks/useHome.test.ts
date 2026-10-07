import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useHome } from './useHome';
import { productService } from '../services/productService';

const addItem = vi.fn();
const toggleWishlist = vi.fn();
const isInWishlist = vi.fn();
vi.mock('../services/productService', () => ({ productService: { getAll: vi.fn() } }));
vi.mock('../contexts/CartContext', () => ({ useCart: () => ({ addItem }) }));
vi.mock('../contexts/WishlistContext', () => ({ useWishlist: () => ({ isInWishlist, toggleWishlist }) }));
vi.mock('../constants/navigation', () => ({
  SHOP_CATEGORIES: [{ label: 'Shirts', category: 'shirts' }, { label: 'Coats', category: 'coats', tileImage: '/c.jpg' }],
}));

const products: any[] = [
  { id: '1', category: 'shirts', inventory: 5, isNew: true, imageUrl: '/1.jpg', isHandcrafted: true },
  { id: '2', category: 'shirts', inventory_quantity: 2, createdAt: '2024-01-01', imageUrl: '/2.jpg', isHandcrafted: true },
  { id: '3', category: 'coats', inventory: 1, createdAt: '2025-01-01' },
  { id: '4', category: 'coats', inventory: 0 },
  { id: '5', category: 'coats', inventory: 3 },
];

describe('useHome', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads and derives rows', async () => {
    vi.mocked(productService.getAll).mockResolvedValue(products);
    const { result } = renderHook(() => useHome());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.bestSellers.map(p => p.id)).toEqual(['1']);
    expect(result.current.newArrivals.map(p => p.id)).toEqual(['3', '2', '5']);
    expect(result.current.categories).toEqual([
      { label: 'Shirts', category: 'shirts', count: 2, curated: false, image: '/1.jpg' },
      { label: 'Coats', category: 'coats', count: 3, curated: true, image: '/c.jpg' },
    ]);
    expect(result.current.handcraftedImage).toBe('/2.jpg');
    result.current.handleAddToCart(products[0], 'M');
    expect(addItem).toHaveBeenCalledWith(products[0], 'M');
    result.current.handleToggleWishlist('1');
    expect(toggleWishlist).toHaveBeenCalledWith('1');
  });

  it('sets error on failure', async () => {
    vi.mocked(productService.getAll).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useHome());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Failed to load products');
    expect(result.current.handcraftedImage).toBeUndefined();
  });

  it('ignores results after unmount', async () => {
    let resolve!: (v: any) => void;
    vi.mocked(productService.getAll).mockReturnValue(new Promise(r => { resolve = r; }));
    const { result, unmount } = renderHook(() => useHome());
    unmount();
    resolve(products);
    await Promise.resolve();
    expect(result.current.loading).toBe(true);
  });
});
