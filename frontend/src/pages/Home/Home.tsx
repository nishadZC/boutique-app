import React, { memo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container, Box, Typography, Button, Grid, Paper, Fade, Slide,
} from '@mui/material';
import {
  ShoppingBag as ShoppingBagIcon,
  ArrowForward as ArrowForwardIcon,
  LocalShipping as ShippingIcon,
  Security as SecurityIcon,
  Star as StarIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { ProductCard } from '../../components/common';
import LoadingSkeleton from '../../components/common/LoadingSkeleton/LoadingSkeleton';
import { useHome } from '../../hooks/useHome';
import { ROUTES } from '../../constants/routes';
import { BRAND } from '../../constants/colors';
import styles from './Home.module.css';

const FEATURES = [
  { icon: <ShippingIcon sx={{ fontSize: 48, color: BRAND.GOLD, mb: 2 }} />, title: 'Free Shipping',   desc: 'On orders over ₹500' },
  { icon: <SecurityIcon sx={{ fontSize: 48, color: BRAND.GOLD, mb: 2 }} />, title: 'Secure Payment',  desc: '100% secure transactions' },
  { icon: <StarIcon     sx={{ fontSize: 48, color: BRAND.GOLD, mb: 2 }} />, title: 'Premium Quality', desc: 'Carefully selected products' },
  { icon: <RefreshIcon  sx={{ fontSize: 48, color: BRAND.GOLD, mb: 2 }} />, title: 'Easy Returns',    desc: '30-day return policy' },
];

const FeatureCard = memo(({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <Paper elevation={2} className={styles.featureCard}>
    {icon}
    <Typography variant="h6" gutterBottom>{title}</Typography>
    <Typography variant="body2" color="text.secondary">{desc}</Typography>
  </Paper>
));

const Home = memo(function Home() {
  const { products, loading, isInWishlist, handleAddToCart, handleToggleWishlist } = useHome();

  return (
    <>
      {/* Hero */}
      <Box className={styles.hero}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Fade in timeout={800}>
                <Box>
                  <Typography variant="h1" className={styles.heroTitle}>
                    Redefine Your <Box component="span" className={styles.heroAccent}>Elegance</Box>
                  </Typography>
                  <Typography variant="h5" component="p" className={styles.heroSubtitle}>
                    Indulge in our curated collection of luxury products, where sophistication meets exceptional quality.
                  </Typography>
                  <Box className={styles.heroCta}>
                    <Button variant="contained" size="large" endIcon={<ShoppingBagIcon />} component={RouterLink} to={ROUTES.PRODUCTS} className={styles.ctaGold}>
                      Shop Collection
                    </Button>
                    <Button variant="outlined" size="large" endIcon={<ArrowForwardIcon />} href="#featured" className={styles.ctaOutline}>
                      Explore More
                    </Button>
                  </Box>
                </Box>
              </Fade>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Slide in timeout={1500} direction="right">
                <Box className={styles.heroVisual}>
                  <Typography variant="h2" className={styles.heroVisualText}>LUXURY<br />REDEFINED</Typography>
                </Box>
              </Slide>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features */}
      <Container maxWidth="lg">
        <Box sx={{ py: 8 }}>
          <Grid container spacing={4}>
            {FEATURES.map(f => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={f.title}>
                <FeatureCard {...f} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>

      {/* Featured Products */}
      <Box className={styles.featuredSection} id="featured">
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h4" component="h2" gutterBottom className={styles.sectionTitle}>Featured Products</Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>Discover our handpicked selection of luxury items</Typography>
          </Box>
          {loading
            ? <LoadingSkeleton count={8} />
            : (
              <Grid container spacing={4}>
                {products.map(product => (
                  <Grid size={{ xs: 6, sm: 6, md: 3 }} key={product.id}>
                    <ProductCard product={product} onAddToCart={handleAddToCart} onToggleWishlist={handleToggleWishlist} isInWishlist={isInWishlist(product.id)} />
                  </Grid>
                ))}
              </Grid>
            )
          }
          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Button variant="outlined" size="large" component={RouterLink} to={ROUTES.PRODUCTS} endIcon={<ArrowForwardIcon />} sx={{ px: 4, py: 1.5 }}>
              View All Products
            </Button>
          </Box>
        </Container>
      </Box>
    </>
  );
});

export default Home;