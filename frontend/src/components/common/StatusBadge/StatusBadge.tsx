import React, { memo } from 'react';
import { ORDER_STATUS, PAYMENT_STATUS, TONE_STYLES } from '../../../constants/orderStatus';
import { OrderStatus, PaymentStatus } from '../../../types';

const badgeStyle = (tone: keyof typeof TONE_STYLES): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '3px 10px',
  borderRadius: 999,
  fontSize: '0.74rem',
  fontWeight: 600,
  lineHeight: 1.6,
  whiteSpace: 'nowrap',
  ...TONE_STYLES[tone],
});

export const OrderStatusBadge = memo(({ status }: { status: OrderStatus }) => {
  const meta = ORDER_STATUS[status] ?? ORDER_STATUS.pending;
  return <span style={badgeStyle(meta.tone)}>{meta.icon}{meta.label}</span>;
});

export const PaymentStatusBadge = memo(({ status }: { status: PaymentStatus }) => {
  const meta = PAYMENT_STATUS[status] ?? PAYMENT_STATUS.pending;
  return <span style={badgeStyle(meta.tone)}>{meta.icon}{meta.label}</span>;
});
