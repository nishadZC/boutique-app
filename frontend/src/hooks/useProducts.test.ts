import { renderHook, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useProducts } from './useProducts';
import { productService } from '../services/productService';

const setSearchParams = vi.fn();
let sp = new URLSearchParams();
const addItem = vi.fn();
const toggleWishlist = vi.fn();
vi.mock('react-router-dom', () => ({ useSearchParams: () => [sp, setSearchParams] }));
vi.mock('../services/productService', () => ({ productService: { getAll: vi.fn() } }));
vi.mock('../contexts/CartContext', () => ({ useCart: () => ({ addItem }) }));
vi.mock('../contexts/WishlistContext', () => ({ useWishlist: () => ({ isInWishlist: vi.fn(), toggleWishlist }) }));

const products: any[] = [
  { id: '1', name: 'Blue Shirt', description: 'cotton', category: 'shirts', price: 100, brand: 'X', sizes: ['M'], color: 'Blue', rating: 5, inventory: 1, isHandcrafted: true, createdAt: '2024-01-01' },
  { id: '2', name: 'Alpha Coat', description: 'wool', category: 'coats', price: 2000, brand: 'Y', sizes: ['L'], color: 'Red', rating: 3, inventory: 0, createdAt: '2025-01-01' },
  { id: '3', name: 'Zed Pant', description: 'linen', category: 'pants', price: 50 },
];
const base = { priceRange: [0, 99999] as [number, number], category: '', brand: [], size: [], color: [], rating: 0, inStock: false, handcrafted: false };

const load = async () => {
  const r = renderHook(() => useProducts());
  await waitFor(() => expect(r.result.current.loading).toBe(false));
  return r;
};

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sp = new URLSearchParams();
    vi.mocked(productService.getAll).mockResolvedValue(products);
  });

  it('loads and derives facets', async () => {
    const { result } = await load();
    expect(result.current.products).toHaveLength(3);
    expect(result.current.categories).toEqual(['shirts', 'coats', 'pants']);
    expect(result.current.brands).toEqual(['X', 'Y']);
    expect(result.current.sizes).toEqual(['M', 'L']);
    expect(result.current.colors).toEqual(['Blue', 'Red']);
    expect(result.current.maxPrice).toBe(2000);
    expect(result.current.pageCount).toBe(1);
    expect(result.current.pagedProducts).toHaveLength(3);
  });

  it('applies url params', async () => {
    sp = new URLSearchParams('category=shirts&q=blue&sort=name&handcrafted=1');
    const { result } = await load();
    expect(result.current.sortBy).toBe('name');
    expect(result.current.filteredProducts.map(p => p.id)).toEqual(['1']);
  });

  it('ignores invalid sort', async () => {
    sp = new URLSearchParams('sort=bogus');
    const { result } = await load();
    expect(result.current.sortBy).toBe('featured');
  });

  it('filters by every option', async () => {
    const { result } = await load();
    const ids = () => result.current.filteredProducts.map(p => p.id);
    act(() => result.current.handleFilterChange({ ...base, inStock: true }));
    expect(ids()).toEqual(['1']);
    act(() => result.current.handleFilterChange({ ...base, priceRange: [60, 3000] }));
    expect(ids()).toEqual(['1', '2']);
    act(() => result.current.handleFilterChange({ ...base, brand: ['Y'] }));
    expect(ids()).toEqual(['2']);
    act(() => result.current.handleFilterChange({ ...base, size: ['M'] }));
    expect(ids()).toEqual(['1']);
    act(() => result.current.handleFilterChange({ ...base, color: ['red'] }));
    expect(ids()).toEqual(['2']);
    act(() => result.current.handleFilterChange({ ...base, rating: 4 }));
    expect(ids()).toEqual(['1']);
    act(() => result.current.handleFilterChange({ ...base, category: 'pants' }));
    expect(ids()).toEqual(['3']);
    act(() => result.current.handleFilterChange(base));
    act(() => result.current.handleSearch('WOOL'));
    expect(ids()).toEqual(['2']);
    act(() => result.current.handleSearch('pants'));
    expect(ids()).toEqual(['3']);
  });

  it('sorts', async () => {
    const { result } = await load();
    const ids = () => result.current.filteredProducts.map(p => p.id);
    act(() => result.current.handleSortChange('price-low'));
    expect(ids()).toEqual(['3', '1', '2']);
    act(() => result.current.handleSortChange('price-high'));
    expect(ids()).toEqual(['2', '1', '3']);
    act(() => result.current.handleSortChange('name'));
    expect(ids()).toEqual(['2', '1', '3']);
    act(() => result.current.handleSortChange('newest'));
    expect(ids()).toEqual(['2', '1', '3']);
  });

  it('handles pagination, clear, cart and wishlist', async () => {
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo as any;
    const { result } = await load();
    act(() => result.current.handlePageChange({} as any, 2));
    expect(result.current.page).toBe(2);
    expect(scrollTo).toHaveBeenCalled();
    act(() => result.current.setViewMode('list'));
    expect(result.current.viewMode).toBe('list');
    act(() => { result.current.handleSearch('x'); result.current.handleClearFilters(); });
    expect(result.current.searchQuery).toBe('');
    expect(result.current.activeFilters.priceRange).toEqual([0, 2000]);
    expect(setSearchParams).toHaveBeenCalledWith({}, { replace: true });
    result.current.handleAddToCart(products[0], 'M');
    expect(addItem).toHaveBeenCalledWith(products[0], 'M');
    result.current.handleToggleWishlist('1');
    expect(toggleWishlist).toHaveBeenCalledWith('1');
  });

  it('logs on failure', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(productService.getAll).mockRejectedValue(new Error('x'));
    const { result } = await load();
    expect(err).toHaveBeenCalled();
    expect(result.current.maxPrice).toBe(1000);
  });
});
