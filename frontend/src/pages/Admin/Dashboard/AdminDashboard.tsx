import React, { memo, useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Skeleton, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { East, WarningAmberOutlined } from '@mui/icons-material';
import { adminService, apiErrorMessage } from '../../../services/adminService';
import { InventorySummary, Kpis } from '../../../types/admin';
import { ROUTES } from '../../../constants/routes';
import StatTile from '../components/StatTile';
import RevenueChart from '../components/RevenueChart';
import PipelineChart from '../components/PipelineChart';
import { formatCurrency } from '../format';
import styles from '../admin.module.css';

const PERIODS = [7, 30, 90, 365] as const;

const AdminDashboard = memo(function AdminDashboard() {
  const navigate = useNavigate();
  const [days, setDays] = useState<number>(30);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [inventory, setInventory] = useState<InventorySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setKpis(null);
    Promise.all([adminService.getKpis(days), adminService.inventorySummary()])
      .then(([k, inv]) => { if (!cancelled) { setKpis(k); setInventory(inv); } })
      .catch(err => { if (!cancelled) setError(apiErrorMessage(err, 'Could not load the dashboard')); });
    return () => { cancelled = true; };
  }, [days]);

  const ordersLink = (params: Record<string, string>) => `${ROUTES.ADMIN_ORDERS}?${new URLSearchParams(params)}`;
  const awaitingFulfilment = kpis ? kpis.pipeline.confirmed + kpis.pipeline.packed : 0;

  return (
    <Box>
      <Box className={styles.pageHeader}>
        <Box>
          <span className={styles.eyebrow}>Overview</span>
          <Typography variant="h1" className={styles.title}>Dashboard</Typography>
          <Typography className={styles.subtitle}>Paid revenue and orders for the selected period.</Typography>
        </Box>
        <ToggleButtonGroup size="small" exclusive value={days} onChange={(_, v) => v && setDays(v)} aria-label="Period">
          {PERIODS.map(p => <ToggleButton key={p} value={p}>{p === 365 ? '12 months' : `${p} days`}</ToggleButton>)}
        </ToggleButtonGroup>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {awaitingFulfilment > 0 && (
        <Alert
          severity="warning"
          icon={<WarningAmberOutlined />}
          sx={{ mb: 2 }}
          action={<Button color="inherit" size="small" component={RouterLink} to={ordersLink({ status: 'awaiting_fulfilment' })}>Review</Button>}
        >
          {awaitingFulfilment} paid order{awaitingFulfilment === 1 ? '' : 's'} waiting to be packed or shipped.
        </Alert>
      )}

      <Box className={styles.kpiRow}>
        {kpis ? (
          <>
            <StatTile label="Revenue" value={formatCurrency(kpis.revenue)} change={kpis.revenueChange} hint="vs previous period" />
            <StatTile label="Paid orders" value={String(kpis.paidOrders)} hint={`${kpis.previousPaidOrders} previous period`} />
            <StatTile label="Avg. order value" value={formatCurrency(kpis.averageOrderValue)} />
            <StatTile label="Checkout conversion" value={`${kpis.conversionRate}%`} hint={`${kpis.paidOrders} of ${kpis.totalOrders} orders paid`} />
            <StatTile label="Failed payments" value={String(kpis.failedPayments)} tone={kpis.failedPayments ? 'attention' : 'default'} />
            <StatTile label="Stock value" value={formatCurrency(inventory?.retailValue ?? 0)} hint={`${inventory?.unitsInStock ?? 0} units at retail`} />
          </>
        ) : [...Array(6)].map((_, i) => <Skeleton key={i} variant="rounded" height={112} />)}
      </Box>

      <Box className={styles.card} sx={{ mb: 2.5 }}>
        <Typography className={styles.cardTitle}>Paid revenue per day</Typography>
        {kpis ? <RevenueChart data={kpis.revenueByDay} /> : <Skeleton variant="rounded" height={240} />}
      </Box>

      <Box className={styles.grid2}>
        <Box className={styles.card}>
          <Box className={styles.cardHeader}>
            <Typography className={styles.cardTitle}>Order pipeline</Typography>
            <Button size="small" endIcon={<East />} component={RouterLink} to={ROUTES.ADMIN_ORDERS}>All orders</Button>
          </Box>
          {kpis ? (
            <PipelineChart stages={[
              { key: 'pending', label: 'Awaiting payment', count: kpis.pipeline.awaitingPayment, onClick: () => navigate(ordersLink({ status: 'pending' })) },
              { key: 'confirmed', label: 'Confirmed', count: kpis.pipeline.confirmed, onClick: () => navigate(ordersLink({ status: 'confirmed' })) },
              { key: 'packed', label: 'Packed', count: kpis.pipeline.packed, onClick: () => navigate(ordersLink({ status: 'packed' })) },
              { key: 'shipped', label: 'Shipped', count: kpis.pipeline.shipped, onClick: () => navigate(ordersLink({ status: 'shipped' })) },
              { key: 'ofd', label: 'Out for delivery', count: kpis.pipeline.outForDelivery, onClick: () => navigate(ordersLink({ status: 'out_for_delivery' })) },
              { key: 'delivered', label: 'Delivered', count: kpis.pipeline.delivered, onClick: () => navigate(ordersLink({ status: 'delivered' })) },
              { key: 'cancelled', label: 'Cancelled', count: kpis.pipeline.cancelled, onClick: () => navigate(ordersLink({ status: 'cancelled' })) },
            ]} />
          ) : <Skeleton variant="rounded" height={240} />}
        </Box>

        <Box className={styles.card}>
          <Typography className={styles.cardTitle}>Top products</Typography>
          {kpis && kpis.topProducts.length === 0 && <Typography className={styles.muted}>No paid orders in this period yet.</Typography>}
          {kpis?.topProducts.map((p, i) => (
            <Box key={p.productId} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, borderTop: i ? '1px solid #f0ede7' : 0 }}>
              <Box component="img" src={p.imageUrl} alt="" className={styles.thumb} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography noWrap sx={{ fontSize: '0.9rem', fontWeight: 500 }}>{p.name}</Typography>
                <Typography className={styles.muted}>{p.units} sold</Typography>
              </Box>
              <Typography sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(p.revenue)}</Typography>
            </Box>
          ))}
          {!kpis && <Skeleton variant="rounded" height={200} />}
        </Box>

        <Box className={styles.card}>
          <Box className={styles.cardHeader}>
            <Typography className={styles.cardTitle}>Low stock</Typography>
            <Button size="small" endIcon={<East />} component={RouterLink} to={ROUTES.ADMIN_INVENTORY}>Inventory</Button>
          </Box>
          {inventory && inventory.lowStockProducts.length === 0 && <Typography className={styles.muted}>Everything is well stocked.</Typography>}
          {inventory?.lowStockProducts.slice(0, 6).map((p, i) => (
            <Box key={p.id} component={RouterLink} to={`${ROUTES.ADMIN_PRODUCTS}/${p.id}`}
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, borderTop: i ? '1px solid #f0ede7' : 0, color: 'inherit', textDecoration: 'none' }}>
              <Box component="img" src={p.imageUrl} alt="" className={styles.thumb} />
              <Typography noWrap sx={{ flex: 1, fontSize: '0.9rem' }}>{p.name}</Typography>
              <Typography sx={{ fontWeight: 600, color: p.inventoryQuantity === 0 ? '#9b1c1c' : '#7a4a00' }}>
                {p.inventoryQuantity === 0 ? 'Out of stock' : `${p.inventoryQuantity} left`}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
});

export default AdminDashboard;
