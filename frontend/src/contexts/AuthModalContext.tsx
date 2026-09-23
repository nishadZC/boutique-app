import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { AUTH_REQUIRED_EVENT } from '../constants/events';

interface AuthModalContextType {
  isOpen: boolean;
  // onDismiss fires only if the modal is closed (X / backdrop) without a
  // successful sign-in - e.g. so a protected page can navigate away.
  openLoginModal: (onDismiss?: () => void) => void;
  dismissLoginModal: () => void;
  completeLoginModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const AuthModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const onDismissRef = useRef<(() => void) | null>(null);

  const openLoginModal = useCallback((onDismiss?: () => void) => {
    onDismissRef.current = onDismiss ?? null;
    setIsOpen(true);
  }, []);

  const dismissLoginModal = useCallback(() => {
    setIsOpen(false);
    onDismissRef.current?.();
    onDismissRef.current = null;
  }, []);

  const completeLoginModal = useCallback(() => {
    onDismissRef.current = null;
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const handler = () => openLoginModal();
    window.addEventListener(AUTH_REQUIRED_EVENT, handler);
    return () => window.removeEventListener(AUTH_REQUIRED_EVENT, handler);
  }, [openLoginModal]);

  return (
    <AuthModalContext.Provider value={{ isOpen, openLoginModal, dismissLoginModal, completeLoginModal }}>
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = (): AuthModalContextType => {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};
