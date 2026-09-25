import React, { memo, useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Button, IconButton } from '@mui/material';
import { West as PrevIcon, East as NextIcon } from '@mui/icons-material';
import { ROUTES } from '../../../constants/routes';
import { NEW_IN_URL, productsUrl } from '../../../constants/navigation';
import styles from './HomeCarousel.module.css';

export interface CarouselSlide {
  image: string;
  eyebrow: string;
  title: React.ReactNode;
  subtitle: string;
  primary: { label: string; to: string };
  secondary: { label: string; to: string };
}

const SLIDES: CarouselSlide[] = [
  {
    image: '/images/carousel/slide-2-tailored.jpg',
    eyebrow: 'New collection',
    title: <>Timeless<br />by Nature</>,
    subtitle: 'Precision-cut shirts and trousers for the man who dresses with intent.',
    primary: { label: 'Shop Now', to: NEW_IN_URL },
    secondary: { label: 'Explore Collection', to: ROUTES.PRODUCTS },
  },
  {
    image: '/images/carousel/slide-1-sale.jpg',
    eyebrow: 'Limited time',
    title: <>The Season<br />Sale</>,
    subtitle: 'Up to 50% off formal shirts, trousers and leather shoes — while stocks last.',
    primary: { label: 'Shop the Sale', to: ROUTES.PRODUCTS },
    secondary: { label: 'Shop Shoes', to: productsUrl({ category: 'Formal Shoes' }) },
  },
  {
    image: '/images/carousel/slide-3-smart-casual.jpg',
    eyebrow: 'Smart casual',
    title: <>Effortless<br />Elegance</>,
    subtitle: 'Polished pieces that move from the boardroom to dinner without missing a beat.',
    primary: { label: 'Shop Shirts', to: productsUrl({ category: 'Formal Shirts' }) },
    secondary: { label: 'Shop Trousers', to: productsUrl({ category: 'Trousers & Pants' }) },
  },
  {
    image: '/images/carousel/slide-4-boutique.jpg',
    eyebrow: 'Our heritage',
    title: <>Crafted for<br />the Gentleman</>,
    subtitle: 'A men’s boutique built on timeless craftsmanship, one garment at a time.',
    primary: { label: 'Find Your Style', to: ROUTES.STYLE_ADVISOR },
    secondary: { label: 'Explore Collection', to: ROUTES.PRODUCTS },
  },
];

const AUTOPLAY_MS = 6000;
const pad = (n: number) => String(n).padStart(2, '0');

const HomeCarousel = memo(function HomeCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((index: number) => {
    setActive(((index % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return undefined;
    const timer = setInterval(() => setActive(prev => (prev + 1) % SLIDES.length), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [paused, active]);

  return (
    <Box
      component="section"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      className={styles.carousel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {SLIDES.map((slide, index) => (
        <Box
          key={slide.image}
          className={`${styles.slide} ${index === active ? styles.slideActive : ''}`}
          style={{ backgroundImage: `url(${slide.image})` }}
          aria-hidden={index !== active}
        >
          <Box className={styles.slideOverlay} />
          <Box className={styles.slideContent}>
            <Typography variant="overline" className={styles.eyebrow}>{slide.eyebrow}</Typography>
            <Typography variant="h1" className={styles.title}>{slide.title}</Typography>
            <Typography variant="body1" className={styles.subtitle}>{slide.subtitle}</Typography>
            <Box className={styles.cta}>
              <Button component={RouterLink} to={slide.primary.to} endIcon={<NextIcon />} className={styles.ctaPrimary} tabIndex={index === active ? 0 : -1}>
                {slide.primary.label}
              </Button>
              <RouterLink to={slide.secondary.to} className={styles.ctaSecondary} tabIndex={index === active ? 0 : -1}>
                {slide.secondary.label}
              </RouterLink>
            </Box>
          </Box>
        </Box>
      ))}

      <Box className={styles.controls}>
        <Box className={styles.counter}>
          {SLIDES.map((slide, index) => (
            <button
              key={slide.image}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === active}
              className={`${styles.counterItem} ${index === active ? styles.counterItemActive : ''}`}
              onClick={() => goTo(index)}
            >
              {pad(index + 1)}
              {index === active && <span className={styles.counterLine} key={active} />}
            </button>
          ))}
        </Box>
        <Box className={styles.arrows}>
          <IconButton aria-label="Previous slide" onClick={() => goTo(active - 1)} className={styles.arrow}>
            <PrevIcon fontSize="small" />
          </IconButton>
          <IconButton aria-label="Next slide" onClick={() => goTo(active + 1)} className={styles.arrow}>
            <NextIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
});

export default HomeCarousel;
