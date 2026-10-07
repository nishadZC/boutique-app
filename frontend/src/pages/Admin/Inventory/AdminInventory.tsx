import React, { memo, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ToggleButton,
  ToggleButtonGroup, Typography,
} from '@mui/material';
import { adminService, apiErrorMessage } from '../../../services/adminService';
import { AdminProduct, InventorySummary } from '../../../types/admin';
import { useToast } from '../../../contexts/ToastContext';
import { ROUTES } from '../../../constants/routes';
import StatTile from '../components/StatTile';
import StockDialog from '../Products/StockDialog';
import { StockLabel } from '../Products/AdminProducts';
import { formatCurrency } from '../format';
import styles from '../admin.module.css';

const AdminInventory = memo(function AdminInventory() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [filter, setFilter] = useState<'low' | 'out'>('out');
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stockProduct, setStockProduct] = useState<AdminProduct | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setProducts(null);
    try {
      const [s, list] = await Promise.all([
        adminService.inventorySummary(),
        adminService.listProducts({ status: 'active', stock: filter, limit: 100 }),
      ]);
      setSummary(s);
      setProducts(list.products);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load inventory'));
    }
  }, [filter]);

  useEffect(() => { void load(); }, [load]);

  return (
    <Box>
      <Box className={styles.pageHeader}>
        <Box>
          <span className={styles.eyebrow}>Catalogue</span>
          <Typography variant="h1" className={styles.title}>Inventory</Typography>
          <Typography className={styles.subtitle}>Stock is deducted automatically when an order is paid and returned when it is cancelled or refunded.</Typography>
        </Box>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box className={styles.kpiRow}>
        {summary ? (
          <>
            <StatTile label="Out of stock" value={String(summary.outOfStock)} tone={summary.outOfStock ? 'attention' : 'default'} />
            <StatTile label="Low stock" value={String(summary.lowStock)} hint={`${summary.lowStockThreshold} or fewer left`} tone={summary.lowStock ? 'attention' : 'default'} />
            <StatTile label="Products in store" value={String(summary.activeProducts)} hint={`${summary.archivedProducts} archived`} />
            <StatTile label="Units in stock" value={summary.unitsInStock.toLocaleString('en-IN')} />
            <StatTile label="Stock value (retail)" value={formatCurrency(summary.retailValue)} />
          </>
        ) : [...Array(5)].map((_, i) => <Skeleton key={i} variant="rounded" height={112} />)}
      </Box>

      <Box className={styles.cardHeader} sx={{ mt: 1 }}>
        <ToggleButtonGroup size="small" exclusive value={filter} onChange={(_, v) => v && setFilter(v)}>
          <ToggleButton value="out">Out of stock</ToggleButton>
          <ToggleButton value="low">Low stock</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <TableContainer className={styles.table}>
        <Table>
          <TableHead>
            <TableRow><TableCell>Product</TableCell><TableCell>Category</TableCell><TableCell>Stock</TableCell><TableCell align="right" /></TableRow>
          </TableHead>
          <TableBody>
            {!products && [...Array(4)].map((_, i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton height={44} /></TableCell></TableRow>)}
            {products?.length === 0 && (
              <TableRow><TableCell colSpan={4} className={styles.empty}>{filter === 'out' ? 'Nothing is out of stock.' : 'No products are running low.'}</TableCell></TableRow>
            )}
            {products?.map(p => (
              <TableRow key={p.id} hover className={styles.rowLink} onClick={() => navigate(`${ROUTES.ADMIN_PRODUCTS}/${p.id}`)}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box component="img" src={p.imageUrl} alt="" className={styles.thumb} />
                    <Box><Typography sx={{ fontSize: '0.9rem', fontWeight: 500 }}>{p.name}</Typography><Typography className={styles.muted}>{p.sku || p.brand}</Typography></Box>
                  </Box>
                </TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell><StockLabel quantity={p.inventoryQuantity} /></TableCell>
                <TableCell align="right">
                  <Button size="small" variant="outlined" onClick={e => { e.stopPropagation(); setStockProduct(p); }}>Restock</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <StockDialog product={stockProduct} onClose={() => setStockProduct(null)}
        onSaved={quantity => { showToast(`Stock updated to ${quantity}`, 'success'); setStockProduct(null); void load(); }} />
    </Box>
  );
});

export default AdminInventory;
