import React, { memo, useEffect, useState } from 'react';
import { Box, Rating, Skeleton, Typography } from '@mui/material';
import { Review, ReviewSummary, reviewService } from '../../services/reviewService';
import { BRAND } from '../../constants/colors';
import styles from './ProductReviews.module.css';

/** Verified-purchase reviews for a product: summary, distribution and the latest reviews. */
const ProductReviews = memo(({ productId }: { productId: string }) => {
  const [data, setData] = useState<{ reviews: Review[]; summary: ReviewSummary } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setFailed(false);
    reviewService.forProduct(productId, 10)
      .then(d => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [productId]);

  if (failed) return null;

  return (
    <Box component="section" id="reviews" className={styles.reviews} aria-labelledby="reviews-title">
      <Typography variant="h2" id="reviews-title" className={styles.title}>Customer reviews</Typography>
      {!data ? <Skeleton variant="rounded" height={140} /> : data.summary.count === 0 ? (
        <Typography className={styles.empty}>No reviews yet. Customers who received this item can review it from their order history.</Typography>
      ) : (
        <Box className={styles.layout}>
          <Box className={styles.summary}>
            <Typography className={styles.average}>{data.summary.average.toFixed(1)}</Typography>
            <Rating value={data.summary.average} precision={0.1} readOnly sx={{ color: BRAND.CHART_GOLD }} />
            <Typography className={styles.count}>{data.summary.count} verified review{data.summary.count === 1 ? '' : 's'}</Typography>
            <Box className={styles.bars}>
              {([5, 4, 3, 2, 1] as const).map(star => {
                const n = data.summary.distribution[star];
                return (
                  <Box key={star} className={styles.barRow} title={`${n} × ${star} star`}>
                    <span>{star}★</span>
                    <span className={styles.barTrack}><span className={styles.barFill} style={{ width: `${(n / data.summary.count) * 100}%` }} /></span>
                    <span className={styles.barCount}>{n}</span>
                  </Box>
                );
              })}
            </Box>
          </Box>
          <Box className={styles.list}>
            {data.reviews.map(r => (
              <Box key={r.id} component="article" className={styles.review}>
                <Box className={styles.reviewHeader}>
                  <Rating value={r.rating} readOnly size="small" sx={{ color: BRAND.CHART_GOLD }} />
                  {r.title && <Typography className={styles.reviewTitle}>{r.title}</Typography>}
                </Box>
                {r.comment && <Typography className={styles.reviewBody}>{r.comment}</Typography>}
                <Typography className={styles.reviewMeta}>
                  {r.reviewerName} · Verified buyer · {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
});

export default ProductReviews;
