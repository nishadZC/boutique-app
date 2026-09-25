import React, { memo, useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert, Box, Button, FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Select, Skeleton, Table,
  TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import { Add, ArchiveOutlined, Inventory2Outlined, Search, UnarchiveOutlined } from '@mui/icons-material';
import { adminService, apiErrorMessage } from '../../../services/adminService';
import { AdminProduct, Pagination } from '../../../types/admin';
import { useToast } from '../../../contexts/ToastContext';
import { ROUTES } from '../../../constants/routes';
import { TONE_STYLES } from '../../../constants/orderStatus';
import { formatCurrency } from '../format';
import StockDialog from './StockDialog';
import styles from '../admin.module.css';

const LOW_STOCK = 5;

export const StockLabel = ({ quantity }: { quantity: number }) => {
  const tone = quantity === 0 ? 'critical' : quantity <= LOW_STOCK ? 'warning' : 'good';
  return (
    <span style={{ ...TONE_STYLES[tone], padding: '2px 10px', borderRadius: 999, fontSize: '0.76rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {quantity === 0 ? 'Out of stock' : quantity <= LOW_STOCK ? `Low · ${quantity}` : `${quantity} in stock`}
    </span>
  );
};

const AdminProducts = memo(function AdminProducts() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(params.get('search') ?? '');
  const [stockProduct, setStockProduct] = useState<AdminProduct | null>(null);

  const filters = {
    search: params.get('search') ?? '', categoryId: params.get('categoryId') ?? '',
    status: params.get('status') ?? 'active', stock: params.get('stock') ?? '',
    page: Number(params.get('page') ?? '1'), limit: Number(params.get('limit') ?? '25'),
  };
  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  useEffect(() => { adminService.listCategories().then(setCategories).catch(() => setCategories([])); }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await adminService.listProducts({
        search: filters.search || undefined, categoryId: filters.categoryId || undefined, status: filters.status,
        stock: filters.stock || undefined, page: filters.page, limit: filters.limit,
      });
      setProducts(result.products);
      setPagination(result.pagination);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load products'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.toString()]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const handle = setTimeout(() => { if (search !== filters.search) setFilter('search', search.trim()); }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const toggleActive = async (event: React.MouseEvent, product: AdminProduct) => {
    event.stopPropagation();
    try {
      await adminService.setProductActive(product.id, !product.isActive);
      showToast(product.isActive ? `${product.name} archived — hidden from the store` : `${product.name} is back in the store`, 'success');
      await load();
    } catch (err) {
      showToast(apiErrorMessage(err, 'Could not update the product'), 'error');
    }
  };

  return (
    <Box>
      <Box className={styles.pageHeader}>
        <Box>
          <span className={styles.eyebrow}>Catalogue</span>
          <Typography variant="h1" className={styles.title}>Products</Typography>
          <Typography className={styles.subtitle}>{pagination ? `${pagination.total} product${pagination.total === 1 ? '' : 's'}` : ' '}</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} component={RouterLink} to={ROUTES.ADMIN_NEW_PRODUCT}>Add product</Button>
      </Box>

      <Box className={styles.toolbar}>
        <TextField size="small" placeholder="Name, SKU or brand" value={search} onChange={e => setSearch(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }} />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Category</InputLabel>
          <Select label="Category" value={filters.categoryId} onChange={e => setFilter('categoryId', e.target.value)}>
            <MenuItem value="">All categories</MenuItem>
            {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
            <MenuItem value="active">In the store</MenuItem>
            <MenuItem value="archived">Archived</MenuItem>
            <MenuItem value="all">All</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Stock</InputLabel>
          <Select label="Stock" value={filters.stock} onChange={e => setFilter('stock', e.target.value)}>
            <MenuItem value="">Any stock</MenuItem>
            <MenuItem value="low">Low stock</MenuItem>
            <MenuItem value="out">Out of stock</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer className={styles.table}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!products && [...Array(6)].map((_, i) => <TableRow key={i}><TableCell colSpan={6}><Skeleton height={44} /></TableCell></TableRow>)}
            {products?.length === 0 && <TableRow><TableCell colSpan={6} className={styles.empty}>No products match these filters.</TableCell></TableRow>}
            {products?.map(p => (
              <TableRow key={p.id} hover className={styles.rowLink} onClick={() => navigate(`${ROUTES.ADMIN_PRODUCTS}/${p.id}`)} sx={{ opacity: p.isActive ? 1 : 0.6 }}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box component="img" src={p.imageUrl} alt="" className={styles.thumb} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 500 }}>{p.name}</Typography>
                      <Typography className={styles.muted}>{p.brand}{!p.isActive && ' · Archived'}{p.isFeatured && ' · Featured'}{p.isHandcrafted && ' · Handcrafted'}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell><span className={styles.mono}>{p.sku || '—'}</span></TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(p.price)}
                  {p.comparePrice && <Typography className={styles.muted} sx={{ textDecoration: 'line-through' }}>{formatCurrency(p.comparePrice)}</Typography>}
                </TableCell>
                <TableCell><StockLabel quantity={p.inventoryQuantity} /></TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  <Tooltip title="Adjust stock">
                    <IconButton size="small" onClick={e => { e.stopPropagation(); setStockProduct(p); }} aria-label={`Adjust stock for ${p.name}`}><Inventory2Outlined fontSize="small" /></IconButton>
                  </Tooltip>
                  <Tooltip title={p.isActive ? 'Archive (hide from store)' : 'Restore to store'}>
                    <IconButton size="small" onClick={e => toggleActive(e, p)} aria-label={p.isActive ? `Archive ${p.name}` : `Restore ${p.name}`}>
                      {p.isActive ? <ArchiveOutlined fontSize="small" /> : <UnarchiveOutlined fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {pagination && pagination.total > 0 && (
          <TablePagination component="div" count={pagination.total} page={pagination.page - 1} rowsPerPage={pagination.limit}
            rowsPerPageOptions={[25, 50, 100]} onPageChange={(_, pg) => setFilter('page', String(pg + 1))} onRowsPerPageChange={e => setFilter('limit', e.target.value)} />
        )}
      </TableContainer>

      <StockDialog
        product={stockProduct}
        onClose={() => setStockProduct(null)}
        onSaved={quantity => { showToast(`Stock updated to ${quantity}`, 'success'); setStockProduct(null); load(); }}
      />
    </Box>
  );
});

export default AdminProducts;
