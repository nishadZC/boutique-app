import React, { memo, useEffect, useState } from 'react';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useAuthModal } from '../../../contexts/AuthModalContext';
import { ROUTES } from '../../../constants/routes';

/**
 * Client-side gate for the admin area. This only decides what to render: every
 * admin API independently requires an admin token on the server.
 */
const AdminRoute = memo<{ children: React.ReactNode }>(function AdminRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();
  const { openLoginModal } = useAuthModal();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) openLoginModal(() => setDismissed(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isAuthenticated]);

  if (loading) {
    return <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}><CircularProgress color="secondary" /></Box>;
  }
  if (!isAuthenticated) return dismissed ? <Navigate to={ROUTES.HOME} replace /> : null;
  if (user?.role !== 'admin') {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '70vh', textAlign: 'center', px: 2 }}>
        <Box>
          <LockOutlined sx={{ fontSize: 40, color: 'text.secondary' }} />
          <Typography variant="h4" sx={{ mt: 1 }}>Admins only</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>Your account does not have access to the admin area.</Typography>
          <Button variant="contained" component={RouterLink} to={ROUTES.HOME}>Back to the store</Button>
        </Box>
      </Box>
    );
  }
  return <>{children}</>;
});

export default AdminRoute;
