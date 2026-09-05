import React, { memo } from 'react';
import { Box, Typography } from '@mui/material';
import styles from './AuthLayout.module.css';

interface AuthLayoutProps {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}

const AuthLayout = memo<AuthLayoutProps>(function AuthLayout({ children, eyebrow, title, description }) {
  return (
    <Box component="main" className={styles.root}>
      <Box className={styles.hero}>
        <Box className={styles.heroContent}>
          <Box className={styles.logoRow}>
            <Typography className={styles.logoText}>LUX ATELIER</Typography>
          </Box>
          <Typography className={styles.eyebrow}>{eyebrow}</Typography>
          <Typography component="h1" className={styles.title}>{title}</Typography>
          <Typography className={styles.description}>{description}</Typography>
        </Box>
      </Box>
      <Box className={styles.formSide}>
        <Box className={styles.formWrapper}>{children}</Box>
      </Box>
    </Box>
  );
});

export default AuthLayout;