import React, { memo, useState, useCallback } from 'react';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Box, IconButton, Badge, Drawer,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
} from '@mui/material';
import {
  ShoppingCart, AccountCircle, Home, ShoppingBag, Favorite,
  Menu as MenuIcon, ExitToApp as LogoutIcon, AutoAwesome, ReceiptLong, Person,
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useCart } from '../../../contexts/CartContext';
import { ROUTES } from '../../../constants/routes';
import { DRAWER_WIDTH } from '../../../constants/config';
import Footer from '../Footer/Footer';
import ScrollToTop from '../../common/ScrollToTop/ScrollToTop';
import styles from './Layout.module.css';

const NAV_ITEMS = [
  { label: 'Home',          path: ROUTES.HOME,         icon: <Home />,         exact: true },
  { label: 'Products',      path: ROUTES.PRODUCTS,     icon: <ShoppingBag />,  exact: false },
  { label: 'Style Advisor', path: ROUTES.STYLE_ADVISOR,icon: <AutoAwesome />,  exact: true },
  { label: 'Wishlist',      path: ROUTES.WISHLIST,     icon: <Favorite />,     exact: true },
  { label: 'Orders',        path: ROUTES.ORDERS,       icon: <ReceiptLong />,  exact: true },
  { label: 'Profile',       path: ROUTES.PROFILE,      icon: <Person />,       exact: true },
] as const;

const Layout = memo(function Layout() {
  const { isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const toggleDrawer = useCallback(() => setMobileOpen(o => !o), []);
  const closeDrawer  = useCallback(() => setMobileOpen(false), []);
  const handleLogout = useCallback(() => {
    logout();
    window.location.href = ROUTES.LOGIN;
  }, [logout]);

  const isActive = (path: string, exact: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const drawerContent = (
    <Box>
      <Toolbar sx={{ minHeight: { sm: '72px' } }} />
      <List className={styles.navList} sx={{ pt: 1 }}>
        {NAV_ITEMS.map(({ label, path, icon, exact }) => (
          <ListItem key={label} disablePadding>
            <ListItemButton
              component={RouterLink}
              to={path}
              onClick={closeDrawer}
              selected={isActive(path, exact)}
            >
              <ListItemIcon>
                {icon}
              </ListItemIcon>
              <ListItemText primary={label === 'Profile' && !isAuthenticated ? 'Sign In' : label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box className={styles.root}>
      <ScrollToTop />
      <AppBar 
        position="fixed" 
        elevation={0}
        className={styles.appBar} 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          borderBottom: '1px solid rgba(0,0,0,0.06)'
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 4 }, minHeight: { sm: '72px' } }}>
          <IconButton color="inherit" edge="start" onClick={toggleDrawer} sx={{ mr: 2, display: { sm: 'none' } }} aria-label="menu">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 700, fontSize: '1.25rem' }}>
            <RouterLink to={ROUTES.HOME} style={{ textDecoration: 'none', color: 'inherit' }}>
              Lux Atelier
            </RouterLink>
          </Typography>
          <IconButton color="inherit" component={RouterLink} to={ROUTES.CART} aria-label="cart" sx={{ mr: 1 }}>
            <Badge badgeContent={itemCount} color="error"><ShoppingCart /></Badge>
          </IconButton>
          {isAuthenticated
            ? <IconButton color="inherit" onClick={handleLogout} aria-label="logout"><LogoutIcon /></IconButton>
            : <IconButton color="inherit" component={RouterLink} to={ROUTES.LOGIN} aria-label="login"><AccountCircle /></IconButton>
          }
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={toggleDrawer} ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
          {drawerContent}
        </Drawer>
        <Drawer variant="permanent" open sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
          {drawerContent}
        </Drawer>
      </Box>

      <Box component="main" className={styles.main} sx={{ flexGrow: 1, width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        <Toolbar sx={{ minHeight: { sm: '72px' } }} />
        <Box className={styles.content}>
          <Outlet />
        </Box>
        <Footer />
      </Box>
    </Box>
  );
});

export default Layout;
