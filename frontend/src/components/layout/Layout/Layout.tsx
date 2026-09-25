import React, { memo } from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import ScrollToTop from '../../common/ScrollToTop/ScrollToTop';
import styles from './Layout.module.css';

const Layout = memo(function Layout() {
  return (
    <Box className={styles.root}>
      <ScrollToTop />
      <Header />
      <Box component="main" className={styles.content}>
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
});

export default Layout;
