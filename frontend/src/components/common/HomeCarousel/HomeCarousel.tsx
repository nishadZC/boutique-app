import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { East as NextIcon } from '@mui/icons-material';
import { ROUTES } from '../../../constants/routes';
import { NEW_IN_URL, productsUrl } from '../../../constants/navigation';
import styles from './HomeCarousel.module.css';

export interface CarouselSlide {
  /** Poster frame, and the fallback shown when the video is missing or can't play. */
  image: string;
  /** Optional muted background video (H.264 MP4, ~10–20s, no audio track needed). */
  video?: string;
  eyebrow: string;
  title: React.ReactNode;
  subtitle: string;
  primary: { label: string; to: string };
  secondary: { label: string; to: string };
}

const SLIDES: CarouselSlide[] = [
  {
    image: '/images/carousel/slide-2-tailored.jpg',
    video: '/videos/hero/slide-1-tailored.mp4',
    eyebrow: 'New collection',
    title: <>Timeless<br />by Nature</>,
    subtitle: 'Precision-cut shirts and trousers for the man who dresses with intent.',
    primary: { label: 'Shop Now', to: NEW_IN_URL },
    secondary: { label: 'Explore Collection', to: ROUTES.PRODUCTS },
  },
  {
    image: '/images/carousel/slide-1-sale.jpg',
    video: '/videos/hero/slide-2-sale.mp4',
    eyebrow: 'Limited time',
    title: <>The Season<br />Sale</>,
    subtitle: 'Up to 50% off formal shirts, trousers and leather shoes — while stocks last.',
    primary: { label: 'Shop the Sale', to: ROUTES.PRODUCTS },
    secondary: { label: 'Shop Shoes', to: productsUrl({ category: 'Formal Shoes' }) },
  },
  {
    image: '/images/carousel/slide-3-smart-casual.jpg',
    video: '/videos/hero/slide-3-smart-casual.mp4',
    eyebrow: 'Smart casual',
    title: <>Effortless<br />Elegance</>,
    subtitle: 'Polished pieces that move from the boardroom to dinner without missing a beat.',
    primary: { label: 'Shop Shirts', to: productsUrl({ category: 'Formal Shirts' }) },
    secondary: { label: 'Shop Trousers', to: productsUrl({ category: 'Trousers & Pants' }) },
  },
  {
    image: '/images/carousel/slide-4-boutique.jpg',
    video: '/videos/hero/slide-4-boutique.mp4',
    eyebrow: 'Our heritage',
    title: <>Crafted for<br />the Gentleman</>,
    subtitle: 'A men’s boutique built on timeless craftsmanship, one garment at a time.',
    primary: { label: 'Find Your Style', to: ROUTES.STYLE_ADVISOR },
    secondary: { label: 'Explore Collection', to: ROUTES.PRODUCTS },
  },
];

/** How long an image-only slide (or a slide whose video failed) stays up. */
const IMAGE_SLIDE_MS = 6000;
/** Upper bound for a video slide, so a long clip doesn't hold the hero forever. */
const MAX_VIDEO_SLIDE_MS = 15000;
const pad = (n: number) => String(n).padStart(2, '0');

const HomeCarousel = memo(function HomeCarousel() {
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const [playing, setPlaying] = useState<Record<number, boolean>>({});

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const progressRef = useRef<HTMLSpanElement | null>(null);
  const elapsedRef = useRef(0);

  const goTo = useCallback((index: number) => {
    setActive(((index % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  const hasVideo = (index: number) => Boolean(SLIDES[index].video) && !failed[index];

  // Play the active slide's video from the start; pause and rewind the rest.
  useEffect(() => {
    elapsedRef.current = 0;
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      if (index === active) {
        video.currentTime = 0;
        video.play().catch(() => { /* autoplay blocked: poster stays visible */ });
      } else {
        video.pause();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Single clock for both slide types: drives the progress line and advances the slide.
  useEffect(() => {
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      elapsedRef.current += now - last;
      last = now;

      const video = videoRefs.current[active];
      let progress: number;
      if (hasVideo(active) && video && Number.isFinite(video.duration) && video.duration > 0) {
        const length = Math.min(video.duration * 1000, MAX_VIDEO_SLIDE_MS);
        progress = Math.min((video.currentTime * 1000) / length, 1);
        if (video.ended) progress = 1;
      } else if (hasVideo(active)) {
        progress = 0; // still buffering — hold until metadata arrives
        if (elapsedRef.current > MAX_VIDEO_SLIDE_MS) progress = 1;
      } else {
        progress = Math.min(elapsedRef.current / IMAGE_SLIDE_MS, 1);
      }

      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`;
      if (progress >= 1) {
        setActive(prev => (prev + 1) % SLIDES.length);
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, failed]);

  const handleVideoError = (index: number) => setFailed(prev => ({ ...prev, [index]: true }));
  const handleVideoPlaying = (index: number) => setPlaying(prev => ({ ...prev, [index]: true }));

  return (
    <Box
      component="section"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      className={styles.carousel}
    >
      {SLIDES.map((slide, index) => {
        const isActive = index === active;
        const isNext = index === (active + 1) % SLIDES.length;
        return (
          <Box
            key={slide.image}
            className={`${styles.slide} ${isActive ? styles.slideActive : ''}`}
            style={{ backgroundImage: `url(${slide.image})` }}
            aria-hidden={!isActive}
          >
            {slide.video && !failed[index] && (
              <video
                ref={el => {
                  videoRefs.current[index] = el;
                  // Browsers only allow autoplay for muted video; set the property directly so it is in place before play().
                  if (el) { el.muted = true; el.defaultMuted = true; }
                }}
                className={`${styles.video} ${playing[index] ? styles.videoReady : ''}`}
                src={slide.video}
                poster={slide.image}
                muted
                autoPlay={isActive}
                playsInline
                preload={isActive ? 'auto' : isNext ? 'metadata' : 'none'}
                aria-hidden="true"
                tabIndex={-1}
                onPlaying={() => handleVideoPlaying(index)}
                onError={() => handleVideoError(index)}
              />
            )}
            <Box className={styles.slideOverlay} />
            <Box className={styles.slideContent}>
              <Typography variant="overline" className={styles.eyebrow}>{slide.eyebrow}</Typography>
              <Typography variant="h1" className={styles.title}>{slide.title}</Typography>
              <Typography variant="body1" className={styles.subtitle}>{slide.subtitle}</Typography>
              <Box className={styles.cta}>
                <Button component={RouterLink} to={slide.primary.to} endIcon={<NextIcon />} className={styles.ctaPrimary} tabIndex={isActive ? 0 : -1}>
                  {slide.primary.label}
                </Button>
                <RouterLink to={slide.secondary.to} className={styles.ctaSecondary} tabIndex={isActive ? 0 : -1}>
                  {slide.secondary.label}
                </RouterLink>
              </Box>
            </Box>
          </Box>
        );
      })}

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
              {index === active && (
                <span className={styles.counterLine}>
                  <span className={styles.counterFill} ref={progressRef} />
                </span>
              )}
            </button>
          ))}
        </Box>
      </Box>
    </Box>
  );
});

export default HomeCarousel;
