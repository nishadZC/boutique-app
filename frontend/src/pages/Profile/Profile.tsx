import React, { memo, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
  Alert, Box, Button, Container, IconButton, InputAdornment, LinearProgress, Skeleton, Tab, Tabs, TextField,
  Tooltip, Typography,
} from '@mui/material';
import {
  DashboardOutlined, DeleteOutline, East, LogoutOutlined, Visibility, VisibilityOff,
} from '@mui/icons-material';
import { AddressForm } from '../../components/AddressForm/AddressForm';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/common/StatusBadge/StatusBadge';
import { useProfile } from '../../hooks/useProfile';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { ROUTES } from '../../constants/routes';
import { formatAddress } from '../../types/address';
import { formatPhone, PHONE_MAX_INPUT_LENGTH } from '../../utils/validation';
import { apiErrorMessage } from '../../services/adminService';
import styles from './Profile.module.css';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'details', label: 'Personal details' },
  { key: 'addresses', label: 'Addresses' },
  { key: 'security', label: 'Security' },
] as const;
type TabKey = typeof TABS[number]['key'];

const money = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

function passwordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}
const STRENGTH = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];

function SecurityPanel({ onChange }: { onChange: (current: string, next: string) => Promise<void> }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const errors = {
    current: current ? null : 'Enter your current password',
    next: next.length >= 8 ? (next === current ? 'Choose a password different from your current one' : null) : 'Use at least 8 characters',
    confirm: confirm === next ? null : 'Passwords do not match',
  };
  const strength = passwordStrength(next);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    if (errors.current || errors.next || errors.confirm) return;
    setSaving(true);
    try {
      await onChange(current, next);
      setCurrent(''); setNext(''); setConfirm(''); setSubmitted(false);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update your password'));
    } finally {
      setSaving(false);
    }
  };

  const toggle = (
    <InputAdornment position="end">
      <IconButton onClick={() => setShow(s => !s)} edge="end" aria-label={show ? 'Hide passwords' : 'Show passwords'}>
        {show ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Box component="form" onSubmit={submit} noValidate className={styles.formGrid}>
      <Typography className={styles.panelIntro}>
        Signed in with Google? Your account is protected by Google, so there is no password to change here.
      </Typography>
      <TextField label="Current password" type={show ? 'text' : 'password'} autoComplete="current-password" value={current}
        onChange={e => setCurrent(e.target.value)} error={submitted && !!errors.current} helperText={submitted && errors.current}
        slotProps={{ input: { endAdornment: toggle } }} />
      <Box>
        <TextField fullWidth label="New password" type={show ? 'text' : 'password'} autoComplete="new-password" value={next}
          onChange={e => setNext(e.target.value)} error={submitted && !!errors.next} helperText={submitted ? errors.next : 'At least 8 characters'} />
        {next && (
          <Box sx={{ mt: 1 }}>
            <LinearProgress variant="determinate" value={(strength / 4) * 100} className={styles.strength} data-strength={strength} />
            <Typography className={styles.strengthLabel}>{STRENGTH[strength]}</Typography>
          </Box>
        )}
      </Box>
      <TextField label="Confirm new password" type={show ? 'text' : 'password'} autoComplete="new-password" value={confirm}
        onChange={e => setConfirm(e.target.value)} error={submitted && !!errors.confirm} helperText={submitted && errors.confirm} />
      {error && <Alert severity="error">{error}</Alert>}
      <Box><Button type="submit" variant="contained" disabled={saving}>{saving ? 'Updating…' : 'Update password'}</Button></Box>
    </Box>
  );
}

const Profile: React.FC = memo(() => {
  const { openLoginModal } = useAuthModal();
  const [params, setParams] = useSearchParams();
  const tab: TabKey = (TABS.find(t => t.key === params.get('tab'))?.key) ?? 'overview';
  const setTab = (key: TabKey) => setParams(key === 'overview' ? {} : { tab: key }, { replace: true });
  const {
    user, details, setDetails, detailsErrors, saveDetails, savingDetails,
    address, setAddress, saveAddress, savingAddress, savedAddresses, removeSavedAddress, makeDefaultAddress,
    orders, stats, changePassword, handleLogout,
  } = useProfile();
  const [detailsSubmitted, setDetailsSubmitted] = useState(false);

  if (!user) {
    return (
      <Container maxWidth="sm" className={styles.signedOut}>
        <Typography variant="h4" gutterBottom>Sign in to view your account</Typography>
        <Button variant="contained" onClick={() => openLoginModal()}>Sign in</Button>
      </Container>
    );
  }

  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || user.email[0].toUpperCase();
  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : null;
  const showDetailError = (key: keyof typeof detailsErrors) => (detailsSubmitted || (key === 'phone' && details.phone.trim())) && detailsErrors[key];

  return (
    <Box className={styles.page}>
      <Box className={styles.hero}>
        <Container maxWidth="lg" className={styles.heroInner}>
          <Box className={styles.avatar} aria-hidden="true">{initials}</Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <span className={styles.heroEyebrow}>My account</span>
            <Typography variant="h1" className={styles.heroName}>{user.firstName} {user.lastName}</Typography>
            <Typography className={styles.heroMeta}>{user.email}{memberSince && ` · Member since ${memberSince}`}</Typography>
          </Box>
          <Box className={styles.heroActions}>
            {user.role === 'admin' && (
              <Button component={RouterLink} to={ROUTES.ADMIN} startIcon={<DashboardOutlined />} className={styles.goldButton}>Admin dashboard</Button>
            )}
            <Button onClick={handleLogout} startIcon={<LogoutOutlined />} className={styles.ghostButton}>Sign out</Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile className={styles.tabs}>
          {TABS.map(t => <Tab key={t.key} value={t.key} label={t.label} />)}
        </Tabs>

        {tab === 'overview' && (
          <Box className={styles.section}>
            <Box className={styles.stats}>
              {[
                { label: 'Orders', value: String(stats.orders), to: ROUTES.ORDERS },
                { label: 'Total spent', value: money(stats.spent), to: ROUTES.ORDERS },
                { label: 'Delivered', value: String(stats.delivered), to: ROUTES.ORDERS },
                { label: 'Wishlist', value: String(stats.wishlist), to: ROUTES.WISHLIST },
              ].map(s => (
                <Box key={s.label} component={RouterLink} to={s.to} className={styles.stat}>
                  <span className={styles.statLabel}>{s.label}</span>
                  <span className={styles.statValue}>{orders ? s.value : '–'}</span>
                </Box>
              ))}
            </Box>

            <Box className={styles.panel}>
              <Box className={styles.panelHeader}>
                <Typography className={styles.panelTitle}>Recent orders</Typography>
                <Button component={RouterLink} to={ROUTES.ORDERS} endIcon={<East />} size="small">All orders</Button>
              </Box>
              {!orders && [0, 1].map(i => <Skeleton key={i} height={64} />)}
              {orders?.length === 0 && (
                <Box className={styles.emptyRow}>
                  <Typography color="text.secondary">No orders yet.</Typography>
                  <Button component={RouterLink} to={ROUTES.PRODUCTS} variant="outlined" size="small">Start shopping</Button>
                </Box>
              )}
              {orders?.slice(0, 3).map(o => (
                <Box key={o.id} component={RouterLink} to={ROUTES.ORDERS} className={styles.orderRow}>
                  <Box className={styles.orderThumbs}>
                    {o.items.slice(0, 3).map(i => i.product?.imageUrl && <img key={i.id} src={i.product.imageUrl} alt="" />)}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography className={styles.orderTitle}>#{o.id.slice(0, 8).toUpperCase()} · {o.items.length} item{o.items.length === 1 ? '' : 's'}</Typography>
                    <Typography className={styles.orderMeta}>{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {money(o.totalAmount)}</Typography>
                  </Box>
                  {o.paymentStatus === 'paid' ? <OrderStatusBadge status={o.status} /> : <PaymentStatusBadge status={o.paymentStatus} />}
                </Box>
              ))}
            </Box>

            <Box className={styles.panelGrid}>
              <Box className={styles.panel}>
                <Typography className={styles.panelTitle}>Contact</Typography>
                <Typography>{user.firstName} {user.lastName}</Typography>
                <Typography color="text.secondary">{user.email}</Typography>
                <Typography color="text.secondary">{user.phone ? formatPhone(user.phone) : 'No phone number added'}</Typography>
                <Button size="small" sx={{ mt: 1, px: 0 }} onClick={() => setTab('details')}>Edit details</Button>
              </Box>
              <Box className={styles.panel}>
                <Typography className={styles.panelTitle}>Default delivery address</Typography>
                <Typography color={user.address ? 'text.primary' : 'text.secondary'}>{user.address || 'No address saved yet'}</Typography>
                <Button size="small" sx={{ mt: 1, px: 0 }} onClick={() => setTab('addresses')}>Manage addresses</Button>
              </Box>
            </Box>
          </Box>
        )}

        {tab === 'details' && (
          <Box className={`${styles.section} ${styles.panel}`}>
            <Typography className={styles.panelTitle}>Personal details</Typography>
            <Box component="form" noValidate className={styles.formGrid}
              onSubmit={async e => { e.preventDefault(); setDetailsSubmitted(true); if (await saveDetails()) setDetailsSubmitted(false); }}>
              <Box className={styles.twoCol}>
                <TextField label="First name" required autoComplete="given-name" value={details.firstName}
                  onChange={e => setDetails({ ...details, firstName: e.target.value })}
                  error={!!showDetailError('firstName')} helperText={showDetailError('firstName') || ' '} slotProps={{ htmlInput: { maxLength: 100 } }} />
                <TextField label="Last name" required autoComplete="family-name" value={details.lastName}
                  onChange={e => setDetails({ ...details, lastName: e.target.value })}
                  error={!!showDetailError('lastName')} helperText={showDetailError('lastName') || ' '} slotProps={{ htmlInput: { maxLength: 100 } }} />
              </Box>
              <TextField label="Email" value={user.email} disabled helperText="Your sign-in email can't be changed here" />
              <TextField label="Mobile number" type="tel" autoComplete="tel" value={details.phone}
                onChange={e => setDetails({ ...details, phone: e.target.value })}
                error={!!showDetailError('phone')} helperText={showDetailError('phone') || 'For delivery updates, e.g. 98765 43210'}
                slotProps={{ htmlInput: { inputMode: 'tel', maxLength: PHONE_MAX_INPUT_LENGTH } }} />
              <Box><Button type="submit" variant="contained" disabled={savingDetails}>{savingDetails ? 'Saving…' : 'Save details'}</Button></Box>
            </Box>
          </Box>
        )}

        {tab === 'addresses' && (
          <Box className={styles.section}>
            <Box className={styles.panel}>
              <Typography className={styles.panelTitle}>Default delivery address</Typography>
              <Typography className={styles.panelIntro}>Used to pre-fill checkout.</Typography>
              <AddressForm value={address} onChange={setAddress} />
              <Button variant="contained" sx={{ mt: 2 }} disabled={savingAddress} onClick={saveAddress}>{savingAddress ? 'Saving…' : 'Save address'}</Button>
            </Box>
            <Box className={styles.panel}>
              <Typography className={styles.panelTitle}>Saved addresses</Typography>
              {savedAddresses.length === 0 && <Typography color="text.secondary">Addresses you use at checkout are saved here on this device.</Typography>}
              {savedAddresses.map(a => (
                <Box key={a.id} className={styles.savedAddress}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 500 }}>{a.label}</Typography>
                    <Typography color="text.secondary" sx={{ fontSize: '0.88rem' }}>{formatAddress(a.fields)}</Typography>
                    {a.phone && <Typography color="text.secondary" sx={{ fontSize: '0.82rem' }}>{formatPhone(a.phone)}</Typography>}
                  </Box>
                  <Button size="small" onClick={() => makeDefaultAddress(a)} disabled={savingAddress}>Make default</Button>
                  <Tooltip title="Remove">
                    <IconButton size="small" onClick={() => removeSavedAddress(a.id)} aria-label={`Remove ${a.label}`}><DeleteOutline fontSize="small" /></IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {tab === 'security' && (
          <Box className={`${styles.section} ${styles.panel}`}>
            <Typography className={styles.panelTitle}>Change password</Typography>
            <SecurityPanel onChange={changePassword} />
          </Box>
        )}
      </Container>
    </Box>
  );
});

export default Profile;
