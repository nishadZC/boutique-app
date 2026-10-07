import React, { memo, useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert, Box, Button, FormControl, InputAdornment, InputLabel, MenuItem, Select, Skeleton, Table, TableBody,
  TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { adminService, apiErrorMessage } from '../../../services/adminService';
import { AdminOrderSummary, CustomerContact, Pagination } from '../../../types/admin';
import { OrderStatusBadge, PaymentStatusBadge } from '../../../components/common/StatusBadge/StatusBadge';
import { ORDER_STATUS } from '../../../constants/orderStatus';
import { REQUEST_TYPE_LABEL } from '../../../constants/orderRequests';
import { useToast } from '../../../contexts/ToastContext';
import { ROUTES } from '../../../constants/routes';
import { customerName, formatCurrency, formatDateTime, shortId } from '../format';
import styles from '../admin.module.css';

const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'awaiting_fulfilment', label: 'Needs fulfilment' },
  { value: 'in_transit', label: 'In transit' },
  { value: 'refund_requests', label: 'Refund requests' },
  ...(['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'] as const)
    .map(s => ({ value: s, label: ORDER_STATUS[s].label })),
];
const PAYMENT_FILTERS = [
  { value: '', label: 'All payments' }, { value: 'paid', label: 'Paid' }, { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' }, { value: 'refunded', label: 'Refunded' },
];

const AdminOrders = memo(function AdminOrders() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [params, setParams] = useSearchParams();
  const [orders, setOrders] = useState<AdminOrderSummary[] | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [customers, setCustomers] = useState<Record<string, CustomerContact>>({});
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(params.get('search') ?? '');
  const [busyId, setBusyId] = useState<string | null>(null);

  const filters = {
    status: params.get('status') ?? '',
    paymentStatus: params.get('paymentStatus') ?? '',
    search: params.get('search') ?? '',
    from: params.get('from') ?? '',
    to: params.get('to') ?? '',
    userId: params.get('userId') ?? '',
    page: Number(params.get('page') ?? '1'),
    limit: Number(params.get('limit') ?? '25'),
  };

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await adminService.listOrders({
        status: filters.status || undefined, paymentStatus: filters.paymentStatus || undefined,
        search: filters.search || undefined, from: filters.from || undefined, to: filters.to || undefined,
        userId: filters.userId || undefined,
        page: filters.page, limit: filters.limit,
      });
      setOrders(result.orders);
      setPagination(result.pagination);
      setCustomers(await adminService.lookupCustomers(result.orders.map(o => o.userId)).catch(() => ({})));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load orders'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.toString()]);

  useEffect(() => { void load(); }, [load]);

  // Debounce the order-id search box into the URL.
  useEffect(() => {
    const handle = setTimeout(() => { if (search !== filters.search) setFilter('search', search.trim()); }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const advance = async (event: React.MouseEvent, order: AdminOrderSummary) => {
    event.stopPropagation();
    if (!order.nextStatus) return;
    setBusyId(order.id);
    try {
      const result = await adminService.updateOrderStatus(order.id, order.nextStatus);
      showToast(`${shortId(order.id)}: ${result.message}`, 'success');
      await load();
    } catch (err) {
      showToast(apiErrorMessage(err, 'Could not update the order'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Box>
      <Box className={styles.pageHeader}>
        <Box>
          <span className={styles.eyebrow}>Sales</span>
          <Typography variant="h1" className={styles.title}>Orders</Typography>
          <Typography className={styles.subtitle}>{pagination ? `${pagination.total} order${pagination.total === 1 ? '' : 's'}` : ' '}</Typography>
        </Box>
      </Box>

      <Box className={styles.toolbar}>
        <TextField size="small" placeholder="Order number" value={search} onChange={e => setSearch(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }} />
        <FormControl size="small" sx={{ minWidth: 190 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
            {STATUS_FILTERS.map(f => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Payment</InputLabel>
          <Select label="Payment" value={filters.paymentStatus} onChange={e => setFilter('paymentStatus', e.target.value)}>
            {PAYMENT_FILTERS.map(f => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField size="small" type="date" label="From" value={filters.from} onChange={e => setFilter('from', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField size="small" type="date" label="To" value={filters.to} onChange={e => setFilter('to', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        {(filters.status || filters.paymentStatus || filters.search || filters.from || filters.to || filters.userId) && (
          <Button onClick={() => { setSearch(''); setParams({}, { replace: true }); }}>Clear filters</Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer className={styles.table}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order</TableCell>
              <TableCell>Placed</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell align="right">Items</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Next step</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!orders && [...Array(6)].map((_, i) => (
              <TableRow key={i}><TableCell colSpan={8}><Skeleton height={28} /></TableCell></TableRow>
            ))}
            {orders?.length === 0 && (
              <TableRow><TableCell colSpan={8} className={styles.empty}>No orders match these filters.</TableCell></TableRow>
            )}
            {orders?.map(order => (
              <TableRow key={order.id} hover className={styles.rowLink} onClick={() => navigate(`${ROUTES.ADMIN_ORDERS}/${order.id}`)}>
                <TableCell><span className={styles.mono}>{shortId(order.id)}</span></TableCell>
                <TableCell><span className={styles.muted}>{formatDateTime(order.createdAt)}</span></TableCell>
                <TableCell>
                  <Typography sx={{ fontSize: '0.88rem' }}>{customerName(customers[order.userId])}</Typography>
                  <Typography className={styles.muted}>{customers[order.userId]?.email}</Typography>
                </TableCell>
                <TableCell align="right">{order.itemCount}</TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{formatCurrency(order.totalAmount)}</TableCell>
                <TableCell><PaymentStatusBadge status={order.paymentStatus} /></TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                  {order.openRequest && (
                    <Typography sx={{ fontSize: '0.75rem', color: '#9b1c1c', fontWeight: 600, mt: 0.5 }}>
                      {REQUEST_TYPE_LABEL[order.openRequest]} requested
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  {order.nextStatus && (
                    <Button size="small" variant="outlined" disabled={busyId === order.id} onClick={e => advance(e, order)} sx={{ whiteSpace: 'nowrap', py: 0.5, px: 1.5 }}>
                      Mark {ORDER_STATUS[order.nextStatus].label.toLowerCase()}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {pagination && pagination.total > 0 && (
          <TablePagination
            component="div"
            count={pagination.total}
            page={pagination.page - 1}
            rowsPerPage={pagination.limit}
            rowsPerPageOptions={[25, 50, 100]}
            onPageChange={(_, p) => setFilter('page', String(p + 1))}
            onRowsPerPageChange={e => setFilter('limit', e.target.value)}
          />
        )}
      </TableContainer>
    </Box>
  );
});

export default AdminOrders;
