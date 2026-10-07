import React, { memo, useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import {
  Alert, Box, Breadcrumbs, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Link,
  Skeleton, Step, StepLabel, Stepper, TextField, Typography,
} from '@mui/material';
import { adminService, apiErrorMessage } from '../../../services/adminService';
import { AdminOrderDetail as Detail, CustomerContact } from '../../../types/admin';
import { OrderStatusBadge, PaymentStatusBadge } from '../../../components/common/StatusBadge/StatusBadge';
import { ORDER_STATUS, PAYMENT_STATUS, TRACKING_STEPS } from '../../../constants/orderStatus';
import { useToast } from '../../../contexts/ToastContext';
import { ROUTES } from '../../../constants/routes';
import { orderDelivery } from '../../../utils/delivery';
import { REQUEST_STATUS_LABEL, REQUEST_TYPE_LABEL } from '../../../constants/orderRequests';
import { OrderStatus, PaymentStatus } from '../../../types';
import { customerName, formatAddress, formatCurrency, formatDateTime, shortId } from '../format';
import styles from '../admin.module.css';

const CANCELLABLE: OrderStatus[] = ['pending', 'confirmed', 'packed'];

function describeEvent(e: Detail['events'][number]) {
  switch (e.type) {
    case 'created': return 'Order placed';
    case 'status': return `Status: ${ORDER_STATUS[e.fromValue as OrderStatus]?.label ?? e.fromValue} → ${ORDER_STATUS[e.toValue as OrderStatus]?.label ?? e.toValue}`;
    case 'payment_status': return `Payment: ${PAYMENT_STATUS[e.fromValue as PaymentStatus]?.label ?? e.fromValue} → ${PAYMENT_STATUS[e.toValue as PaymentStatus]?.label ?? e.toValue}`;
    case 'stock_shortage': return 'Stock shortage when the order was paid';
    case 'stock_sync_failed': return 'Stock could not be updated automatically';
    case 'return_requested': return 'Customer requested a return';
    case 'refund_requested': return 'Customer requested a refund';
    case 'request_rejected': return `${REQUEST_TYPE_LABEL[e.toValue as keyof typeof REQUEST_TYPE_LABEL] ?? 'Request'} request rejected`;
    default: return e.type;
  }
}

const AdminOrderDetail = memo(function AdminOrderDetail() {
  const { id = '' } = useParams();
  const { showToast } = useToast();
  const [order, setOrder] = useState<Detail | null>(null);
  const [customer, setCustomer] = useState<CustomerContact | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<'cancel' | 'refund' | 'razorpayRefund' | 'reject' | null>(null);
  const [refundNote, setRefundNote] = useState('');
  const [rejectNote, setRejectNote] = useState('');

  const load = useCallback(async () => {
    try {
      const detail = await adminService.getOrder(id);
      setOrder(detail);
      const contacts = await adminService.lookupCustomers([detail.userId]).catch(() => ({} as Record<string, CustomerContact>));
      setCustomer(contacts[detail.userId] ?? null);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load this order'));
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const changeStatus = async (status: OrderStatus) => {
    setBusy(true);
    try {
      const result = await adminService.updateOrderStatus(id, status, note.trim() || undefined);
      showToast(result.message, 'success');
      if (result.refundRequired) showToast('This order was paid: use “Refund” to return the money to the customer.', 'warning');
      setNote('');
      setDialog(null);
      await load();
    } catch (err) {
      showToast(apiErrorMessage(err, 'Could not update the order'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const recordRefund = async () => {
    setBusy(true);
    try {
      await adminService.recordRefund(id, refundNote.trim());
      showToast('Refund recorded', 'success');
      setDialog(null);
      setRefundNote('');
      await load();
    } catch (err) {
      showToast(apiErrorMessage(err, 'Could not record the refund'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const issueRefund = async () => {
    setBusy(true);
    try {
      const result = await adminService.refundOrder(id, { note: refundNote.trim() || undefined });
      showToast(`Refunded ${formatCurrency(result.amount)} (Razorpay ${result.refundId})`, 'success');
      setDialog(null);
      setRefundNote('');
      await load();
    } catch (err) {
      showToast(apiErrorMessage(err, 'The refund failed; check the payment in Razorpay before retrying'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const rejectRequest = async (requestId: string) => {
    setBusy(true);
    try {
      await adminService.rejectRequest(id, requestId, rejectNote.trim());
      showToast('Request rejected', 'success');
      setDialog(null);
      setRejectNote('');
      await load();
    } catch (err) {
      showToast(apiErrorMessage(err, 'Could not reject the request'), 'error');
    } finally {
      setBusy(false);
    }
  };

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!order) return <Box><Skeleton height={60} /><Skeleton variant="rounded" height={320} /></Box>;

  const stepIndex = TRACKING_STEPS.indexOf(order.status);
  const stockProblem = order.events.find(e => e.type === 'stock_shortage' || e.type === 'stock_sync_failed');
  const delivery = orderDelivery(order, order.events.find(e => e.type === 'status' && e.toValue === 'delivered')?.createdAt);
  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const pendingRequest = order.requests.find(r => r.status === 'pending');
  const canRefund = order.paymentStatus === 'paid' && (order.status === 'cancelled' || order.status === 'delivered');

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1, fontSize: '0.82rem' }}>
        <Link component={RouterLink} to={ROUTES.ADMIN_ORDERS} underline="hover" color="inherit">Orders</Link>
        <Typography color="text.primary" sx={{ fontSize: '0.82rem' }}>{shortId(order.id)}</Typography>
      </Breadcrumbs>
      <Box className={styles.pageHeader}>
        <Box>
          <Typography variant="h1" className={styles.title}>Order {shortId(order.id)}</Typography>
          <Typography className={styles.subtitle}>
            Placed {formatDateTime(order.createdAt)}
            {delivery && <> · {delivery.label} {delivery.date}</>}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <PaymentStatusBadge status={order.paymentStatus} />
          <OrderStatusBadge status={order.status} />
        </Box>
      </Box>

      {stockProblem && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {describeEvent(stockProblem)}{stockProblem.note ? ` — ${stockProblem.note}` : ''}. Check the affected products in Inventory.
        </Alert>
      )}

      {order.requests.length > 0 && (
        <Box className={styles.card} sx={{ mb: 2.5 }}>
          <Typography className={styles.cardTitle}>Customer requests</Typography>
          {pendingRequest && (
            <Alert severity="warning" sx={{ mb: 1.5 }}>
              <strong>{REQUEST_TYPE_LABEL[pendingRequest.type]} requested</strong> on {formatDateTime(pendingRequest.createdAt)}: {pendingRequest.reason}
              {pendingRequest.details && <Box component="span" sx={{ display: 'block', mt: 0.5 }}>“{pendingRequest.details}”</Box>}
              <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                {pendingRequest.type === 'cancel'
                  ? `The customer cancelled a paid order. Refund ${formatCurrency(order.totalAmount)} to close it.`
                  : `Approving refunds ${formatCurrency(order.totalAmount)} to the customer through Razorpay.`}
              </Box>
            </Alert>
          )}
          {pendingRequest && order.paymentStatus === 'paid' && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
              <Button variant="contained" disabled={busy} onClick={() => setDialog('razorpayRefund')}>
                {pendingRequest.type === 'cancel' ? 'Refund' : 'Approve & refund'} {formatCurrency(order.totalAmount)}
              </Button>
              {pendingRequest.type !== 'cancel' && (
                <Button color="error" variant="outlined" disabled={busy} onClick={() => setDialog('reject')}>Reject</Button>
              )}
            </Box>
          )}
          {order.requests.filter(r => r !== pendingRequest).map(r => (
            <Box key={r.id} sx={{ py: 1, borderTop: '1px solid #f0ede7' }}>
              <Typography sx={{ fontSize: '0.9rem' }}>
                {REQUEST_TYPE_LABEL[r.type]} · {r.reason} · <strong>{REQUEST_STATUS_LABEL[r.status]}</strong>
              </Typography>
              <Typography className={styles.muted}>
                {[
                  `Requested ${formatDateTime(r.createdAt)}`,
                  r.resolvedAt && `resolved ${formatDateTime(r.resolvedAt)}`,
                  r.resolvedBy && `by ${r.resolvedBy}`,
                  r.refundId && `refund ${r.refundId}`,
                  r.resolutionNote,
                ].filter(Boolean).join(' · ')}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      <Box className={styles.card} sx={{ mb: 2.5 }}>
        <Typography className={styles.cardTitle}>Fulfilment</Typography>
        {order.status === 'cancelled' ? (
          <Alert severity="info">This order was cancelled.{order.paymentStatus === 'paid' ? ' The payment has not been refunded yet.' : ''}</Alert>
        ) : order.paymentStatus !== 'paid' ? (
          <Alert severity="info">Fulfilment starts once the customer's payment succeeds ({PAYMENT_STATUS[order.paymentStatus].label.toLowerCase()}).</Alert>
        ) : (
          <Stepper activeStep={stepIndex === TRACKING_STEPS.length - 1 ? TRACKING_STEPS.length : stepIndex + 1} alternativeLabel sx={{ mb: 2 }}>
            {TRACKING_STEPS.map(s => <Step key={s}><StepLabel>{ORDER_STATUS[s].label}</StepLabel></Step>)}
          </Stepper>
        )}

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', mt: 2 }}>
          {order.nextStatus && (
            <>
              <TextField size="small" label="Note (optional)" placeholder="e.g. Courier + tracking number" value={note}
                onChange={e => setNote(e.target.value)} slotProps={{ htmlInput: { maxLength: 500 } }} sx={{ flex: '1 1 260px' }} />
              <Button variant="contained" disabled={busy} onClick={() => changeStatus(order.nextStatus!)}>
                Mark as {ORDER_STATUS[order.nextStatus].label.toLowerCase()}
              </Button>
            </>
          )}
          {CANCELLABLE.includes(order.status) && (
            <Button color="error" variant="outlined" disabled={busy} onClick={() => setDialog('cancel')}>Cancel order</Button>
          )}
          {canRefund && !pendingRequest && (
            <Button variant="outlined" disabled={busy} onClick={() => setDialog('razorpayRefund')}>Refund {formatCurrency(order.totalAmount)}</Button>
          )}
          {canRefund && (
            <Button size="small" disabled={busy} onClick={() => setDialog('refund')}>Record manual refund</Button>
          )}
        </Box>
      </Box>

      <Box className={styles.grid2}>
        <Box className={styles.card} sx={{ gridColumn: { md: 'span 2' } }}>
          <Typography className={styles.cardTitle}>Items</Typography>
          {order.items.map((item, i) => (
            <Box key={item.id} sx={{ display: 'flex', gap: 2, alignItems: 'center', py: 1.25, borderTop: i ? '1px solid #f0ede7' : 0 }}>
              <Box component="img" src={item.product.imageUrl} alt="" className={styles.thumb} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Link component={RouterLink} to={`${ROUTES.ADMIN_PRODUCTS}/${item.productId}`} underline="hover" color="inherit" sx={{ fontWeight: 500 }}>{item.product.name}</Link>
                <Typography className={styles.muted}>{[item.product.brand, item.size && `Size ${item.size}`].filter(Boolean).join(' · ')}</Typography>
              </Box>
              <Typography className={styles.muted}>{item.quantity} × {formatCurrency(item.price)}</Typography>
              <Typography sx={{ width: 96, textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(item.price * item.quantity)}</Typography>
            </Box>
          ))}
          <Box sx={{ borderTop: '1px solid #ebe7e0', mt: 1, pt: 1.5, display: 'grid', gap: 0.5, justifyContent: 'end', textAlign: 'right' }}>
            <Typography className={styles.muted}>Subtotal {formatCurrency(order.subtotalAmount ?? subtotal)}</Typography>
            <Typography className={styles.muted}>Shipping {order.shippingAmount ? formatCurrency(order.shippingAmount) : 'Free'}</Typography>
            <Typography className={styles.muted}>Tax {formatCurrency(order.taxAmount ?? 0)}</Typography>
            <Typography sx={{ fontWeight: 600 }}>Order total {formatCurrency(order.totalAmount)}</Typography>
          </Box>
        </Box>

        <Box className={styles.card}>
          <Typography className={styles.cardTitle}>Customer</Typography>
          <Typography sx={{ fontWeight: 500 }}>{customerName(customer)}</Typography>
          <Typography className={styles.muted}>{customer?.email}</Typography>
          {customer?.phone && <Typography className={styles.muted}>{customer.phone}</Typography>}
          <Button size="small" sx={{ mt: 1, px: 0 }} component={RouterLink} to={`${ROUTES.ADMIN_ORDERS}?userId=${order.userId}`}>View their orders</Button>
          <Typography className={styles.cardTitle} sx={{ mt: 2.5 }}>Ship to</Typography>
          <Typography sx={{ fontSize: '0.9rem', whiteSpace: 'pre-line' }}>{formatAddress(order.shippingAddress) || '—'}</Typography>
        </Box>

        <Box className={styles.card}>
          <Typography className={styles.cardTitle}>Payment</Typography>
          <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px 12px', m: 0, fontSize: '0.86rem', '& dt': { color: '#8a857d' }, '& dd': { m: 0 } }}>
            <dt>Status</dt><dd>{PAYMENT_STATUS[order.paymentStatus].label}</dd>
            <dt>Paid at</dt><dd>{order.paidAt ? formatDateTime(order.paidAt) : '—'}</dd>
            <dt>Razorpay order</dt><dd className={styles.mono}>{order.razorpayOrderId ?? '—'}</dd>
            <dt>Razorpay payment</dt><dd className={styles.mono}>{order.razorpayPaymentId ?? '—'}</dd>
            <dt>Stock deducted</dt><dd>{order.stockCommitted ? 'Yes' : 'No'}</dd>
          </Box>
        </Box>

        <Box className={styles.card} sx={{ gridColumn: { md: 'span 2' } }}>
          <Typography className={styles.cardTitle}>History</Typography>
          {order.events.length === 0 && <Typography className={styles.muted}>No history recorded for this order.</Typography>}
          {[...order.events].reverse().map((e, i) => (
            <Box key={`${e.createdAt}-${i}`} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '180px 1fr' }, gap: 1, py: 1, borderTop: i ? '1px solid #f0ede7' : 0 }}>
              <Typography className={styles.muted}>{formatDateTime(e.createdAt)}</Typography>
              <Box>
                <Typography sx={{ fontSize: '0.9rem' }}>{describeEvent(e)}</Typography>
                {(e.note || e.actor) && <Typography className={styles.muted}>{[e.note, e.actor && `by ${e.actor}`].filter(Boolean).join(' · ')}</Typography>}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Dialog open={dialog === 'cancel'} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Cancel order {shortId(order.id)}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Any stock already deducted for this order goes back into inventory.
            {order.paymentStatus === 'paid' && ' The customer has paid: use “Refund” afterwards to return their money.'}
          </DialogContentText>
          <TextField fullWidth size="small" label="Reason" value={note} onChange={e => setNote(e.target.value)} sx={{ mt: 2 }} slotProps={{ htmlInput: { maxLength: 500 } }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Keep order</Button>
          <Button color="error" variant="contained" disabled={busy} onClick={() => changeStatus('cancelled')}>Cancel order</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === 'refund'} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Record manual refund</DialogTitle>
        <DialogContent>
          <DialogContentText>Only for a refund you have already issued in the Razorpay dashboard. This does not move money.</DialogContentText>
          <TextField fullWidth required size="small" label="Razorpay refund reference" value={refundNote}
            onChange={e => setRefundNote(e.target.value)} sx={{ mt: 2 }} slotProps={{ htmlInput: { maxLength: 500 } }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Back</Button>
          <Button variant="contained" disabled={busy || !refundNote.trim()} onClick={recordRefund}>Record refund</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === 'razorpayRefund'} onClose={() => !busy && setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Refund {formatCurrency(order.totalAmount)}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The full order amount is refunded to the customer's original payment method through Razorpay.
            The customer sees the refund on their Orders page. This cannot be undone.
          </DialogContentText>
          <TextField fullWidth size="small" label="Note (optional)" value={refundNote}
            onChange={e => setRefundNote(e.target.value)} sx={{ mt: 2 }} slotProps={{ htmlInput: { maxLength: 500 } }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)} disabled={busy}>Back</Button>
          <Button variant="contained" disabled={busy} onClick={issueRefund}>{busy ? 'Refunding…' : 'Refund now'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === 'reject'} onClose={() => !busy && setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Reject {pendingRequest ? REQUEST_TYPE_LABEL[pendingRequest.type].toLowerCase() : ''} request?</DialogTitle>
        <DialogContent>
          <DialogContentText>The customer sees this reason on their Orders page.</DialogContentText>
          <TextField fullWidth required multiline minRows={2} size="small" label="Reason for rejecting" value={rejectNote}
            onChange={e => setRejectNote(e.target.value)} sx={{ mt: 2 }} slotProps={{ htmlInput: { maxLength: 500 } }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)} disabled={busy}>Back</Button>
          <Button color="error" variant="contained" disabled={busy || !rejectNote.trim() || !pendingRequest}
            onClick={() => pendingRequest && rejectRequest(pendingRequest.id)}>Reject request</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

export default AdminOrderDetail;
