import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useWishlist } from '../contexts/WishlistContext';
import { AddressFields, SavedAddress, addressFromString, formatAddress } from '../types/address';
import { Order } from '../types';
import { ROUTES } from '../constants/routes';
import { orderService } from '../services/orderService';
import { authService } from '../services/authService';
import { apiErrorMessage } from '../services/adminService';
import { getPhoneError, normalizePhone } from '../utils/validation';

export interface ProfileDetails { firstName: string; lastName: string; phone: string }

const savedAddressKey = (userId: string) => `savedAddresses:${userId}`;

function readSavedAddresses(userId: string): SavedAddress[] {
  try {
    const raw = localStorage.getItem(savedAddressKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useProfile() {
  const { user, updateProfile, logout } = useAuth();
  const { showToast } = useToast();
  const { productIds } = useWishlist();
  const navigate = useNavigate();

  const [details, setDetails] = useState<ProfileDetails>({ firstName: '', lastName: '', phone: '' });
  const [address, setAddress] = useState<AddressFields>(() => addressFromString(user?.address));
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDetails({ firstName: user.firstName || '', lastName: user.lastName || '', phone: user.phone || '' });
    setAddress(addressFromString(user.address));
    setSavedAddresses(readSavedAddresses(user.id));
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    orderService.getUserOrders()
      .then(data => { if (!cancelled) setOrders(data); })
      .catch(() => { if (!cancelled) setOrders([]); });
    return () => { cancelled = true; };
  }, [user]);

  const stats = useMemo(() => {
    const list = orders ?? [];
    const paid = list.filter(o => o.paymentStatus === 'paid');
    return {
      orders: paid.length,
      spent: paid.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0),
      delivered: list.filter(o => o.status === 'delivered').length,
      wishlist: productIds.length,
    };
  }, [orders, productIds]);

  const detailsErrors = useMemo(() => ({
    firstName: details.firstName.trim() ? null : 'Enter your first name',
    lastName: details.lastName.trim() ? null : 'Enter your last name',
    phone: getPhoneError(details.phone, { required: false }),
  }), [details]);

  const save = useCallback(async (next: { details?: ProfileDetails; address?: AddressFields }) => {
    if (!user) return false;
    const d = next.details ?? { firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? '' };
    const a = next.address ?? addressFromString(user.address);
    await updateProfile({
      firstName: d.firstName.trim(),
      lastName: d.lastName.trim(),
      phone: normalizePhone(d.phone) ?? '',
      address: a.street.trim() ? formatAddress(a) : '',
    });
    return true;
  }, [updateProfile, user]);

  const saveDetails = useCallback(async () => {
    if (detailsErrors.firstName || detailsErrors.lastName || detailsErrors.phone) return false;
    setSavingDetails(true);
    try {
      await save({ details });
      showToast('Your details were saved', 'success');
      return true;
    } catch (err) {
      showToast(apiErrorMessage(err, 'Could not save your details'), 'error');
      return false;
    } finally {
      setSavingDetails(false);
    }
  }, [details, detailsErrors, save, showToast]);

  const saveAddress = useCallback(async () => {
    if (!address.street.trim() || !address.city.trim() || !address.postalCode.trim()) {
      showToast('Add at least the street, city and postcode', 'warning');
      return false;
    }
    setSavingAddress(true);
    try {
      await save({ address });
      showToast('Delivery address saved', 'success');
      return true;
    } catch (err) {
      showToast(apiErrorMessage(err, 'Could not save your address'), 'error');
      return false;
    } finally {
      setSavingAddress(false);
    }
  }, [address, save, showToast]);

  const removeSavedAddress = useCallback((id: string) => {
    if (!user) return;
    const next = savedAddresses.filter(a => a.id !== id);
    localStorage.setItem(savedAddressKey(user.id), JSON.stringify(next));
    setSavedAddresses(next);
    showToast('Address removed', 'success');
  }, [savedAddresses, showToast, user]);

  const makeDefaultAddress = useCallback(async (saved: SavedAddress) => {
    setAddress(saved.fields);
    setSavingAddress(true);
    try {
      await save({ address: saved.fields });
      showToast(`“${saved.label}” is now your default address`, 'success');
    } catch (err) {
      showToast(apiErrorMessage(err, 'Could not update your address'), 'error');
    } finally {
      setSavingAddress(false);
    }
  }, [save, showToast]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await authService.changePassword(currentPassword, newPassword);
    showToast('Password updated', 'success');
  }, [showToast]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate(ROUTES.HOME);
  }, [logout, navigate]);

  return {
    user, details, setDetails, detailsErrors, saveDetails, savingDetails,
    address, setAddress, saveAddress, savingAddress, savedAddresses, removeSavedAddress, makeDefaultAddress,
    orders, stats, changePassword, handleLogout,
  };
}
