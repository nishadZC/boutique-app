import { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useCheckout } from '../hooks/useCheckout';
import { calculateCartTotals } from '../utils/cartPricing';
import { addressFromString, formatAddress, AddressFields, SavedAddress } from '../types/address';

export const useCartPage = () => {
  const { items, removeItem, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [addressFields, setAddressFields] = useState<AddressFields>(() => addressFromString(user?.address));
  const [phone, setPhone] = useState(user?.phone || '');
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('current');
  const [addressError, setAddressError] = useState('');
  
  const address = formatAddress(addressFields);
  const savedAddressKey = user ? `savedAddresses:${user.id}` : '';
  const fallbackImage = 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787585185/boutique/products/405dce7e-bed9-4d33-81c2-9a3045d65312.jpg';

  const normalizeAddress = (addr: string) => addr.toLowerCase().replace(/\s+/g, ' ').trim();

  const saveCurrentAddress = () => {
    if (!user || !address.trim() || !phone.trim()) return;
    const normCurrent = normalizeAddress(address);

    const existingIndex = savedAddresses.findIndex(
      saved => normalizeAddress(formatAddress(saved.fields)) === normCurrent
    );

    let nextAddresses: SavedAddress[];
    if (existingIndex >= 0) {
      nextAddresses = savedAddresses.map((saved, idx) =>
        idx === existingIndex ? { ...saved, fields: addressFields, phone } : saved
      );
    } else {
      const nextAddress: SavedAddress = {
        id: `${Date.now()}`,
        label: savedAddresses.length === 0 ? 'Profile address' : `Address ${savedAddresses.length + 1}`,
        fields: addressFields,
        phone,
      };
      nextAddresses = [...savedAddresses, nextAddress];
    }

    localStorage.setItem(savedAddressKey, JSON.stringify(nextAddresses));
    setSavedAddresses(nextAddresses);
  };

  const { finalTotal, isCheckingOut, handleCheckout } = useCheckout({
    address,
    phone,
    setAddressError,
    onAddressSaved: saveCurrentAddress,
  });

  useEffect(() => {
    if (!user) return;
    setPhone(user.phone || '');
    const stored = localStorage.getItem(`savedAddresses:${user.id}`);
    let parsed: SavedAddress[] = [];
    try {
      parsed = stored ? JSON.parse(stored) : [];
    } catch {
      localStorage.removeItem(`savedAddresses:${user.id}`);
    }

    if (parsed.length > 0) {
      const seen = new Set<string>();
      const deduplicated: SavedAddress[] = [];
      for (const item of parsed) {
        const normKey = normalizeAddress(formatAddress(item.fields));
        if (!seen.has(normKey)) {
          seen.add(normKey);
          deduplicated.push(item);
        }
      }
      setSavedAddresses(deduplicated);
    } else if (user.address) {
      setSavedAddresses([{
        id: 'profile-address',
        label: 'Profile address',
        fields: addressFromString(user.address),
        phone: user.phone || '',
      }]);
    }
    if (user.address) setAddressFields(addressFromString(user.address));
  }, [user]);

  const selectSavedAddress = (saved: SavedAddress) => {
    setSelectedAddressId(saved.id);
    setAddressFields(saved.fields);
    setPhone(saved.phone);
    setAddressError('');
  };

  const handleQuantityChange = (productId: string, delta: number, selectedSize?: string) => {
    const item = items.find(item => item.id === productId && item.selectedSize === selectedSize);
    if (item) {
      const newQuantity = item.quantity + delta;
      if (newQuantity >= 1 && newQuantity <= item.inventory) {
        updateQuantity(productId, selectedSize, newQuantity);
      }
    }
  };

  const handleRemoveItem = (productId: string, productName: string, selectedSize?: string) => {
    removeItem(productId, selectedSize);
    showToast(`${productName} removed from your cart.`, 'info');
  };

  const { subtotal, shipping, tax } = calculateCartTotals(items);

  return {
    items,
    fallbackImage,
    addressFields,
    setAddressFields,
    phone,
    setPhone,
    savedAddresses,
    selectedAddressId,
    setSelectedAddressId,
    addressError,
    finalTotal,
    isCheckingOut,
    handleCheckout,
    selectSavedAddress,
    handleQuantityChange,
    handleRemoveItem,
    clearCart,
    subtotal,
    shipping,
    tax,
  };
};
