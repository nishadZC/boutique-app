import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Button, IconButton, Chip } from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  ArrowBackIosNew as ArrowBackIcon,
  ArrowForwardIos as ArrowNextIcon,
} from '@mui/icons-material';
import { ROUTES } from '../../../constants/routes';
import styles from './HomeCarousel.module.css';

export interface CarouselSlide {
  image: string;
  eyebrow: string;
  title: React.ReactNode;
  subtitle: string;
  ctaLabel: string;
  ctaTo: string;
  badge?: string;
}

const SLIDES: CarouselSlide[] = [
  {
    image: '/images/carousel/slide-1-sale.jpg',
    eyebrow: 'LIMITED TIME',
    title: <>SEASON SALE<br />UP TO 50% OFF</>,
    subtitle: 'Shirts, blazers and formal shoes at their best prices — while stocks last.',
    ctaLabel: 'Shop the Sale',
    ctaTo: ROUTES.PRODUCTS,
  },
  {
    image: '/images/carousel/slide-2-tailored.jpg',
    eyebrow: 'NEW ARRIVALS',
    title: <>SHARP.<br />TAILORED. YOU.</>,
    subtitle: 'Structured blazers and precision-cut suits for the man who means business.',
    ctaLabel: 'Shop Tailoring',
    ctaTo: ROUTES.PRODUCTS,
  },
  {
    image: '/images/carousel/slide-3-smart-casual.jpg',
    eyebrow: 'SMART CASUAL',
    title: <>EFFORTLESS<br />ELEGANCE</>,
    subtitle: 'Blazers, tees and tailored trousers for a look that’s polished without trying too hard.',
    ctaLabel: 'Shop the Edit',
    ctaTo: ROUTES.PRODUCTS,
  },
  {
    image: '/images/carousel/slide-4-boutique.jpg',
    eyebrow: 'OUR HERITAGE',
    title: <>LUX ATELIER<br />MEN&apos;S BOUTIQUE</>,
    subtitle: 'A men’s boutique built on timeless craftsmanship, one garment at a time.',
    ctaLabel: 'Explore Collection',
    ctaTo: ROUTES.STYLE_ADVISOR,
  },
];

const AUTOPLAY_MS = 6000;

const HomeCarousel = memo(function HomeCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((index: number) => {
    setActive(((index % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  const goNext = useCallback(() => goTo(active + 1), [active, goTo]);
  const goPrev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    if (paused) return undefined;
    timerRef.current = setInterval(() => {
      setActive(prev => (prev + 1) % SLIDES.length);
    }, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused]);

  return (
    <Box
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
            <Box className={styles.badgeSlot}>
              {slide.badge && (
                <Chip label={slide.badge} size="small" className={styles.badge} />
              )}
            </Box>
            <Typography variant="overline" className={styles.eyebrow}>
              {slide.eyebrow}
            </Typography>
            <Typography variant="h1" className={styles.title}>
              {slide.title}
            </Typography>
            <Typography variant="h5" component="p" className={styles.subtitle}>
              {slide.subtitle}
            </Typography>
            <Box className={styles.cta}>
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                component={RouterLink}
                to={slide.ctaTo}
                className={styles.ctaGold}
              >
                {slide.ctaLabel}
              </Button>
            </Box>
          </Box>
        </Box>
      ))}

      <IconButton
        aria-label="Previous slide"
        onClick={goPrev}
        className={`${styles.arrow} ${styles.arrowLeft}`}
      >
        <ArrowBackIcon fontSize="small" />
      </IconButton>
      <IconButton
        aria-label="Next slide"
        onClick={goNext}
        className={`${styles.arrow} ${styles.arrowRight}`}
      >
        <ArrowNextIcon fontSize="small" />
      </IconButton>

      <Box className={styles.dots}>
        {SLIDES.map((slide, index) => (
          <button
            key={slide.image}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            className={`${styles.dot} ${index === active ? styles.dotActive : ''}`}
            onClick={() => goTo(index)}
          />
        ))}
      </Box>
    </Box>
  );
});

export default HomeCarousel;
