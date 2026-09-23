import React, { memo, useCallback, useState } from 'react';
import { Box, IconButton } from '@mui/material';
import {
  ArrowBackIosNew as ArrowBackIcon,
  ArrowForwardIos as ArrowNextIcon,
} from '@mui/icons-material';
import styles from './ImageCarousel.module.css';

export interface ImageCarouselSlide {
  src: string;
  alt: string;
}

interface ImageCarouselProps {
  images: ImageCarouselSlide[];
  aspectRatio?: string;
  bare?: boolean;
}

const ImageCarousel = memo(function ImageCarousel({ images, aspectRatio, bare }: ImageCarouselProps) {
  const [active, setActive] = useState(0);

  const goTo = useCallback((index: number) => {
    setActive(((index % images.length) + images.length) % images.length);
  }, [images.length]);

  if (images.length === 0) return null;

  return (
    <Box className={styles.carousel}>
      <Box
        className={`${styles.viewport} ${bare ? styles.viewportBare : ''}`}
        style={aspectRatio ? { aspectRatio } : undefined}
      >
        {images.map((image, index) => (
          <Box
            key={image.src}
            component="img"
            src={image.src}
            alt={image.alt}
            className={`${styles.slide} ${index === active ? styles.slideActive : ''}`}
            aria-hidden={index !== active}
          />
        ))}

        {images.length > 1 && (
          <>
            <IconButton
              aria-label="Previous image"
              onClick={() => goTo(active - 1)}
              className={`${styles.arrow} ${styles.arrowLeft}`}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <IconButton
              aria-label="Next image"
              onClick={() => goTo(active + 1)}
              className={`${styles.arrow} ${styles.arrowRight}`}
            >
              <ArrowNextIcon fontSize="small" />
            </IconButton>
          </>
        )}
      </Box>

      {images.length > 1 && (
        <Box className={styles.dots}>
          {images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              aria-label={`Go to image ${index + 1}`}
              className={`${styles.dot} ${index === active ? styles.dotActive : ''}`}
              onClick={() => goTo(index)}
            />
          ))}
        </Box>
      )}
    </Box>
  );
});

export default ImageCarousel;
