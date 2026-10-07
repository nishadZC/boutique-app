import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useCartPage } from './useCartPage';

const showToast = vi.fn();
const removeItem = vi.fn();
const updateQuantity = vi.fn();
const clearCart = vi.fn();
let user: any;
let items: any[];
let checkoutOpts: any;

vi.mock('../contexts/CartContext', () => ({ useCart: () => ({ items, removeItem, updateQuantity, clearCart }) }));
vi.mock('../contexts/ToastContext', () => ({ useToast: () => ({ showToast }) }));
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user }) }));
vi.mock('../hooks/useCheckout', () => ({
  useCheckout: (o: any) => { checkoutOpts = o; return { finalTotal: 1, isCheckingOut: false, handleCheckout: vi.fn() }; },
}));

const ADDR = '1, Main St, City, State, 123456, India';
const fields = { houseNumber: '1', street: 'Main St', city: 'City', state: 'State', postalCode: '123456', country: 'India' };

// Node's built-in localStorage can shadow jsdom's; use a deterministic in-memory stub.
const memStore = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => (memStore.has(k) ? memStore.get(k)! : null),
  setItem: (k: string, v: string) => { memStore.set(k, String(v)); },
  removeItem: (k: string) => { memStore.delete(k); },
  clear: () => memStore.clear(),
});

describe('useCartPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    user = { id: 'u1', address: ADDR, phone: '9876543210' };
    items = [
      { id: 'a', selectedSize: 'M', quantity: 1, inventory: 3, price: 100, name: 'A' },
      { id: 'b', quantity: 2, inventory: 2, price: 50, name: 'B' },
    ];
  });

  it('seeds profile address when nothing saved', () => {
    const { result } = renderHook(() => useCartPage());
    expect(result.current.savedAddresses).toEqual([expect.objectContaining({ id: 'profile-address' })]);
    expect(result.current.addressComplete).toBe(true);
    expect(result.current.selectedCartItems).toHaveLength(2);
  });

  it('deduplicates stored addresses', () => {
    const s = { id: '1', label: 'x', fields, phone: '' };
    localStorage.setItem('savedAddresses:u1', JSON.stringify([s, { ...s, id: '2' }]));
    const { result } = renderHook(() => useCartPage());
    expect(result.current.savedAddresses).toHaveLength(1);
  });

  it('handles corrupt storage', () => {
    localStorage.setItem('savedAddresses:u1', '{bad');
    user.address = '';
    const { result } = renderHook(() => useCartPage());
    expect(localStorage.getItem('savedAddresses:u1')).toBeNull();
    expect(result.current.savedAddresses).toEqual([]);
  });

  it('works without user', () => {
    user = null;
    const { result } = renderHook(() => useCartPage());
    expect(result.current.phone).toBe('');
    act(() => checkoutOpts.onAddressSaved());
    expect(result.current.savedAddresses).toEqual([]);
  });

  it('toggles selection', () => {
    const { result } = renderHook(() => useCartPage());
    act(() => result.current.toggleItemSelection('a', 'M'));
    expect(result.current.selectedCartItems.map(i => i.id)).toEqual(['b']);
    act(() => result.current.toggleItemSelection('a', 'M'));
    expect(result.current.selectedCartItems).toHaveLength(2);
    act(() => result.current.toggleAllSelection());
    expect(result.current.selectedCartItems).toHaveLength(0);
    act(() => result.current.toggleAllSelection());
    expect(result.current.selectedCartItems).toHaveLength(2);
    expect(result.current.getItemKey('x')).toBe('x|');
  });

  it('changes quantity within bounds', () => {
    const { result } = renderHook(() => useCartPage());
    result.current.handleQuantityChange('a', 1, 'M');
    expect(updateQuantity).toHaveBeenCalledWith('a', 'M', 2);
    result.current.handleQuantityChange('a', -1, 'M');
    result.current.handleQuantityChange('b', 1);
    result.current.handleQuantityChange('zzz', 1);
    expect(updateQuantity).toHaveBeenCalledTimes(1);
  });

  it('removes items with toast', () => {
    const { result } = renderHook(() => useCartPage());
    result.current.handleRemoveItem('a', 'A', 'M');
    expect(removeItem).toHaveBeenCalledWith('a', 'M');
    expect(showToast).toHaveBeenCalledWith('A removed from your cart.', 'info');
  });

  it('selects a saved address', () => {
    const { result } = renderHook(() => useCartPage());
    act(() => result.current.selectSavedAddress({ id: 's', label: 'l', fields: { ...fields, city: 'X' }, phone: '9999999999' }));
    expect(result.current.selectedAddressId).toBe('s');
    expect(result.current.addressFields.city).toBe('X');
    expect(result.current.phone).toBe('9999999999');
  });

  it('saves current address: updates existing and appends new', () => {
    const { result } = renderHook(() => useCartPage());
    act(() => checkoutOpts.onAddressSaved());
    let stored = JSON.parse(localStorage.getItem('savedAddresses:u1')!);
    expect(stored).toHaveLength(1);
    expect(stored[0].phone).toBe('+919876543210');
    act(() => result.current.setAddressFields({ ...fields, city: 'Other' }));
    act(() => checkoutOpts.onAddressSaved());
    stored = JSON.parse(localStorage.getItem('savedAddresses:u1')!);
    expect(stored).toHaveLength(2);
    expect(stored[1].label).toBe('Address 2');
  });

  it('labels first saved address as profile address and skips invalid phone', () => {
    user.address = '';
    const { result } = renderHook(() => useCartPage());
    act(() => result.current.setPhone('1'));
    act(() => checkoutOpts.onAddressSaved());
    expect(localStorage.getItem('savedAddresses:u1')).toBeNull();
    act(() => { result.current.setPhone('9876543210'); result.current.setAddressFields(fields); });
    act(() => checkoutOpts.onAddressSaved());
    expect(result.current.savedAddresses[0].label).toBe('Profile address');
  });
});
