import React, { memo, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';
import { useAuthModal } from '../../../contexts/AuthModalContext';
import { ROUTES } from '../../../constants/routes';

const ProtectedRoute = memo<{ children: React.ReactNode }>(function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const { openLoginModal } = useAuthModal();
  const [dismissed, setDismissed] = React.useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Cancelling the modal means the page truly can't be shown - send them
      // somewhere real instead of leaving a blank gated page behind it.
      openLoginModal(() => setDismissed(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  if (!isAuthenticated) {
    if (dismissed) {
      return <Navigate to={ROUTES.HOME} replace />;
    }
    return null;
  }

  return <>{children}</>;
});

export default ProtectedRoute;
