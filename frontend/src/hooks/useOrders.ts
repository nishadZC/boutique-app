import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Order } from '../types';
import { orderService } from '../services/orderService';
import { reviewService } from '../services/reviewService';
import { downloadInvoicePdf } from '../services/invoice/invoicePdfService';

export function useOrders() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** orderId -> productId -> the rating the customer gave. */
  const [myRatings, setMyRatings] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    let cancelled = false;
    orderService.getUserOrders()
      .then(async data => {
        if (cancelled) return;
        setOrders(data);
        const delivered = data.filter(o => o.status === 'delivered');
        const entries = await Promise.all(delivered.map(async o => {
          const reviews = await reviewService.mineForOrder(o.id).catch(() => []);
          return [o.id, Object.fromEntries(reviews.map(r => [r.productId, r.rating]))] as const;
        }));
        if (!cancelled) setMyRatings(Object.fromEntries(entries));
      })
      .catch(() => { if (!cancelled) setError('Failed to load your orders'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleDownloadInvoice = useCallback(async (order: Order) => {
    try {
      await downloadInvoicePdf(order, user);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not create the invoice', 'error');
    }
  }, [user, showToast]);

  const reloadOrders = useCallback(async () => {
    setOrders(await orderService.getUserOrders());
  }, []);

  /** Cancel before delivery, or ask for a return/refund after it. Returns true on success. */
  const submitRequest = useCallback(async (
    order: Order,
    request: { kind: 'cancel' } | { kind: 'return'; type: 'return' | 'refund' },
    reason: string,
    details: string,
  ): Promise<boolean> => {
    try {
      const message = request.kind === 'cancel'
        ? await orderService.cancelOrder(order.id, reason, details)
        : await orderService.requestReturn(order.id, request.type, reason, details);
      showToast(message, 'success');
      await reloadOrders().catch(() => undefined);
      return true;
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Could not submit your request. Please try again.', 'error');
      return false;
    }
  }, [reloadOrders, showToast]);

  const recordRating = useCallback((orderId: string, productId: string, rating: number) => {
    setMyRatings(prev => ({ ...prev, [orderId]: { ...(prev[orderId] ?? {}), [productId]: rating } }));
  }, []);

  return { user, orders, loading, error, navigate, handleDownloadInvoice, myRatings, recordRating, submitRequest };
}
