import React, { memo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container, Box, Typography, Button, Grid, Paper,
} from '@mui/material';
import {
  ShoppingBag as ShoppingBagIcon,
  ArrowForward as ArrowForwardIcon,
  LocalShipping as ShippingIcon,
  Security as SecurityIcon,
  Star as StarIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { ProductCard, HomeCarousel } from '../../components/common';
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
      <Container maxWidth="lg" sx={{ bgcolor: '#0f0f0f', pt: { xs: 2, md: 4 }, px: { xs: 2, md: 4 }, my: '24px' }}>
        {/* Hero carousel */}
        <HomeCarousel />
      </Container>

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

      {/* About Section */}
      <Box className={styles.aboutSection}>
        <Container maxWidth="lg">
          <Grid container spacing={8} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Box className={styles.aboutImageWrapper}>
                <Box
                  component="img"
                  src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=2000&auto=format&fit=crop"
                  alt="Men's formal tailoring"
                  className={styles.aboutImage}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box className={styles.aboutContent}>
                <Typography variant="overline" className={styles.aboutSubtitle}>
                  Our Heritage
                </Typography>
                <Typography variant="h3" component="h2" className={styles.aboutTitle}>
                  The Art of Fine Tailoring
                </Typography>
                <Typography variant="body1" className={styles.aboutText}>
                  At Lux Atelier, we believe that true elegance lies in the details.
                  Our curated collection of premium men's formal wear is designed for the modern gentleman who refuses to compromise on quality or style.
                </Typography>
                <Typography variant="body1" className={styles.aboutText}>
                  From perfectly tailored suits to impeccably crafted accessories, every piece reflects our commitment to exceptional craftsmanship and timeless sophistication.
                  Step into a world where luxury is tailored to perfection.
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Button variant="outlined" size="large" component={RouterLink} to={ROUTES.STYLE_ADVISOR} className={styles.ctaDark}>
                    Discover Your Style
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

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
              <Grid container spacing={2.5}>
                {products.map(product => (
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product.id}>
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
