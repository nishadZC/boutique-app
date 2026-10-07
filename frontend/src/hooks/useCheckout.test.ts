import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useCheckout } from './useCheckout';
import { orderService } from '../services/orderService';
import { paymentService } from '../services/paymentService';

const navigate = vi.fn();
const showToast = vi.fn();
const removeItems = vi.fn();
const updateProfile = vi.fn();
let user: any;

vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('../contexts/CartContext', () => ({ useCart: () => ({ removeItems }) }));
vi.mock('../contexts/ToastContext', () => ({ useToast: () => ({ showToast }) }));
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user, updateProfile }) }));
vi.mock('../services/orderService', () => ({ orderService: { createOrder: vi.fn() } }));
vi.mock('../services/paymentService', () => ({
  paymentService: { createPaymentOrder: vi.fn(), openCheckout: vi.fn(), verifyPayment: vi.fn(), markPaymentFailed: vi.fn() },
}));

const items = [{ id: 'p1', quantity: 2, selectedSize: 'M', price: 100 }];
const setAddressError = vi.fn();
const onAddressSaved = vi.fn();
const base = { address: '1, Main St, City, State, 123456, India', addressComplete: true, phone: '9876543210', setAddressError, onAddressSaved, checkoutItems: items };

const render = (opts: Partial<typeof base> = {}) => renderHook(() => useCheckout({ ...base, ...opts }));

describe('useCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    user = { firstName: 'A', lastName: 'B', email: 'a@b.com', address: 'old', phone: '+919876543210' };
    updateProfile.mockResolvedValue(undefined);
    vi.mocked(orderService.createOrder).mockResolvedValue({ id: 'o1' } as any);
    vi.mocked(paymentService.createPaymentOrder).mockResolvedValue({ keyId: 'k', amount: 1, currency: 'INR', id: 'rp1' } as any);
    vi.mocked(paymentService.markPaymentFailed).mockResolvedValue(undefined as any);
  });

  it('computes total', () => {
    expect(render().result.current.finalTotal).toBeGreaterThan(0);
  });

  it('rejects incomplete address', async () => {
    const { result } = render({ addressComplete: false });
    await act(() => result.current.handleCheckout());
    expect(setAddressError).toHaveBeenCalledWith(expect.stringMatching(/address/));
    expect(orderService.createOrder).not.toHaveBeenCalled();
  });

  it('rejects bad phone', async () => {
    const { result } = render({ phone: '123' });
    await act(() => result.current.handleCheckout());
    expect(showToast).toHaveBeenCalledWith(expect.any(String), 'warning');
    expect(orderService.createOrder).not.toHaveBeenCalled();
  });

  it('redirects to profile when user incomplete', async () => {
    user = { firstName: '', lastName: 'B' };
    const { result } = render();
    await act(() => result.current.handleCheckout());
    expect(navigate).toHaveBeenCalledWith('/profile');
  });

  it('completes payment successfully', async () => {
    updateProfile.mockRejectedValue(new Error('x'));
    vi.mocked(paymentService.verifyPayment).mockResolvedValue(undefined as any);
    vi.mocked(paymentService.openCheckout).mockImplementation(async (o: any) => {
      o.handler({ razorpay_order_id: 'a', razorpay_payment_id: 'b', razorpay_signature: 'c' });
    });
    const { result } = render();
    await act(() => result.current.handleCheckout());
    expect(updateProfile).toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith(expect.stringMatching(/successful/), 'success');
    expect(onAddressSaved).toHaveBeenCalled();
    expect(removeItems).toHaveBeenCalledWith([{ id: 'p1', selectedSize: 'M' }]);
    expect(navigate).toHaveBeenCalledWith('/orders');
    expect(result.current.isCheckingOut).toBe(false);
  });

  it('skips profile update when unchanged and handles verify failure', async () => {
    user.address = base.address;
    vi.mocked(paymentService.verifyPayment).mockRejectedValue(new Error('bad'));
    vi.mocked(paymentService.openCheckout).mockImplementation(async (o: any) => {
      o.handler({ razorpay_order_id: 'a', razorpay_payment_id: 'b', razorpay_signature: 'c' });
    });
    const { result } = render();
    await act(() => result.current.handleCheckout());
    expect(updateProfile).not.toHaveBeenCalled();
    expect(paymentService.markPaymentFailed).toHaveBeenCalledWith('o1');
    expect(showToast).toHaveBeenCalledWith(expect.stringMatching(/failed/), 'error');
  });

  it('handles dismissal', async () => {
    vi.mocked(paymentService.openCheckout).mockImplementation(async (o: any) => o.modal.ondismiss());
    const { result } = render();
    await act(() => result.current.handleCheckout());
    expect(paymentService.markPaymentFailed).toHaveBeenCalledWith('o1');
  });

  it('does not mark payment failed when order creation fails', async () => {
    vi.mocked(orderService.createOrder).mockRejectedValue(new Error('x'));
    const { result } = render();
    await act(() => result.current.handleCheckout());
    expect(paymentService.markPaymentFailed).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith(expect.any(String), 'error');
  });
});
