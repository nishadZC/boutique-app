import React, { memo, useState, useCallback, useEffect, useRef } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Box, IconButton, Badge, Drawer, List, ListItem, ListItemButton,
  ListItemText, Divider, Menu, MenuItem, InputBase, Tooltip, Typography,
} from '@mui/material';
import {
  Search as SearchIcon, PersonOutline as AccountIcon, FavoriteBorder as WishlistIcon,
  ShoppingBagOutlined as CartIcon, Menu as MenuIcon, Close as CloseIcon,
  LocalShippingOutlined as ShippingIcon, AutoAwesomeOutlined as SparkleIcon, CachedOutlined as ReturnsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useAuthModal } from '../../../contexts/AuthModalContext';
import { useCart } from '../../../contexts/CartContext';
import { useWishlist } from '../../../contexts/WishlistContext';
import { ROUTES } from '../../../constants/routes';
import { SHOP_CATEGORIES, NEW_IN_URL, HANDCRAFTED_URL, ANNOUNCEMENTS, productsUrl } from '../../../constants/navigation';
import styles from './Header.module.css';

const ANNOUNCEMENT_ICONS = [<ShippingIcon key="ship" />, <SparkleIcon key="style" />, <ReturnsIcon key="returns" />];

const NAV_LINKS = [
  { label: 'New In', to: NEW_IN_URL },
  ...SHOP_CATEGORIES.map(({ label, category }) => ({ label, to: productsUrl({ category }) })),
  { label: 'Handcrafted', to: HANDCRAFTED_URL },
  { label: 'Style Advisor', to: ROUTES.STYLE_ADVISOR },
];

const ACCOUNT_LINKS = [
  { label: 'My Profile', to: ROUTES.PROFILE },
  { label: 'My Orders', to: ROUTES.ORDERS },
  { label: 'Wishlist', to: ROUTES.WISHLIST },
  { label: 'Style Advisor', to: ROUTES.STYLE_ADVISOR },
];

const Header = memo(function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { itemCount } = useCart();
  const { productIds } = useWishlist();
  const location = useLocation();
  const navigate = useNavigate();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [accountAnchor, setAccountAnchor] = useState<HTMLElement | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const closeSearch = useCallback(() => { setSearchOpen(false); setQuery(''); }, []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);
  const closeAccountMenu = useCallback(() => setAccountAnchor(null), []);

  const isActive = (to: string) => `${location.pathname}${location.search}` === to;

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(productsUrl({ q }));
    closeSearch();
  }, [navigate, query, closeSearch]);

  const handleAccountClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (isAuthenticated) setAccountAnchor(e.currentTarget);
    else openLoginModal();
  }, [isAuthenticated, openLoginModal]);

  const handleLogout = useCallback(async () => {
    closeAccountMenu();
    closeDrawer();
    await logout();
    navigate(ROUTES.HOME);
  }, [closeAccountMenu, closeDrawer, logout, navigate]);

  return (
    <>
      <Box className={styles.announcementBar} role="region" aria-label="Store announcements">
        {ANNOUNCEMENTS.map((text, i) => (
          <Box key={text} className={`${styles.announcement} ${i > 0 ? styles.announcementSecondary : ''}`}>
            {ANNOUNCEMENT_ICONS[i]}
            <span>{text}</span>
          </Box>
        ))}
      </Box>

      <AppBar position="sticky" elevation={0} className={styles.appBar}>
        <Toolbar className={`${styles.toolbar} ${searchOpen ? styles.searching : ''}`} disableGutters>
          <IconButton className={styles.menuButton} onClick={() => setDrawerOpen(true)} aria-label="Open menu">
            <MenuIcon />
          </IconButton>

          <RouterLink to={ROUTES.HOME} className={styles.logo} aria-label="Lux Atelier home">
            <span className={styles.logoMark}>LUX ATELIER</span>
            <span className={styles.logoSub}>MEN&apos;S BOUTIQUE</span>
          </RouterLink>

          <Box component="nav" className={styles.nav} aria-label="Main navigation">
            {NAV_LINKS.map(({ label, to }) => (
              <RouterLink key={label} to={to} className={`${styles.navLink} ${isActive(to) ? styles.navLinkActive : ''}`}>
                {label}
              </RouterLink>
            ))}
          </Box>

          <Box className={styles.actions}>
            <Box
              component="form"
              role="search"
              onSubmit={handleSearchSubmit}
              className={`${styles.searchInline} ${searchOpen ? styles.searchInlineOpen : ''}`}
              aria-hidden={!searchOpen}
            >
              <InputBase
                inputRef={searchInputRef}
                placeholder="Search shirts, shoes, brands…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') closeSearch(); }}
                inputProps={{ 'aria-label': 'Search products', tabIndex: searchOpen ? 0 : -1, maxLength: 100 }}
                className={styles.searchInput}
              />
            </Box>
            <Tooltip title={searchOpen ? 'Close search' : 'Search'}>
              <IconButton
                onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
                aria-label={searchOpen ? 'Close search' : 'Search products'}
                aria-expanded={searchOpen}
                className={styles.actionButton}
              >
                {searchOpen ? <CloseIcon /> : <SearchIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title={isAuthenticated ? `Hi, ${user?.firstName ?? 'there'}` : 'Sign in'}>
              <IconButton onClick={handleAccountClick} aria-label={isAuthenticated ? 'Account menu' : 'Sign in'} className={styles.actionButton}>
                <AccountIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Wishlist">
              <IconButton component={RouterLink} to={ROUTES.WISHLIST} aria-label="Wishlist" className={`${styles.actionButton} ${styles.hideOnMobile}`}>
                <Badge badgeContent={isAuthenticated ? productIds.length : 0} className={styles.badge}>
                  <WishlistIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="Cart">
              <IconButton component={RouterLink} to={ROUTES.CART} aria-label="Cart" className={styles.actionButton}>
                <Badge badgeContent={itemCount} className={styles.badge}>
                  <CartIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>

      </AppBar>

      <Menu
        anchorEl={accountAnchor}
        open={!!accountAnchor}
        onClose={closeAccountMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { className: styles.accountMenu } }}
      >
        <Box className={styles.accountMenuHeader}>
          <Typography variant="overline" color="text.secondary">Signed in as</Typography>
          <Typography variant="subtitle2" noWrap>{user?.firstName} {user?.lastName}</Typography>
        </Box>
        <Divider />
        {user?.role === 'admin' && (
          <MenuItem component={RouterLink} to={ROUTES.ADMIN} onClick={closeAccountMenu} sx={{ fontWeight: 600 }}>Admin dashboard</MenuItem>
        )}
        {ACCOUNT_LINKS.map(({ label, to }) => (
          <MenuItem key={label} component={RouterLink} to={to} onClick={closeAccountMenu}>{label}</MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={handleLogout}>Sign Out</MenuItem>
      </Menu>

      <Drawer anchor="left" open={drawerOpen} onClose={closeDrawer} slotProps={{ paper: { className: styles.drawerPaper } }}>
        <Box className={styles.drawerHeader}>
          <span className={styles.logoMark}>LUX ATELIER</span>
          <IconButton onClick={closeDrawer} aria-label="Close menu"><CloseIcon /></IconButton>
        </Box>
        <List>
          {NAV_LINKS.map(({ label, to }) => (
            <ListItem key={label} disablePadding>
              <ListItemButton component={RouterLink} to={to} onClick={closeDrawer} selected={isActive(to)}>
                <ListItemText primary={label} slotProps={{ primary: { className: styles.drawerLink } }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
        <List>
          {isAuthenticated
            ? (
              <>
                {user?.role === 'admin' && (
                  <ListItem disablePadding>
                    <ListItemButton component={RouterLink} to={ROUTES.ADMIN} onClick={closeDrawer}><ListItemText primary="Admin dashboard" /></ListItemButton>
                  </ListItem>
                )}
                {ACCOUNT_LINKS.map(({ label, to }) => (
                  <ListItem key={label} disablePadding>
                    <ListItemButton component={RouterLink} to={to} onClick={closeDrawer}>
                      <ListItemText primary={label} />
                    </ListItemButton>
                  </ListItem>
                ))}
                <ListItem disablePadding>
                  <ListItemButton onClick={handleLogout}><ListItemText primary="Sign Out" /></ListItemButton>
                </ListItem>
              </>
            )
            : (
              <ListItem disablePadding>
                <ListItemButton onClick={() => { closeDrawer(); openLoginModal(); }}>
                  <ListItemText primary="Sign In" />
                </ListItemButton>
              </ListItem>
            )}
        </List>
      </Drawer>
    </>
  );
});

export default Header;
