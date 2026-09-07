import React, { useState } from 'react';
import { Outlet, Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  ShoppingCart,
  AccountCircle,
  Home,
  ShoppingBag,
  Favorite,
  Menu as MenuIcon,
  ExitToApp as LogoutIcon,
  AutoAwesome,
  ReceiptLong,
  Person,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

const drawerWidth = 240;

const brandMark = (
  <Box
    component="img"
    src="/logo192.png"
    alt="Lux Atelier logo"
    sx={{ width: 40, height: 40, flexShrink: 0, borderRadius: 2, objectFit: 'cover' }}
  />
);

const Layout: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleCloseMobile = () => {
    setMobileOpen(false);
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Box
          component={RouterLink}
          to="/"
          onClick={handleCloseMobile}
          sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: 'inherit', textDecoration: 'none' }}
        >
          {brandMark}
          <Typography variant="h6" noWrap sx={{ fontWeight: 700, color: 'inherit' }}>
            Lux Atelier
          </Typography>
        </Box>
      </Toolbar>
      <List>
        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/" onClick={handleCloseMobile} selected={location.pathname === '/'} sx={{ gap: 1 }}>
            <ListItemIcon>
              <Home />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/products" onClick={handleCloseMobile} selected={location.pathname.startsWith('/products')} sx={{ gap: 1 }}>
            <ListItemIcon>
              <ShoppingBag />
            </ListItemIcon>
            <ListItemText primary="Products" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/style-advisor" onClick={handleCloseMobile} selected={location.pathname === '/style-advisor'} sx={{ gap: 1 }}>
            <ListItemIcon>
              <AutoAwesome />
            </ListItemIcon>
            <ListItemText primary="Style Advisor" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/cart" onClick={handleCloseMobile} selected={location.pathname === '/cart'} sx={{ gap: 1 }}>
            <ListItemIcon>
              <Badge badgeContent={itemCount} color="secondary">
                <ShoppingCart />
              </Badge>
            </ListItemIcon>
            <ListItemText primary="Cart" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to={isAuthenticated ? '/wishlist' : '/login'} onClick={handleCloseMobile} selected={location.pathname === '/wishlist'} sx={{ gap: 1 }}>
            <ListItemIcon>
              <Favorite />
            </ListItemIcon>
            <ListItemText primary="Wishlist" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to={isAuthenticated ? '/orders' : '/login'} onClick={handleCloseMobile} selected={location.pathname === '/orders'} sx={{ gap: 1 }}>
            <ListItemIcon>
              <ReceiptLong />
            </ListItemIcon>
            <ListItemText primary="Orders" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to={isAuthenticated ? '/profile' : '/login'} onClick={handleCloseMobile} selected={location.pathname === '/profile' || location.pathname === '/login'} sx={{ gap: 1 }}>
            <ListItemIcon>
              <Person />
            </ListItemIcon>
            <ListItemText primary={isAuthenticated ? 'Profile' : 'Sign In'} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box
            component={RouterLink}
            to="/"
            sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.25 }, flexGrow: 1, minWidth: 0, color: 'inherit', textDecoration: 'none' }}
          >
            {brandMark}
            <Typography variant="h6" noWrap sx={{ minWidth: 0, fontWeight: 700 }}>
              Lux Atelier
            </Typography>
          </Box>
          <IconButton color="inherit" component={RouterLink} to="/cart">
            <Badge badgeContent={itemCount} color="error">
              <ShoppingCart />
            </Badge>
          </IconButton>
          {isAuthenticated ? (
            <Box sx={{ display: 'flex' }}>
              <IconButton color="inherit" onClick={logout}>
                <LogoutIcon />
              </IconButton>
            </Box>
          ) : (
            <IconButton color="inherit" component={RouterLink} to="/login">
              <AccountCircle />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Outlet key={location.pathname} />
      </Box>
    </Box>
  );
};

export default Layout;