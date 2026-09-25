import React, { memo } from 'react';
import { Box, Typography } from '@mui/material';
import { NorthEast, SouthEast } from '@mui/icons-material';
import styles from './StatTile.module.css';

interface StatTileProps {
  label: string;
  value: string;
  /** Percentage change vs the previous period; null when there is nothing to compare. */
  change?: number | null;
  hint?: string;
  tone?: 'default' | 'attention';
}

const StatTile = memo(({ label, value, change, hint, tone = 'default' }: StatTileProps) => (
  <Box className={`${styles.tile} ${tone === 'attention' ? styles.attention : ''}`}>
    <Typography className={styles.label}>{label}</Typography>
    <Typography className={styles.value}>{value}</Typography>
    <Box className={styles.meta}>
      {change != null && (
        <span className={change >= 0 ? styles.up : styles.down}>
          {change >= 0 ? <NorthEast fontSize="inherit" /> : <SouthEast fontSize="inherit" />}
          {Math.abs(change)}%
        </span>
      )}
      {hint && <span className={styles.hint}>{hint}</span>}
    </Box>
  </Box>
));

export default StatTile;
