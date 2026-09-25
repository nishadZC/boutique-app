import React, { memo, useState } from 'react';
import { Link as RouterLink, NavLink, Outlet } from 'react-router-dom';
import { Box, Drawer, IconButton, Typography } from '@mui/material';
import {
  DashboardOutlined, ReceiptLongOutlined, CheckroomOutlined, Inventory2Outlined, PeopleOutline,
  StorefrontOutlined, Menu as MenuIcon, Logout,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants/routes';
import ScrollToTop from '../../components/common/ScrollToTop/ScrollToTop';
import styles from './AdminLayout.module.css';

const NAV = [
  { label: 'Dashboard', to: ROUTES.ADMIN, icon: <DashboardOutlined />, end: true },
  { label: 'Orders', to: ROUTES.ADMIN_ORDERS, icon: <ReceiptLongOutlined /> },
  { label: 'Products', to: ROUTES.ADMIN_PRODUCTS, icon: <CheckroomOutlined /> },
  { label: 'Inventory', to: ROUTES.ADMIN_INVENTORY, icon: <Inventory2Outlined /> },
  { label: 'Customers', to: ROUTES.ADMIN_CUSTOMERS, icon: <PeopleOutline /> },
];

const AdminLayout = memo(function AdminLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const sidebar = (
    <Box className={styles.sidebar}>
      <RouterLink to={ROUTES.ADMIN} className={styles.brand} onClick={() => setOpen(false)}>
        <span className={styles.brandMark}>LUX ATELIER</span>
        <span className={styles.brandSub}>ADMIN</span>
      </RouterLink>
      <Box component="nav" className={styles.nav} aria-label="Admin">
        {NAV.map(({ label, to, icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}>
            {icon}<span>{label}</span>
          </NavLink>
        ))}
      </Box>
      <Box className={styles.sidebarFooter}>
        <RouterLink to={ROUTES.HOME} className={styles.navLink}><StorefrontOutlined /><span>View store</span></RouterLink>
        <button type="button" className={styles.navLink} onClick={() => logout()}><Logout /><span>Sign out</span></button>
        <Typography className={styles.signedInAs} noWrap>{user?.email}</Typography>
      </Box>
    </Box>
  );

  return (
    <Box className={styles.root}>
      <ScrollToTop />
      <Box className={styles.desktopSidebar}>{sidebar}</Box>
      <Drawer open={open} onClose={() => setOpen(false)} slotProps={{ paper: { className: styles.drawerPaper } }}>{sidebar}</Drawer>
      <Box className={styles.main}>
        <Box className={styles.mobileBar}>
          <IconButton onClick={() => setOpen(true)} aria-label="Open admin menu"><MenuIcon /></IconButton>
          <span className={styles.brandMark}>LUX ATELIER</span>
        </Box>
        <Box component="main" className={styles.content}><Outlet /></Box>
      </Box>
    </Box>
  );
});

export default AdminLayout;
