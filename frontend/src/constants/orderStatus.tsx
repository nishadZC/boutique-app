import React from 'react';
import {
  HourglassEmptyOutlined, CheckCircleOutline, Inventory2Outlined, LocalShippingOutlined,
  DirectionsBikeOutlined, HomeOutlined, CancelOutlined, ErrorOutline, PaymentsOutlined, ReplayOutlined,
} from '@mui/icons-material';
import { OrderStatus, PaymentStatus } from '../types';

/** Fulfilment steps in order, as shown on the tracking timeline. */
export const TRACKING_STEPS: OrderStatus[] = ['confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

type Tone = 'neutral' | 'progress' | 'good' | 'warning' | 'critical';

export const ORDER_STATUS: Record<OrderStatus, { label: string; customerText: string; tone: Tone; icon: React.ReactElement }> = {
  pending:          { label: 'Awaiting payment', customerText: 'Complete payment to confirm your order.', tone: 'warning', icon: <HourglassEmptyOutlined fontSize="inherit" /> },
  confirmed:        { label: 'Confirmed',        customerText: 'Payment received. We are preparing your order.', tone: 'progress', icon: <CheckCircleOutline fontSize="inherit" /> },
  packed:           { label: 'Packed',           customerText: 'Your order is packed and ready to ship.', tone: 'progress', icon: <Inventory2Outlined fontSize="inherit" /> },
  shipped:          { label: 'Shipped',          customerText: 'Your order is on its way.', tone: 'progress', icon: <LocalShippingOutlined fontSize="inherit" /> },
  out_for_delivery: { label: 'Out for delivery', customerText: 'Arriving today.', tone: 'progress', icon: <DirectionsBikeOutlined fontSize="inherit" /> },
  delivered:        { label: 'Delivered',        customerText: 'Delivered. We hope you love it.', tone: 'good', icon: <HomeOutlined fontSize="inherit" /> },
  cancelled:        { label: 'Cancelled',        customerText: 'This order was cancelled.', tone: 'neutral', icon: <CancelOutlined fontSize="inherit" /> },
};

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; tone: Tone; icon: React.ReactElement }> = {
  pending:  { label: 'Payment pending', tone: 'warning', icon: <HourglassEmptyOutlined fontSize="inherit" /> },
  paid:     { label: 'Paid', tone: 'good', icon: <PaymentsOutlined fontSize="inherit" /> },
  failed:   { label: 'Payment failed', tone: 'critical', icon: <ErrorOutline fontSize="inherit" /> },
  refunded: { label: 'Refunded', tone: 'neutral', icon: <ReplayOutlined fontSize="inherit" /> },
};

/** Status palette (reserved for state; always paired with an icon and a label). */
export const TONE_STYLES: Record<Tone, { color: string; background: string }> = {
  neutral:  { color: '#4b4b4b', background: '#efefef' },
  progress: { color: '#6b4e09', background: '#f6ecd6' },
  good:     { color: '#1f5e33', background: '#e3f1e7' },
  warning:  { color: '#7a4a00', background: '#fdefd5' },
  critical: { color: '#9b1c1c', background: '#fbe4e4' },
};

/** An invoice exists only once the order has been paid for. */
export const hasInvoice = (paymentStatus: PaymentStatus) => paymentStatus === 'paid' || paymentStatus === 'refunded';
