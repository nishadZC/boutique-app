import React, { memo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Container, Box, Typography, Button, Grid, Skeleton } from '@mui/material';
import {
  East as ArrowIcon,
  SpaOutlined as FabricIcon,
  DiamondOutlined as DesignIcon,
  LocalShippingOutlined as ShippingIcon,
  CachedOutlined as ReturnsIcon,
} from '@mui/icons-material';
import { ProductCard, HomeCarousel } from '../../components/common';
import { useHome } from '../../hooks/useHome';
import { Product } from '../../types';
import { ROUTES } from '../../constants/routes';
import { HANDCRAFTED_URL, NEW_IN_URL, productsUrl } from '../../constants/navigation';
import { FREE_SHIPPING_THRESHOLD } from '../../constants/config';
import styles from './Home.module.css';

const PROMISES = [
  { icon: <FabricIcon />, title: 'Premium Fabrics', desc: 'Carefully selected materials' },
  { icon: <DesignIcon />, title: 'Timeless Design', desc: 'Built to outlast trends' },
  { icon: <ShippingIcon />, title: 'Free Shipping', desc: `On orders over ₹${FREE_SHIPPING_THRESHOLD}` },
  { icon: <ReturnsIcon />, title: 'Easy Returns', desc: 'Hassle-free within 30 days' },
];

const STYLE_NOTES = [
  {
    eyebrow: 'Style Advisor',
    title: 'Find the colours that flatter your skin tone',
    cta: 'Try it now',
    to: ROUTES.STYLE_ADVISOR,
    image: '/images/carousel/slide-3-smart-casual.jpg',
  },
  {
    eyebrow: 'The Office Edit',
    title: 'Crisp formal shirts for long days and late meetings',
    cta: 'Shop shirts',
    to: productsUrl({ category: 'Formal Shirts' }),
    image: '/images/carousel/slide-2-tailored.jpg',
  },
  {
    eyebrow: 'Finishing Touch',
    title: 'Oxfords, Derbies and loafers in fine leather',
    cta: 'Shop shoes',
    to: productsUrl({ category: 'Formal Shoes' }),
    image: '/images/carousel/slide-1-sale.jpg',
  },
];

const SectionIntro = ({ eyebrow, title }: { eyebrow: string; title: string }) => (
  <Box className={styles.intro}>
    <Typography variant="overline" className={styles.eyebrow}>{eyebrow}</Typography>
    <Typography variant="h2" className={styles.introTitle}>{title}</Typography>
  </Box>
);

const RowHeader = ({ title, to }: { title: string; to: string }) => (
  <Box className={styles.rowHeader}>
    <Typography variant="overline" component="h2" className={styles.eyebrow}>{title}</Typography>
    <RouterLink to={to} className={styles.viewAll}>View all <ArrowIcon sx={{ fontSize: 14 }} /></RouterLink>
  </Box>
);

interface ProductRowProps {
  title: string;
  to: string;
  products: Product[];
  loading: boolean;
  isInWishlist: (id: string) => boolean;
  onAddToCart: (product: Product, size?: string) => void;
  onToggleWishlist: (id: string) => void;
}

const ProductRow = memo(({ title, to, products, loading, isInWishlist, onAddToCart, onToggleWishlist }: ProductRowProps) => {
  if (!loading && products.length === 0) return null;
  return (
    <Container maxWidth="lg" component="section" className={styles.section}>
      <RowHeader title={title} to={to} />
      <Grid container spacing={{ xs: 2, md: 2.5 }}>
        {loading
          ? [...Array(6)].map((_, i) => (
            <Grid key={i} size={{ xs: 6, sm: 4, lg: 2 }}>
              <Skeleton variant="rectangular" className={styles.skeleton} sx={{ aspectRatio: '4 / 5', height: 'auto' }} />
              <Skeleton className={styles.skeleton} width="70%" sx={{ mt: 1.5 }} />
              <Skeleton className={styles.skeleton} width="40%" />
            </Grid>
          ))
          : products.map(product => (
            <Grid key={product.id} size={{ xs: 6, sm: 4, lg: 2 }}>
              <ProductCard
                tone="dark"
                product={product}
                onAddToCart={onAddToCart}
                onToggleWishlist={onToggleWishlist}
                isInWishlist={isInWishlist(product.id)}
              />
            </Grid>
          ))}
      </Grid>
    </Container>
  );
});

const Home = memo(function Home() {
  const { bestSellers, newArrivals, categories, handcraftedImage, loading, isInWishlist, handleAddToCart, handleToggleWishlist } = useHome();
  const rowProps = { loading, isInWishlist, onAddToCart: handleAddToCart, onToggleWishlist: handleToggleWishlist };

  const tiles = [
    ...categories.map(({ label, category, image, curated }) => ({ label, to: productsUrl({ category }), image, isProductShot: !curated })),
    { label: 'Handcrafted', to: HANDCRAFTED_URL, image: handcraftedImage, isProductShot: true },
    { label: 'Style Advisor', to: ROUTES.STYLE_ADVISOR, image: '/images/carousel/slide-4-boutique.jpg', isProductShot: false },
  ];

  return (
    <Box className={styles.page}>
      <HomeCarousel />

      {/* Promises */}
      <Box component="section" className={styles.promises} aria-label="Why shop with us">
        <Container maxWidth="lg">
          <Box className={styles.promiseRow}>
            {PROMISES.map(({ icon, title, desc }) => (
              <Box key={title} className={styles.promise}>
                <Box className={styles.promiseIcon}>{icon}</Box>
                <Box>
                  <Typography className={styles.promiseTitle}>{title}</Typography>
                  <Typography className={styles.promiseDesc}>{desc}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Categories */}
      <Container maxWidth="lg" component="section" className={styles.section}>
        <SectionIntro eyebrow="Shop by category" title="Elevated Essentials" />
        <Box className={styles.categoryGrid}>
          {loading
            ? [0, 1, 2, 3, 4, 5, 6, 7].map(i => <Skeleton key={i} variant="rectangular" className={`${styles.skeleton} ${styles.categorySkeleton}`} />)
            : tiles.map(({ label, to, image, isProductShot }) => (
              <RouterLink key={label} to={to} className={styles.categoryTile}>
                {image && <Box component="img" src={image} alt="" loading="lazy" className={`${styles.categoryImage} ${isProductShot ? styles.categoryImageProduct : ''}`} />}
                <Box className={styles.categoryOverlay} />
                <Box className={styles.categoryLabel}>
                  <span className={styles.categoryName}>{label}</span>
                  <span className={styles.categoryRule} />
                  <span className={styles.categoryCta}>Shop now <ArrowIcon sx={{ fontSize: 13 }} /></span>
                </Box>
              </RouterLink>
            ))}
        </Box>
      </Container>

      <ProductRow title="New Arrivals" to={NEW_IN_URL} products={newArrivals} {...rowProps} />

      {/* Editorial split */}
      <Box component="section" className={styles.editorial}>
        <Box className={styles.editorialText}>
          <Typography variant="overline" className={styles.eyebrow}>The tailoring edit</Typography>
          <Typography variant="h2" className={styles.editorialTitle}>Sharp. Refined.<br />Effortless.</Typography>
          <Typography className={styles.editorialBody}>
            Blazers, suits and overcoats cut and finished by hand in our atelier — made in your standard size or tailored to your own measurements.
          </Typography>
          <Button component={RouterLink} to={HANDCRAFTED_URL} endIcon={<ArrowIcon />} className={styles.goldButton}>
            Explore handcrafted
          </Button>
        </Box>
        <Box className={styles.editorialImage} role="img" aria-label="A rail of tailored jackets" />
      </Box>

      <ProductRow title="Best Sellers" to={ROUTES.PRODUCTS} products={bestSellers} {...rowProps} />

      {/* Style notes */}
      <Container maxWidth="lg" component="section" className={`${styles.section} ${styles.sectionLast}`}>
        <SectionIntro eyebrow="Style notes" title="Style. Craft. Confidence." />
        <Box className={styles.notesGrid}>
          {STYLE_NOTES.map(({ eyebrow, title, cta, to, image }) => (
            <RouterLink key={eyebrow} to={to} className={styles.note}>
              <Box component="img" src={image} alt="" loading="lazy" className={styles.noteImage} />
              <Box className={styles.noteOverlay} />
              <Box className={styles.noteText}>
                <span className={styles.noteEyebrow}>{eyebrow}</span>
                <span className={styles.noteTitle}>{title}</span>
                <span className={styles.noteCta}>{cta} <ArrowIcon sx={{ fontSize: 13 }} /></span>
              </Box>
            </RouterLink>
          ))}
        </Box>
      </Container>
    </Box>
  );
});

export default Home;
