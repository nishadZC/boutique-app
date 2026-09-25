import { OrderStatus, PaymentStatus } from '../types';

/** Standard delivery window: orders arrive within this many days of payment. */
export const DELIVERY_DAYS = 7;

export const estimatedDeliveryDate = (placedAt: string | Date = new Date()): Date => {
  const date = new Date(placedAt);
  date.setDate(date.getDate() + DELIVERY_DAYS);
  return date;
};

export const formatDeliveryDate = (value: string | Date): string =>
  new Date(value).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

interface DeliverableOrder {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** "Deliver by" (or "Delivered") line for an order; none while it is unpaid or cancelled. */
export const orderDelivery = (order: DeliverableOrder, deliveredAt?: string): { label: string; date: string } | null => {
  if (order.status === 'cancelled' || (order.paymentStatus !== 'paid' && order.paymentStatus !== 'refunded')) return null;
  if (order.status === 'delivered') return { label: 'Delivered', date: formatDeliveryDate(deliveredAt || order.updatedAt) };
  return { label: 'Deliver by', date: formatDeliveryDate(estimatedDeliveryDate(order.paidAt || order.createdAt)) };
};
