import { renderHook, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useOrders } from './useOrders';
import { orderService } from '../services/orderService';
import { reviewService } from '../services/reviewService';
import { downloadInvoicePdf } from '../services/invoice/invoicePdfService';

const navigate = vi.fn();
const showToast = vi.fn();
const user = { id: 'u' };
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user }) }));
vi.mock('../contexts/ToastContext', () => ({ useToast: () => ({ showToast }) }));
vi.mock('../services/orderService', () => ({ orderService: { getUserOrders: vi.fn(), cancelOrder: vi.fn(), requestReturn: vi.fn() } }));
vi.mock('../services/reviewService', () => ({ reviewService: { mineForOrder: vi.fn() } }));
vi.mock('../services/invoice/invoicePdfService', () => ({ downloadInvoicePdf: vi.fn() }));

const orders: any[] = [{ id: 'o1', status: 'delivered' }, { id: 'o2', status: 'pending' }, { id: 'o3', status: 'delivered' }];

describe('useOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(orderService.getUserOrders).mockResolvedValue(orders);
    vi.mocked(reviewService.mineForOrder).mockImplementation(async (id: string) => {
      if (id === 'o3') throw new Error('x');
      return [{ productId: 'p', rating: 4 }] as any;
    });
  });

  const load = async () => {
    const r = renderHook(() => useOrders());
    await waitFor(() => expect(r.result.current.loading).toBe(false));
    return r;
  };

  it('loads orders and ratings', async () => {
    const { result } = await load();
    expect(result.current.orders).toEqual(orders);
    expect(result.current.myRatings).toEqual({ o1: { p: 4 }, o3: {} });
    act(() => result.current.recordRating('o2', 'q', 5));
    act(() => result.current.recordRating('o1', 'q', 3));
    expect(result.current.myRatings).toEqual({ o1: { p: 4, q: 3 }, o2: { q: 5 }, o3: {} });
  });

  it('sets error on failure', async () => {
    vi.mocked(orderService.getUserOrders).mockRejectedValue(new Error('x'));
    const { result } = await load();
    expect(result.current.error).toBe('Failed to load your orders');
  });

  it('ignores after unmount', async () => {
    let resolve!: (v: any) => void;
    vi.mocked(orderService.getUserOrders).mockReturnValue(new Promise(r => { resolve = r; }));
    const { result, unmount } = renderHook(() => useOrders());
    unmount();
    resolve(orders);
    await Promise.resolve();
    expect(result.current.orders).toEqual([]);
  });

  it('downloads invoice and reports errors', async () => {
    const { result } = await load();
    await act(() => result.current.handleDownloadInvoice(orders[0]));
    expect(downloadInvoicePdf).toHaveBeenCalledWith(orders[0], user);
    vi.mocked(downloadInvoicePdf).mockRejectedValueOnce(new Error('boom'));
    await act(() => result.current.handleDownloadInvoice(orders[0]));
    expect(showToast).toHaveBeenCalledWith('boom', 'error');
    vi.mocked(downloadInvoicePdf).mockRejectedValueOnce('str');
    await act(() => result.current.handleDownloadInvoice(orders[0]));
    expect(showToast).toHaveBeenCalledWith('Could not create the invoice', 'error');
  });

  it('submits cancel and return requests', async () => {
    const { result } = await load();
    vi.mocked(orderService.cancelOrder).mockResolvedValue('cancelled');
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.submitRequest(orders[1], { kind: 'cancel' }, 'r', 'd'); });
    expect(ok).toBe(true);
    expect(showToast).toHaveBeenCalledWith('cancelled', 'success');
    vi.mocked(orderService.requestReturn).mockResolvedValue('returned');
    vi.mocked(orderService.getUserOrders).mockRejectedValueOnce(new Error('reload'));
    await act(async () => { ok = await result.current.submitRequest(orders[0], { kind: 'return', type: 'refund' }, 'r', 'd'); });
    expect(orderService.requestReturn).toHaveBeenCalledWith('o1', 'refund', 'r', 'd');
    expect(ok).toBe(true);
  });

  it('reports request failures', async () => {
    const { result } = await load();
    vi.mocked(orderService.cancelOrder).mockRejectedValueOnce({ response: { data: { error: 'nope' } } });
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.submitRequest(orders[1], { kind: 'cancel' }, 'r', 'd'); });
    expect(ok).toBe(false);
    expect(showToast).toHaveBeenCalledWith('nope', 'error');
    vi.mocked(orderService.cancelOrder).mockRejectedValueOnce(undefined);
    await act(async () => { await result.current.submitRequest(orders[1], { kind: 'cancel' }, 'r', 'd'); });
    expect(showToast).toHaveBeenCalledWith('Could not submit your request. Please try again.', 'error');
  });
});
