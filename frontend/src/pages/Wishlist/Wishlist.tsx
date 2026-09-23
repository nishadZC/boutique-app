import React, { memo, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Container, Box, Typography, Grid, Button, Paper, Avatar, CircularProgress } from '@mui/material';
import { Favorite as FavoriteIcon, ShoppingBag as ShoppingBagIcon } from '@mui/icons-material';
import { ProductCard } from '../../components/common';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CartContext';
import { productService } from '../../services/productService';
import { Product } from '../../types';
import { ROUTES } from '../../constants/routes';

const Wishlist = memo(function Wishlist() {
  const { productIds, loading: wishlistLoading, isInWishlist, toggleWishlist } = useWishlist();
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    productService.getAll()
      .then(data => { if (!cancelled) setProducts(data); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setProductsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const wishlistProducts = useMemo(
    () => productIds.map(id => products.find(product => product.id === id)).filter((product): product is Product => Boolean(product)),
    [productIds, products],
  );

  if (wishlistLoading || productsLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress color="secondary" /></Box>;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 2, width: '100%', mb: 4 }}>
          <Typography variant="h3" component="h1">My Wishlist</Typography>
        </Box>

        {productIds.length === 0 ? (
          <Paper elevation={3} sx={{ p: 6, textAlign: 'center' }}>
            <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 3, bgcolor: '#f5f5f5' }}>
              <FavoriteIcon sx={{ fontSize: 40, color: '#ccc' }} />
            </Avatar>
            <Typography variant="h5" gutterBottom>Your wishlist is empty</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Save products you love — click the heart icon on any product.
            </Typography>
            <Button variant="contained" size="large" component={RouterLink} to={ROUTES.PRODUCTS} startIcon={<ShoppingBagIcon />} sx={{ px: 4 }}>
              Browse Products
            </Button>
          </Paper>
        ) : (
          <Box>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>{productIds.length} {productIds.length === 1 ? 'item' : 'items'} saved</Typography>
            <Grid container spacing={2.5}>
              {wishlistProducts.map(product => (
                <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <ProductCard
                    product={product}
                    onAddToCart={addItem}
                    onToggleWishlist={toggleWishlist}
                    isInWishlist={isInWishlist(product.id)}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>
    </Container>
  );
});

export default Wishlist;