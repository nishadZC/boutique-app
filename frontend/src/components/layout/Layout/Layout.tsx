import React, { memo, useState, useCallback } from 'react';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Box, IconButton, Badge, Button, Drawer,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
} from '@mui/material';
import {
  ShoppingCart, AccountCircle, Home, ShoppingBag, Favorite,
  Menu as MenuIcon, AutoAwesome, ReceiptLong, Person,
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useAuthModal } from '../../../contexts/AuthModalContext';
import { useCart } from '../../../contexts/CartContext';
import { ROUTES } from '../../../constants/routes';
import { DRAWER_WIDTH } from '../../../constants/config';
import { BRAND } from '../../../constants/colors';
import Footer from '../Footer/Footer';
import ScrollToTop from '../../common/ScrollToTop/ScrollToTop';
import styles from './Layout.module.css';

// Overrides the theme's global MuiButton hover (lift + shadow) with a plain
// text-color darken - no background, elevation, or shadow change.
const NAV_BUTTON_HOVER_SX = {
  backgroundColor: 'transparent',
  boxShadow: 'none',
  transform: 'none',
  color: BRAND.DARK_DEEP,
};

const NAV_ITEMS = [
  { label: 'Home',          path: ROUTES.HOME,         icon: <Home />,         exact: true,  authRequired: false },
  { label: 'Products',      path: ROUTES.PRODUCTS,     icon: <ShoppingBag />,  exact: false, authRequired: false },
  { label: 'Style Advisor', path: ROUTES.STYLE_ADVISOR,icon: <AutoAwesome />,  exact: true,  authRequired: true },
  { label: 'Wishlist',      path: ROUTES.WISHLIST,     icon: <Favorite />,     exact: true,  authRequired: true },
  { label: 'Orders',        path: ROUTES.ORDERS,       icon: <ReceiptLong />,  exact: true,  authRequired: true },
  { label: 'Profile',       path: ROUTES.PROFILE,      icon: <Person />,       exact: true,  authRequired: true },
] as const;

const Layout = memo(function Layout() {
  const { isAuthenticated, user } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { itemCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const toggleDrawer = useCallback(() => setMobileOpen(o => !o), []);
  const closeDrawer  = useCallback(() => setMobileOpen(false), []);

  const isActive = (path: string, exact: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const drawerContent = (
    <Box>
      <Toolbar sx={{ minHeight: { sm: '72px' } }} />
      <List className={styles.navList} sx={{ pt: 1, mt: '18px' }}>
        {NAV_ITEMS.filter(({ authRequired }) => !authRequired || isAuthenticated).map(({ label, path, icon, exact }) => (
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
              <ListItemText primary={label} />
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
          <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 700, fontSize: '1.25rem', display: 'flex', alignItems: 'center' }}>
            <RouterLink to={ROUTES.HOME} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Box component="img" src="/lux-atelier-logo.svg" alt="Lux Atelier logo" sx={{ width: 32, height: 32, borderRadius: 1, objectFit: 'contain' }} />
              Lux Atelier
            </RouterLink>
          </Typography>
          <Button
            color="inherit"
            component={RouterLink}
            to={ROUTES.CART}
            aria-label="cart"
            sx={{
              mr: 1, textTransform: 'none', minWidth: 0, px: { xs: 1, sm: 2 },
              '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } },
              '&:hover': NAV_BUTTON_HOVER_SX,
            }}
            startIcon={<Badge badgeContent={itemCount} color="error"><ShoppingCart /></Badge>}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Cart</Box>
          </Button>
          {isAuthenticated
            ? (
              <Button color="inherit" component={RouterLink} to={ROUTES.PROFILE} aria-label="profile" startIcon={<AccountCircle />}
                sx={{
                  textTransform: 'none', minWidth: 0, px: { xs: 1, sm: 2 },
                  '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } },
                  '&:hover': NAV_BUTTON_HOVER_SX,
                }}>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{user?.firstName || 'Profile'}</Box>
              </Button>
            )
            : (
              <Button color="inherit" onClick={() => openLoginModal()} aria-label="login" startIcon={<AccountCircle />}
                sx={{
                  textTransform: 'none', minWidth: 0, px: { xs: 1, sm: 2 },
                  '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } },
                  '&:hover': NAV_BUTTON_HOVER_SX,
                }}>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Sign In</Box>
              </Button>
            )
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
