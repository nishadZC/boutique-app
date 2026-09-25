import React, { memo, useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert, Box, InputAdornment, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination,
  TableRow, TextField, Typography,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { adminService, apiErrorMessage } from '../../../services/adminService';
import { Customer, CustomerOrderStats, Pagination } from '../../../types/admin';
import { ROUTES } from '../../../constants/routes';
import StatTile from '../components/StatTile';
import { customerName, formatCurrency, formatDateTime } from '../format';
import styles from '../admin.module.css';

const AdminCustomers = memo(function AdminCustomers() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [stats, setStats] = useState<Record<string, CustomerOrderStats>>({});
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [summary, setSummary] = useState<{ totalAccounts: number; newLast30Days: number; admins: number } | null>(null);
  const [search, setSearch] = useState(params.get('search') ?? '');
  const [error, setError] = useState<string | null>(null);
  const page = Number(params.get('page') ?? '1');
  const limit = Number(params.get('limit') ?? '25');

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await adminService.listCustomers({ search: params.get('search') || undefined, page, limit });
      setCustomers(result.customers);
      setPagination(result.pagination);
      setSummary(result.summary);
      setStats(await adminService.customerOrderStats(result.customers.map(c => c.id)).catch(() => ({})));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load customers'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.toString()]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const handle = setTimeout(() => {
      if (search.trim() === (params.get('search') ?? '')) return;
      const next = new URLSearchParams(params);
      if (search.trim()) next.set('search', search.trim()); else next.delete('search');
      next.delete('page');
      setParams(next, { replace: true });
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const setPageParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    next.set(key, value);
    if (key === 'limit') next.delete('page');
    setParams(next, { replace: true });
  };

  return (
    <Box>
      <Box className={styles.pageHeader}>
        <Box>
          <span className={styles.eyebrow}>People</span>
          <Typography variant="h1" className={styles.title}>Customers</Typography>
        </Box>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box className={styles.kpiRow}>
        {summary ? (
          <>
            <StatTile label="Accounts" value={summary.totalAccounts.toLocaleString('en-IN')} />
            <StatTile label="New in 30 days" value={String(summary.newLast30Days)} />
            <StatTile label="Admins" value={String(summary.admins)} hint="Granted via database/scripts/grant-admin.sql" />
          </>
        ) : [...Array(3)].map((_, i) => <Skeleton key={i} variant="rounded" height={112} />)}
      </Box>
      <Box className={styles.toolbar}>
        <TextField size="small" placeholder="Name, email or phone" value={search} onChange={e => setSearch(e.target.value)} sx={{ minWidth: 280 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }} />
      </Box>
      <TableContainer className={styles.table}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Customer</TableCell><TableCell>Phone</TableCell><TableCell align="right">Orders</TableCell>
              <TableCell align="right">Spent</TableCell><TableCell>Last order</TableCell><TableCell>Joined</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!customers && [...Array(6)].map((_, i) => <TableRow key={i}><TableCell colSpan={6}><Skeleton height={32} /></TableCell></TableRow>)}
            {customers?.length === 0 && <TableRow><TableCell colSpan={6} className={styles.empty}>No customers found.</TableCell></TableRow>}
            {customers?.map(c => (
              <TableRow key={c.id} hover className={styles.rowLink} onClick={() => navigate(`${ROUTES.ADMIN_ORDERS}?userId=${c.id}`)}>
                <TableCell>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 500 }}>{customerName(c)}{c.role === 'admin' && <span className={styles.muted}> · Admin</span>}</Typography>
                  <Typography className={styles.muted}>{c.email}</Typography>
                </TableCell>
                <TableCell><span className={styles.muted}>{c.phone ?? '—'}</span></TableCell>
                <TableCell align="right">{stats[c.id]?.orders ?? 0}</TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(stats[c.id]?.spent ?? 0)}</TableCell>
                <TableCell><span className={styles.muted}>{stats[c.id]?.lastOrderAt ? formatDateTime(stats[c.id].lastOrderAt) : '—'}</span></TableCell>
                <TableCell><span className={styles.muted}>{formatDateTime(c.createdAt)}</span></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {pagination && pagination.total > 0 && (
          <TablePagination component="div" count={pagination.total} page={pagination.page - 1} rowsPerPage={pagination.limit}
            rowsPerPageOptions={[25, 50, 100]} onPageChange={(_, p) => setPageParam('page', String(p + 1))} onRowsPerPageChange={e => setPageParam('limit', e.target.value)} />
        )}
      </TableContainer>
    </Box>
  );
});

export default AdminCustomers;
