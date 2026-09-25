import React, { createContext, useCallback, useContext, useState } from 'react';
import { Alert, AlertColor, Snackbar } from '@mui/material';
import { BRAND } from '../constants/colors';

interface ToastContextValue {
  showToast: (message: string, severity?: AlertColor) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<{ message: string; severity: AlertColor } | null>(null);

  const showToast = useCallback((message: string, severity: AlertColor = 'info') => {
    setToast({ message, severity });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{ '& .MuiAlert-root': { backgroundColor: '#1a1a1a', borderLeft: `4px solid ${BRAND.GOLD}`, color: '#fff' } }}
      >
        <Alert onClose={() => setToast(null)} severity={toast?.severity || 'info'} variant="filled">
          {toast?.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
