import { renderHook, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useProfile } from './useProfile';
import { orderService } from '../services/orderService';
import { authService } from '../services/authService';

const navigate = vi.fn();
const showToast = vi.fn();
const updateProfile = vi.fn();
const logout = vi.fn();
let user: any;
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user, updateProfile, logout }) }));
vi.mock('../contexts/ToastContext', () => ({ useToast: () => ({ showToast }) }));
vi.mock('../contexts/WishlistContext', () => ({ useWishlist: () => ({ productIds: ['a', 'b'] }) }));
vi.mock('../services/orderService', () => ({ orderService: { getUserOrders: vi.fn() } }));
vi.mock('../services/authService', () => ({ authService: { changePassword: vi.fn() } }));
vi.mock('../services/adminService', () => ({
  apiErrorMessage: (e: any, f: string) => e?.response?.data?.error ?? f,
}));

const ADDR = '1, Main St, City, State, 123456, India';
const fields = { houseNumber: '1', street: 'Main St', city: 'City', state: 'State', postalCode: '123456', country: 'India' };
const USER = { id: 'u1', firstName: 'A', lastName: 'B', phone: '9876543210', address: ADDR };

// Node's built-in localStorage can shadow jsdom's; use a deterministic in-memory stub.
const memStore = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => (memStore.has(k) ? memStore.get(k)! : null),
  setItem: (k: string, v: string) => { memStore.set(k, String(v)); },
  removeItem: (k: string) => { memStore.delete(k); },
  clear: () => memStore.clear(),
});

describe('useProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    user = USER;
    updateProfile.mockResolvedValue(undefined);
    vi.mocked(orderService.getUserOrders).mockResolvedValue([
      { paymentStatus: 'paid', totalAmount: '100', status: 'delivered' },
      { paymentStatus: 'paid', status: 'pending' },
      { paymentStatus: 'failed', totalAmount: 5, status: 'pending' },
    ] as any);
  });

  it('loads details, saved addresses, orders and stats', async () => {
    localStorage.setItem('savedAddresses:u1', JSON.stringify([{ id: 's', label: 'L', fields, phone: '' }]));
    const { result } = renderHook(() => useProfile());
    await waitFor(() => expect(result.current.orders).not.toBeNull());
    expect(result.current.details).toEqual({ firstName: 'A', lastName: 'B', phone: '9876543210' });
    expect(result.current.savedAddresses).toHaveLength(1);
    expect(result.current.stats).toEqual({ orders: 2, spent: 100, delivered: 1, wishlist: 2 });
    expect(result.current.detailsErrors).toEqual({ firstName: null, lastName: null, phone: null });
  });

  it('falls back on order error and corrupt storage', async () => {
    localStorage.setItem('savedAddresses:u1', '{bad');
    vi.mocked(orderService.getUserOrders).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useProfile());
    await waitFor(() => expect(result.current.orders).toEqual([]));
    expect(result.current.savedAddresses).toEqual([]);
  });

  it('does nothing without a user', async () => {
    user = null;
    const { result } = renderHook(() => useProfile());
    expect(result.current.orders).toBeNull();
    expect(result.current.stats.orders).toBe(0);
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.saveAddress(); });
    expect(ok).toBe(false);
    act(() => result.current.removeSavedAddress('x'));
    act(() => result.current.setDetails({ firstName: 'a', lastName: 'b', phone: '' }));
    await act(async () => { ok = await result.current.saveDetails(); });
    expect(ok).toBe(true); // save() returns false but saveDetails still reports success
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it('saves details and validates', async () => {
    const { result } = renderHook(() => useProfile());
    await waitFor(() => expect(result.current.orders).not.toBeNull());
    act(() => result.current.setDetails({ firstName: ' ', lastName: '', phone: '12' }));
    expect(result.current.detailsErrors.firstName).toBeTruthy();
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.saveDetails(); });
    expect(ok).toBe(false);
    act(() => result.current.setDetails({ firstName: ' Z ', lastName: 'Y', phone: '9876543210' }));
    await act(async () => { ok = await result.current.saveDetails(); });
    expect(ok).toBe(true);
    expect(updateProfile).toHaveBeenCalledWith({ firstName: 'Z', lastName: 'Y', phone: '+919876543210', address: ADDR });
    updateProfile.mockRejectedValueOnce({ response: { data: { error: 'srv' } } });
    await act(async () => { ok = await result.current.saveDetails(); });
    expect(ok).toBe(false);
    expect(showToast).toHaveBeenCalledWith('srv', 'error');
  });

  it('saves address', async () => {
    user = { ...USER, phone: undefined, address: '' };
    const { result } = renderHook(() => useProfile());
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.saveAddress(); });
    expect(ok).toBe(false);
    expect(showToast).toHaveBeenCalledWith(expect.any(String), 'warning');
    act(() => result.current.setAddress(fields));
    await act(async () => { ok = await result.current.saveAddress(); });
    expect(ok).toBe(true);
    expect(updateProfile).toHaveBeenCalledWith({ firstName: 'A', lastName: 'B', phone: '', address: ADDR });
    updateProfile.mockRejectedValueOnce(new Error('x'));
    await act(async () => { ok = await result.current.saveAddress(); });
    expect(ok).toBe(false);
    expect(showToast).toHaveBeenCalledWith('Could not save your address', 'error');
  });

  it('removes and makes default saved address', async () => {
    localStorage.setItem('savedAddresses:u1', JSON.stringify([{ id: 's', label: 'Home', fields, phone: '' }, { id: 't', label: 'W', fields: { ...fields, street: '' }, phone: '' }]));
    const { result } = renderHook(() => useProfile());
    await waitFor(() => expect(result.current.savedAddresses).toHaveLength(2));
    await act(() => result.current.makeDefaultAddress(result.current.savedAddresses[1]));
    expect(updateProfile).toHaveBeenLastCalledWith(expect.objectContaining({ address: '' }));
    updateProfile.mockRejectedValueOnce(new Error('x'));
    await act(() => result.current.makeDefaultAddress(result.current.savedAddresses[0]));
    expect(showToast).toHaveBeenCalledWith('Could not update your address', 'error');
    act(() => result.current.removeSavedAddress('s'));
    expect(result.current.savedAddresses.map(a => a.id)).toEqual(['t']);
    expect(JSON.parse(localStorage.getItem('savedAddresses:u1')!)).toHaveLength(1);
  });

  it('changes password and logs out', async () => {
    const { result } = renderHook(() => useProfile());
    await act(() => result.current.changePassword('a', 'b'));
    expect(authService.changePassword).toHaveBeenCalledWith('a', 'b');
    await act(() => result.current.handleLogout());
    expect(logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/');
  });
});
