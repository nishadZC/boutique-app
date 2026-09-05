import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Order } from '../types';
import { orderService } from '../services/orderService';
import { downloadInvoicePdf } from '../services/invoice/invoicePdfService';

export function useOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    orderService.getUserOrders()
      .then(data => { if (!cancelled) setOrders(data); })
      .catch(() => { if (!cancelled) setError('Failed to load orders'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleDownloadInvoice = useCallback((order: Order) => {
    void downloadInvoicePdf(order, user);
  }, [user]);

  const getStatusColor = useCallback((status: Order['status']): 'default' | 'warning' | 'info' | 'success' | 'error' => {
    switch (status) {
      case 'pending':    return 'warning';
      case 'processing': return 'info';
      case 'shipped':    return 'info';
      case 'delivered':  return 'success';
      case 'cancelled':  return 'error';
      default:           return 'default';
    }
  }, []);

  return { user, orders, loading, error, navigate, handleDownloadInvoice, getStatusColor };
}
