import React, { useEffect, useState } from 'react';
import { Box, Container, Grid, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../../components/common/ProductCard';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { productService } from '../../services/productService';
import { Product } from '../../types';

const Wishlist: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { productIds, loading: wishlistLoading, toggleWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    productService.getAll()
      .then(allProducts => setProducts(allProducts.filter(product => productIds.includes(product.id))))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated, productIds]);

  if (!isAuthenticated) {
    return <Container maxWidth="md"><Box sx={{ py: 8, textAlign: 'center' }}><Typography variant="h4">Please sign in to view your wishlist.</Typography></Box></Container>;
  }

  if (loading || wishlistLoading) return <Container maxWidth="lg"><Box sx={{ py: 8 }}><LoadingSkeleton count={4} /></Box></Container>;

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>My Wishlist</Typography>
        {products.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">Your wishlist is empty.</Typography>
            <Typography color="text.secondary" sx={{ mt: 1, cursor: 'pointer' }} onClick={() => navigate('/products')}>Browse products to find something special.</Typography>
          </Box>
        ) : (
          <Grid container spacing={4}>
            {products.map(product => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product.id}>
                <ProductCard product={product} onAddToCart={addItem} onToggleWishlist={toggleWishlist} isInWishlist={isInWishlist(product.id)} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default Wishlist;
