import React, { memo, useCallback, useEffect, useState } from 'react';
import { Box, IconButton } from '@mui/material';
import { West as PrevIcon, East as NextIcon } from '@mui/icons-material';
import styles from './ProductGallery.module.css';

export interface GalleryImage {
  src: string;
  alt: string;
  /** Charts and diagrams are shown whole (contain) rather than cropped. */
  isGuide?: boolean;
}

const ProductGallery = memo(function ProductGallery({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => { setActive(0); }, [images]);

  const goTo = useCallback((index: number) => {
    setActive(((index % images.length) + images.length) % images.length);
  }, [images.length]);

  if (images.length === 0) return null;
  const current = images[active];

  return (
    <Box className={styles.gallery}>
      {images.length > 1 && (
        <Box className={styles.thumbs} role="tablist" aria-label="Product images">
          {images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={image.alt}
              onClick={() => setActive(index)}
              className={`${styles.thumb} ${index === active ? styles.thumbActive : ''} ${image.isGuide ? styles.thumbGuide : ''}`}
            >
              <img src={image.src} alt="" loading="lazy" />
            </button>
          ))}
        </Box>
      )}

      <Box className={`${styles.stage} ${current.isGuide ? styles.stageGuide : ''}`}>
        <img key={current.src} src={current.src} alt={current.alt} className={styles.stageImage} />
        {images.length > 1 && (
          <Box className={styles.stageNav}>
            <IconButton aria-label="Previous image" onClick={() => goTo(active - 1)} className={styles.navButton} size="small">
              <PrevIcon fontSize="small" />
            </IconButton>
            <span className={styles.counter}>{active + 1} / {images.length}</span>
            <IconButton aria-label="Next image" onClick={() => goTo(active + 1)} className={styles.navButton} size="small">
              <NextIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>
    </Box>
  );
});

export default ProductGallery;
