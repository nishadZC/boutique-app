import { describe, it, expect, vi, beforeEach } from 'vitest';

const { api, axiosPost } = vi.hoisted(() => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  axiosPost: vi.fn(),
}));
vi.mock('./api', () => ({ default: api }));
vi.mock('axios', () => ({ default: { post: axiosPost } }));

import { adminService, apiErrorMessage } from './adminService';
import { authService } from './authService';
import { orderService } from './orderService';
import { reviewService } from './reviewService';
import { userService } from './userService';
import { wishlistService } from './wishlistService';
import { productService } from './productService';
import { paymentService } from './paymentService';

const wrap = (d: unknown) => ({ data: { data: d } });

const memStore = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => (memStore.has(k) ? memStore.get(k)! : null),
  setItem: (k: string, v: string) => { memStore.set(k, String(v)); },
  removeItem: (k: string) => { memStore.delete(k); },
  clear: () => memStore.clear(),
});

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('apiErrorMessage', () => {
  it('extracts error or falls back', () => {
    expect(apiErrorMessage({ response: { data: { error: 'boom' } } }, 'fb')).toBe('boom');
    expect(apiErrorMessage(undefined, 'fb')).toBe('fb');
    expect(apiErrorMessage({}, 'fb')).toBe('fb');
  });
});

describe('adminService', () => {
  it('unwraps data for every GET/POST endpoint', async () => {
    api.get.mockResolvedValue(wrap('G'));
    api.post.mockResolvedValue(wrap('P'));
    api.put.mockResolvedValue(wrap('U'));
    api.patch.mockResolvedValue(wrap('A'));
    expect(await adminService.getKpis(7)).toBe('G');
    expect(api.get).toHaveBeenCalledWith('/orders/admin/kpis', { params: { days: 7 } });
    expect(await adminService.listOrders({ page: 1 })).toBe('G');
    expect(await adminService.getOrder('o1')).toBe('G');
    expect(api.get).toHaveBeenCalledWith('/orders/admin/orders/o1');
    expect(await adminService.recordRefund('o1', 'n')).toBe('P');
    expect(await adminService.refundOrder('o1', { note: 'x' })).toBe('P');
    expect(api.post).toHaveBeenCalledWith('/payments/admin/orders/o1/refund', { note: 'x' });
    expect(await adminService.rejectRequest('o1', 'r1', 'no')).toBe('P');
    expect(api.post).toHaveBeenCalledWith('/orders/admin/orders/o1/requests/r1/reject', { note: 'no' });
    expect(await adminService.listCategories()).toBe('G');
    expect(await adminService.listProducts({})).toBe('G');
    expect(await adminService.getProduct('p')).toBe('G');
    expect(await adminService.createProduct({} as never)).toBe('P');
    expect(await adminService.updateProduct('p', {} as never)).toBe('U');
    expect(await adminService.setProductActive('p', false)).toBe('A');
    expect(api.patch).toHaveBeenCalledWith('/products/admin/products/p/status', { isActive: false });
    expect(await adminService.adjustInventory('p', { mode: 'set', quantity: 1, reason: 'r' })).toBe('P');
    expect(await adminService.inventoryHistory('p')).toBe('G');
    expect(await adminService.inventorySummary()).toBe('G');
    expect(await adminService.listCustomers({})).toBe('G');
  });

  it('updateOrderStatus returns whole body', async () => {
    api.patch.mockResolvedValue({ data: { data: 1, refundRequired: true, message: 'm' } });
    expect(await adminService.updateOrderStatus('o', 'shipped' as never, 'n')).toEqual({ data: 1, refundRequired: true, message: 'm' });
    expect(api.patch).toHaveBeenCalledWith('/orders/admin/orders/o/status', { status: 'shipped', note: 'n' });
  });

  it('uploadProductImage sends multipart form', async () => {
    api.post.mockResolvedValue(wrap({ imageUrl: 'u' }));
    const file = new File(['x'], 'a.png');
    expect(await adminService.uploadProductImage('p', file)).toEqual({ imageUrl: 'u' });
    const [url, form, cfg] = api.post.mock.calls[0];
    expect(url).toBe('/products/admin/products/p/image');
    expect((form as FormData).get('image')).toBeInstanceOf(File);
    expect(cfg).toEqual({ headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 });
  });

  it('customerOrderStats / lookupCustomers short-circuit on empty and dedupe ids', async () => {
    expect(await adminService.customerOrderStats([])).toEqual({});
    expect(await adminService.lookupCustomers([])).toEqual({});
    expect(api.get).not.toHaveBeenCalled();
    api.get.mockResolvedValue(wrap({ a: 1 }));
    expect(await adminService.customerOrderStats(['a', 'b'])).toEqual({ a: 1 });
    expect(api.get).toHaveBeenCalledWith('/orders/admin/customers/summary', { params: { userIds: 'a,b' } });
    await adminService.lookupCustomers(['a', 'a', 'b']);
    expect(api.get).toHaveBeenLastCalledWith('/users/admin/customers/lookup', { params: { ids: 'a,b' } });
  });
});

describe('authService', () => {
  it('posts to auth endpoints and returns data', async () => {
    api.post.mockResolvedValue({ data: 'R' });
    api.get.mockResolvedValue({ data: 'ME' });
    expect(await authService.login({ email: 'e', password: 'p' } as never)).toBe('R');
    expect(await authService.loginWithGoogle('c')).toBe('R');
    expect(api.post).toHaveBeenCalledWith('/auth/google', { credential: 'c' });
    expect(await authService.register({} as never)).toBe('R');
    expect(await authService.refreshToken('rt')).toBe('R');
    await authService.changePassword('a', 'b');
    expect(api.post).toHaveBeenCalledWith('/auth/change-password', { currentPassword: 'a', newPassword: 'b' });
    expect(await authService.getCurrentAccount()).toBe('ME');
  });

  it('logout clears tokens', async () => {
    api.post.mockResolvedValue({});
    localStorage.setItem('accessToken', 'a');
    localStorage.setItem('refreshToken', 'r');
    await authService.logout();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('completePasswordChange bypasses apiClient with bearer token', async () => {
    axiosPost.mockResolvedValue({ data: 'S' });
    expect(await authService.completePasswordChange('tok', 'np')).toBe('S');
    expect(axiosPost).toHaveBeenCalledWith(expect.stringMatching(/\/auth\/complete-password-change$/), { newPassword: 'np' },
      { headers: { Authorization: 'Bearer tok' }, timeout: 10000 });
    expect(api.post).not.toHaveBeenCalled();
  });
});

describe('orderService', () => {
  it('unwraps data or falls back to body', async () => {
    api.post.mockResolvedValueOnce(wrap('O'));
    expect(await orderService.createOrder({ items: [], shippingAddress: {} })).toBe('O');
    api.post.mockResolvedValueOnce({ data: 'raw' });
    expect(await orderService.createOrder({ items: [], shippingAddress: {} })).toBe('raw');
    api.get.mockResolvedValueOnce(wrap(['a']));
    expect(await orderService.getUserOrders()).toEqual(['a']);
    api.get.mockResolvedValueOnce({ data: ['b'] });
    expect(await orderService.getUserOrders()).toEqual(['b']);
  });
  it('cancel/return return message', async () => {
    api.post.mockResolvedValue({ data: { message: 'ok' } });
    expect(await orderService.cancelOrder('o', 'r', 'd')).toBe('ok');
    expect(api.post).toHaveBeenCalledWith('/orders/o/cancel', { reason: 'r', details: 'd' });
    expect(await orderService.requestReturn('o', 'refund', 'r')).toBe('ok');
    expect(api.post).toHaveBeenCalledWith('/orders/o/return', { type: 'refund', reason: 'r', details: undefined });
  });
});

describe('reviewService', () => {
  it('calls endpoints', async () => {
    api.get.mockResolvedValue(wrap('G'));
    api.post.mockResolvedValue(wrap('P'));
    expect(await reviewService.forProduct('p')).toBe('G');
    expect(api.get).toHaveBeenCalledWith('/products/reviews/product/p', { params: { limit: 10 } });
    expect(await reviewService.mineForOrder('o')).toBe('G');
    expect(await reviewService.create({ productId: 'p', orderId: 'o', rating: 5 })).toBe('P');
  });
});

describe('userService', () => {
  it('maps profile with defaults', async () => {
    api.get.mockResolvedValue({ data: { firstName: 'A', lastName: null, phone: null, address: 'x' } });
    expect(await userService.getProfile()).toEqual({ firstName: 'A', lastName: '', phone: undefined, address: 'x' });
    api.put.mockResolvedValue({ data: {} });
    expect(await userService.updateProfile({ firstName: 'a', lastName: 'b' })).toEqual({ firstName: '', lastName: '', phone: undefined, address: undefined });
  });
});

describe('wishlistService', () => {
  it('maps ids and adds/removes', async () => {
    api.get.mockResolvedValue(wrap([{ product_id: '1' }, { product_id: '2' }]));
    expect(await wishlistService.getProductIds()).toEqual(['1', '2']);
    await wishlistService.add('3');
    expect(api.post).toHaveBeenCalledWith('/wishlist/3');
    await wishlistService.remove('3');
    expect(api.delete).toHaveBeenCalledWith('/wishlist/3');
  });
});

describe('productService', () => {
  const row = {
    id: '1', name: 'N', description: 'D', price: '10.5', compare_price: '20', image_url: 'img', category: 'c',
    brand: 'b', inventory_quantity: 3, rating: '4.5', review_count: '2', base_colour: 'red', is_featured: 1,
    is_handcrafted: 0, made_to_measure: true, making_days: 5, discountPercentage: 10, created_at: 'c', updated_at: 'u', images: ['i'],
  };
  it('getAll maps wrapped products', async () => {
    api.get.mockResolvedValue({ data: { success: true, data: { products: [row] } } });
    const [p] = await productService.getAll();
    expect(p).toMatchObject({ price: 10.5, originalPrice: 20, imageUrl: 'img', inventory: 3, rating: 4.5, reviewCount: 2,
      color: 'red', isNew: true, isHandcrafted: false, madeToMeasure: true, makingDays: 5, images: ['i'] });
    expect(p.sizes).toContain('One Size');
  });
  it('getAll handles array and other shapes; defaults applied', async () => {
    api.get.mockResolvedValueOnce({ data: [{ id: '2', price: '1', category_id: 'cid', inventory: 4 }] });
    const [p] = await productService.getAll();
    expect(p).toMatchObject({ originalPrice: undefined, category: 'cid', inventory: 4, rating: 0, reviewCount: 0, color: '',
      makingDays: null, images: [] });
    expect(p.imageUrl).toMatch(/^https:\/\/res\.cloudinary\.com/);
    api.get.mockResolvedValueOnce({ data: { success: false } });
    expect(await productService.getAll()).toEqual([]);
    api.get.mockResolvedValueOnce({ data: [{ id: '3', price: '1' }] });
    expect((await productService.getAll())[0].inventory).toBe(0);
  });
  it('getById unwraps data or raw', async () => {
    api.get.mockResolvedValueOnce(wrap(row));
    expect((await productService.getById('1')).id).toBe('1');
    expect(api.get).toHaveBeenCalledWith('/products/1');
    api.get.mockResolvedValueOnce({ data: { ...row, id: '9' } });
    expect((await productService.getById('9')).id).toBe('9');
  });
  it('getByCategory and search return raw body', async () => {
    api.get.mockResolvedValue({ data: ['x'] });
    expect(await productService.getByCategory('shoes')).toEqual(['x']);
    expect(api.get).toHaveBeenCalledWith('/products?category=shoes');
    expect(await productService.search('q')).toEqual(['x']);
    expect(api.get).toHaveBeenCalledWith('/products/search?q=q');
  });
});

describe('paymentService', () => {
  it('API calls unwrap data', async () => {
    api.post.mockResolvedValue(wrap('D'));
    expect(await paymentService.createPaymentOrder('o')).toBe('D');
    expect(await paymentService.verifyPayment({} as never)).toBe('D');
    expect(await paymentService.markPaymentFailed('o')).toBe('D');
    expect(api.post).toHaveBeenCalledWith('/payments/status', { orderId: 'o', paymentStatus: 'failed' });
  });

  it('openCheckout uses existing Razorpay', async () => {
    const open = vi.fn();
    const Ctor = vi.fn(function (this: { open: () => void }) { this.open = open; });
    (window as any).Razorpay = Ctor;
    await paymentService.openCheckout({ key: 'k' });
    expect(Ctor).toHaveBeenCalledWith({ key: 'k' });
    expect(open).toHaveBeenCalled();
    delete (window as any).Razorpay;
  });

  it('openCheckout loads script then opens', async () => {
    const open = vi.fn();
    const p = paymentService.openCheckout({});
    const script = document.body.querySelector('script[src*="razorpay"]') as HTMLScriptElement;
    expect(script).toBeTruthy();
    (window as any).Razorpay = function (this: any) { this.open = open; };
    script.onload!(new Event('load'));
    await p;
    expect(open).toHaveBeenCalled();
    delete (window as any).Razorpay;
    script.remove();
  });

  it('openCheckout rejects when script fails', async () => {
    const p = paymentService.openCheckout({});
    const script = document.body.querySelector('script[src*="razorpay"]') as HTMLScriptElement;
    script.onerror!(new Event('error'));
    await expect(p).rejects.toThrow('Unable to load Razorpay checkout');
    script.remove();
  });
});
