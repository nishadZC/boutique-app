import { renderHook, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useProductDetail, SIZE_GUIDE_IMAGES } from './useProductDetail';
import { productService } from '../services/productService';

const navigate = vi.fn();
const showToast = vi.fn();
const addItem = vi.fn();
let params: any = { id: 'p1' };
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate, useParams: () => params }));
vi.mock('../services/productService', () => ({ productService: { getById: vi.fn(), getAll: vi.fn() } }));
vi.mock('../contexts/CartContext', () => ({ useCart: () => ({ addItem }) }));
vi.mock('../contexts/WishlistContext', () => ({ useWishlist: () => ({ toggleWishlist: vi.fn(), isInWishlist: vi.fn() }) }));
vi.mock('../contexts/ToastContext', () => ({ useToast: () => ({ showToast }) }));

const shirt: any = { id: 'p1', name: 'Oxford Shirt', category: 'Shirts', inventory: 3 };
const all: any[] = [
  shirt,
  { id: 'a', category: 'Coats', inventory: 2 },
  { id: 'b', category: 'Shirts', inventory_quantity: 1 },
  { id: 'c', category: 'Shirts', inventory: 0 },
];

const load = async () => {
  const r = renderHook(() => useProductDetail());
  await waitFor(() => expect(r.result.current.loading).toBe(false));
  return r;
};

describe('useProductDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    params = { id: 'p1' };
    vi.mocked(productService.getById).mockResolvedValue(shirt);
    vi.mocked(productService.getAll).mockResolvedValue(all);
    addItem.mockReturnValue(true);
  });

  it('loads product and related', async () => {
    const { result } = await load();
    expect(result.current.product).toEqual(shirt);
    await waitFor(() => expect(result.current.relatedProducts.map(p => p.id)).toEqual(['b', 'a']));
    expect(result.current.garmentType).toBe('shirt');
    expect(result.current.canTailor).toBe(true);
    expect(result.current.isMadeToMeasure).toBe(false);
    expect(result.current.sizeGuideImages).toBe(SIZE_GUIDE_IMAGES.shirt);
  });

  it('clears related on failure', async () => {
    vi.mocked(productService.getAll).mockRejectedValue(new Error('x'));
    const { result } = await load();
    await waitFor(() => expect(productService.getAll).toHaveBeenCalled());
    expect(result.current.relatedProducts).toEqual([]);
  });

  it('navigates away when product fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(productService.getById).mockRejectedValue(new Error('x'));
    const { result } = await load();
    expect(navigate).toHaveBeenCalledWith('/products');
    expect(result.current.product).toBeNull();
    expect(result.current.sizeGuideImages).toEqual([]);
  });

  it('does nothing without id', () => {
    params = {};
    const { result } = renderHook(() => useProductDetail());
    expect(result.current.loading).toBe(true);
    expect(productService.getById).not.toHaveBeenCalled();
    result.current.handleAddToCart();
    result.current.handleQuantityChange(1);
    expect(addItem).not.toHaveBeenCalled();
  });

  it('handles quantity changes', async () => {
    const { result } = await load();
    act(() => result.current.handleQuantityChange(1));
    act(() => result.current.handleQuantityChange(1));
    act(() => result.current.handleQuantityChange(1));
    expect(result.current.quantity).toBe(3);
    act(() => result.current.handleQuantityChange(-5));
    expect(result.current.quantity).toBe(3);
  });

  it('requires a size', async () => {
    const { result } = await load();
    act(() => result.current.handleAddToCart());
    expect(showToast).toHaveBeenCalledWith(expect.stringMatching(/select a size/), 'warning');
  });

  it('adds with quantity', async () => {
    const { result } = await load();
    act(() => { result.current.setSelectedSize('M'); result.current.handleQuantityChange(1); });
    act(() => result.current.handleAddToCart());
    expect(addItem).toHaveBeenCalledTimes(2);
    expect(addItem).toHaveBeenLastCalledWith(shirt, 'M', false);
    expect(result.current.quantity).toBe(1);
    expect(result.current.selectedSize).toBe('');
  });

  it('does not reset when addItem fails', async () => {
    addItem.mockReturnValue(false);
    const { result } = await load();
    act(() => result.current.setSelectedSize('M'));
    act(() => result.current.handleAddToCart());
    expect(result.current.selectedSize).toBe('M');
  });

  it('validates and adds custom measurements', async () => {
    const { result } = await load();
    act(() => result.current.setIsCustomizing(true));
    act(() => result.current.handleAddToCart());
    expect(showToast).toHaveBeenCalledWith(expect.stringMatching(/valid measurements/), 'warning');
    act(() => result.current.setCustomMeasurements({ shoulder: '45', chest: '100', sleeve: '64', neck: '40', length: '' }));
    act(() => result.current.handleAddToCart());
    expect(addItem).toHaveBeenCalledWith(shirt, expect.any(String));
    expect(result.current.isCustomizing).toBe(false);
  });

  it('marks made-to-measure tailoring', async () => {
    vi.mocked(productService.getById).mockResolvedValue({ ...shirt, name: 'Wool Blazer', madeToMeasure: true });
    const { result } = await load();
    expect(result.current.garmentType).toBe('blazer');
    expect(result.current.isMadeToMeasure).toBe(true);
    expect(result.current.canTailor).toBe(true);
  });
});
