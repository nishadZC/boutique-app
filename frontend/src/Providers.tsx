import React from 'react';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { AuthModalProvider, useAuthModal } from './contexts/AuthModalContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { SkinToneAdvisorProvider } from './contexts/SkinToneAdvisorContext';
import { Outlet } from 'react-router-dom';
import LoginModal from './components/auth/LoginModal/LoginModal';

// Single shared instance of the auth modal - every "please sign in" trigger
// across the app (ProtectedRoute, header button, cart gate, 401 from the
// api client) goes through AuthModalContext instead of each owning its own.
const GlobalLoginModal: React.FC = () => {
  const { isOpen, dismissLoginModal, completeLoginModal } = useAuthModal();
  return <LoginModal open={isOpen} onDismiss={dismissLoginModal} onSuccess={completeLoginModal} />;
};

export const Providers: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <AuthModalProvider>
          <CartProvider>
            <WishlistProvider>
              <SkinToneAdvisorProvider>
                <Outlet />
                <GlobalLoginModal />
              </SkinToneAdvisorProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthModalProvider>
      </AuthProvider>
    </ToastProvider>
  );
};
