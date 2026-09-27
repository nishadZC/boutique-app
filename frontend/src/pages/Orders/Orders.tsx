import React, { memo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert, Box, Breadcrumbs, Button, CircularProgress, Container, Link, Rating, Step, StepLabel, Stepper, Typography,
} from '@mui/material';
import { AssignmentReturnOutlined, CancelOutlined, ReceiptLongOutlined, ShoppingBagOutlined, StarBorderRounded } from '@mui/icons-material';
import { useOrders } from '../../hooks/useOrders';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { useToast } from '../../contexts/ToastContext';
import { Order } from '../../types';
import { ORDER_STATUS, TRACKING_STEPS, hasInvoice } from '../../constants/orderStatus';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/common/StatusBadge/StatusBadge';
import { ROUTES } from '../../constants/routes';
import { orderDelivery } from '../../utils/delivery';
import ReviewDialog from './ReviewDialog';
import OrderRequestDialog, { RequestKind } from './OrderRequestDialog';
import { REQUEST_TYPE_LABEL, RETURN_WINDOW_DAYS } from '../../constants/orderRequests';
import styles from './Orders.module.css';

const money = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const date = (iso: string, withTime = false) => new Date(iso).toLocaleDateString('en-IN', withTime
  ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
  : { day: 'numeric', month: 'long', year: 'numeric' });
const address = (a: Order['shippingAddress']) => (typeof a === 'string' ? a : (a as { address?: string })?.address ?? '');

const deliveredAt = (order: Order) => order.timeline?.find(t => t.status === 'delivered')?.at;

/** Delivered, paid, inside the return window, and nothing already open or refunded. */
const canRequestReturn = (order: Order) => {
  if (order.status !== 'delivered' || order.paymentStatus !== 'paid') return false;
  if (order.requests?.some(r => r.type !== 'cancel' && (r.status === 'pending' || r.status === 'refunded'))) return false;
  const at = deliveredAt(order) ?? order.updatedAt;
  return Date.now() <= new Date(at).getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000;
};

const canCancel = (order: Order) => order.status !== 'cancelled' && order.status !== 'delivered' && order.paymentStatus !== 'refunded';

/** What the customer needs to know about an order that has not been paid for, or was cancelled. */
function PaymentNotice({ order }: { order: Order }) {
  if (order.status === 'cancelled') {
    const cancel = order.requests?.find(r => r.type === 'cancel');
    const refund = order.paymentStatus === 'refunded'
      ? ' Your payment has been refunded; it usually reaches your account in 5–7 working days.'
      : order.paymentStatus === 'paid' ? ` Your refund of ${money(order.totalAmount)} is being processed.` : '';
    return (
      <Alert severity={order.paymentStatus === 'refunded' ? 'success' : 'info'} className={styles.notice}>
        {ORDER_STATUS.cancelled.customerText}{refund}{cancel ? ` Reason: ${cancel.reason}.` : ''}
      </Alert>
    );
  }
  if (order.paymentStatus === 'failed') {
    return <Alert severity="error" className={styles.notice}>Payment failed, so this order was not placed and you were not charged. Items are still available to buy again.</Alert>;
  }
  if (order.paymentStatus === 'pending') {
    return <Alert severity="warning" className={styles.notice}>Awaiting payment. This order will be confirmed once payment succeeds; you have not been charged.</Alert>;
  }
  return null;
}

/** Progress of a return/refund request on a delivered order. */
function RequestNotice({ order }: { order: Order }) {
  const request = order.requests?.find(r => r.type !== 'cancel');
  if (!request) {
    return order.paymentStatus === 'refunded'
      ? <Alert severity="success" className={styles.notice}>This order has been refunded.</Alert>
      : null;
  }
  const kind = REQUEST_TYPE_LABEL[request.type].toLowerCase();
  if (request.status === 'pending') {
    return <Alert severity="info" className={styles.notice}>Your {kind} request ({request.reason}) was submitted on {date(request.createdAt)} and is being reviewed.</Alert>;
  }
  if (request.status === 'refunded') {
    return (
      <Alert severity="success" className={styles.notice}>
        Your {kind} was approved and {money(order.totalAmount)} has been refunded; it usually reaches your account in 5–7 working days.
      </Alert>
    );
  }
  if (request.status === 'rejected') {
    return (
      <Alert severity="warning" className={styles.notice}>
        Your {kind} request was not approved{request.resolutionNote ? `: ${request.resolutionNote}` : '.'}
      </Alert>
    );
  }
  return null;
}

function Tracking({ order }: { order: Order }) {
  const reachedAt: Record<string, string> = {};
  order.timeline?.forEach(t => { reachedAt[t.status] = t.at; });
  const current = TRACKING_STEPS.indexOf(order.status);
  return (
    <Box className={styles.tracking}>
      <Typography className={styles.trackingText}>{ORDER_STATUS[order.status]?.customerText}</Typography>
      <Stepper activeStep={order.status === 'delivered' ? TRACKING_STEPS.length : current + 1} alternativeLabel className={styles.stepper}>
        {TRACKING_STEPS.map(step => (
          <Step key={step}>
            <StepLabel optional={reachedAt[step] ? <span className={styles.stepTime}>{date(reachedAt[step], true)}</span> : undefined}>
              {ORDER_STATUS[step].label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}

const Orders: React.FC = memo(() => {
  const { isAuthenticated } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { showToast } = useToast();
  const { orders, loading, error, handleDownloadInvoice, myRatings, recordRating, submitRequest } = useOrders();
  const [requestTarget, setRequestTarget] = useState<{ order: Order; kind: RequestKind } | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{ orderId: string; productId: string; productName: string; imageUrl: string } | null>(null);

  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm" className={styles.centered}>
        <Typography variant="h4" gutterBottom>Sign in to see your orders</Typography>
        <Button variant="contained" onClick={() => openLoginModal()}>Sign in</Button>
      </Container>
    );
  }
  if (loading) return <Box className={styles.centered}><CircularProgress color="secondary" /></Box>;

  return (
    <Box className={styles.page}>
      <Container maxWidth="lg">
        <Breadcrumbs className={styles.breadcrumbs}>
          <Link component={RouterLink} to={ROUTES.HOME}>Home</Link>
          <Link component={RouterLink} to={ROUTES.PROFILE}>Account</Link>
          <Typography color="text.primary">Orders</Typography>
        </Breadcrumbs>
        <Typography variant="h1" className={styles.title}>Your orders</Typography>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {orders.length === 0 ? (
          <Box className={styles.empty}>
            <ShoppingBagOutlined className={styles.emptyIcon} />
            <Typography variant="h4">No orders yet</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>When you place an order, you can track it here.</Typography>
            <Button variant="contained" component={RouterLink} to={ROUTES.PRODUCTS}>Start shopping</Button>
          </Box>
        ) : orders.map(order => {
          const paid = order.paymentStatus === 'paid' || order.paymentStatus === 'refunded';
          const delivered = order.status === 'delivered';
          const delivery = orderDelivery(order, order.timeline?.find(t => t.status === 'delivered')?.at);
          return (
            <Box key={order.id} component="article" className={`${styles.card} ${!paid ? styles.cardUnpaid : ''}`}>
              <Box className={styles.cardHeader}>
                <Box className={styles.meta}>
                  <div><span className={styles.metaLabel}>Order</span><span className={styles.metaValue}>#{order.id.slice(0, 8).toUpperCase()}</span></div>
                  <div><span className={styles.metaLabel}>Placed</span><span className={styles.metaValue}>{date(order.createdAt)}</span></div>
                  {delivery && <div><span className={styles.metaLabel}>{delivery.label}</span><span className={styles.metaValue}>{delivery.date}</span></div>}
                  <div><span className={styles.metaLabel}>Total</span><span className={styles.metaValue}>{money(order.totalAmount)}</span></div>
                </Box>
                <Box className={styles.badges}>
                  {order.paymentStatus !== 'paid' && <PaymentStatusBadge status={order.paymentStatus} />}
                  {(paid || order.status === 'cancelled') && <OrderStatusBadge status={order.status} />}
                </Box>
              </Box>

              {paid && order.status !== 'cancelled'
                ? <><Tracking order={order} /><RequestNotice order={order} /></>
                : <PaymentNotice order={order} />}

              <Box className={styles.items}>
                {order.items.map(item => {
                  const rated = myRatings[order.id]?.[item.productId];
                  return (
                    <Box key={item.id} className={styles.item}>
                      <RouterLink to={`/products/${item.productId}`} className={styles.itemImage}>
                        {item.product?.imageUrl && <img src={item.product.imageUrl} alt="" loading="lazy" />}
                      </RouterLink>
                      <Box className={styles.itemInfo}>
                        <Link component={RouterLink} to={`/products/${item.productId}`} className={styles.itemName}>{item.product?.name}</Link>
                        <Typography className={styles.itemMeta}>
                          {[item.product?.brand, item.size && `Size ${item.size}`, `Qty ${item.quantity}`].filter(Boolean).join(' · ')}
                        </Typography>
                        {delivered && (
                          rated
                            ? <Box className={styles.rated}><Rating value={rated} readOnly size="small" sx={{ color: '#a8770f' }} /><span>Thanks for your review</span></Box>
                            : (
                              <Button size="small" startIcon={<StarBorderRounded />} className={styles.rateButton}
                                onClick={() => setReviewTarget({ orderId: order.id, productId: item.productId, productName: item.product?.name ?? 'This item', imageUrl: item.product?.imageUrl ?? '' })}>
                                Rate this item
                              </Button>
                            )
                        )}
                      </Box>
                      <Typography className={styles.itemPrice}>{money(item.price * item.quantity)}</Typography>
                    </Box>
                  );
                })}
              </Box>

              <Box className={styles.cardFooter}>
                <Typography className={styles.shipTo}>{address(order.shippingAddress) && <>Ship to: {address(order.shippingAddress)}</>}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {canCancel(order) && (
                    <Button variant="text" size="small" color="error" startIcon={<CancelOutlined />} onClick={() => setRequestTarget({ order, kind: 'cancel' })}>
                      Cancel order
                    </Button>
                  )}
                  {canRequestReturn(order) && (
                    <Button variant="outlined" size="small" startIcon={<AssignmentReturnOutlined />} onClick={() => setRequestTarget({ order, kind: 'return' })}>
                      Return or refund
                    </Button>
                  )}
                  {hasInvoice(order.paymentStatus) && (
                    <Button variant="outlined" size="small" startIcon={<ReceiptLongOutlined />} onClick={() => handleDownloadInvoice(order)}>
                      Download invoice
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Container>

      <OrderRequestDialog
        order={requestTarget?.order ?? null}
        kind={requestTarget?.kind ?? 'cancel'}
        onClose={() => setRequestTarget(null)}
        onSubmit={(request, reason, details) => submitRequest(requestTarget!.order, request, reason, details)}
      />

      <ReviewDialog
        target={reviewTarget}
        onClose={() => setReviewTarget(null)}
        onSubmitted={rating => {
          if (reviewTarget) recordRating(reviewTarget.orderId, reviewTarget.productId, rating);
          setReviewTarget(null);
          showToast('Thank you — your review is live', 'success');
        }}
      />
    </Box>
  );
});

export default Orders;
