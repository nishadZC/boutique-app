import { useState, useCallback } from 'react';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { AddressFields, SavedAddress } from '../types/address';
import { useNavigate } from 'react-router-dom';

function parseAddressFields(address?: string): AddressFields {
  if (!address) return { houseNumber: '', street: '', city: '', state: '', postalCode: '', country: '' };
  const parts = address.split(',').map(s => s.trim());
  return {
    houseNumber: parts[0] || '',
    street:      parts[1] || '',
    city:        parts[2] || '',
    state:       parts[3] || '',
    postalCode:  parts[4] || '',
    country:     parts[5] || 'India',
  };
}

export function useProfile() {
  const { user, updateProfile, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({ firstName: '', lastName: '', phone: '' });
  const [editAddress, setEditAddress] = useState<AddressFields>(() => parseAddressFields(user?.address));
  const [updating, setUpdating] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);

  useEffect(() => {
    if (!user) return;
    setEditData({ firstName: user.firstName || '', lastName: user.lastName || '', phone: user.phone || '' });
    setEditAddress(parseAddressFields(user.address));
  }, [user]);

  const handleSaveProfile = useCallback(async () => {
    setUpdating(true);
    try {
      const address = [editAddress.houseNumber, editAddress.street, editAddress.city, editAddress.state, editAddress.postalCode, editAddress.country].join(', ');
      await updateProfile({ ...editData, address });
      setEditOpen(false);
      showToast('Profile updated successfully!', 'success');
    } catch {
      showToast('Failed to update profile.', 'error');
    } finally {
      setUpdating(false);
    }
  }, [editAddress, editData, updateProfile, showToast]);

  const handleSaveAddress = useCallback(async (label: string, phone: string) => {
    try {
      const address = [editAddress.houseNumber, editAddress.street, editAddress.city, editAddress.state, editAddress.postalCode, editAddress.country].join(', ');
      if (!user) throw new Error('User must be signed in to save an address');
      const saved: SavedAddress = { id: `${Date.now()}`, label, fields: editAddress, phone };
      const storageKey = `savedAddresses:${user.id}`;
      const stored = localStorage.getItem(storageKey);
      const addresses: SavedAddress[] = stored ? JSON.parse(stored) : [];
      localStorage.setItem(storageKey, JSON.stringify([...addresses, saved]));
      setSavedAddresses(prev => [...prev, saved]);
      showToast('Address saved!', 'success');
    } catch {
      showToast('Failed to save address.', 'error');
    }
  }, [editAddress, showToast, user]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  return {
    user, editOpen, setEditOpen, editData, setEditData, editAddress, setEditAddress,
    updating, savedAddresses, setSavedAddresses, handleLogout, handleSaveProfile, handleSaveAddress,
  };
}
