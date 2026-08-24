import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { wishlistService } from '../services/wishlistService';

interface WishlistContextValue {
  productIds: string[];
  loading: boolean;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [productIds, setProductIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setProductIds([]);
      return;
    }
    setLoading(true);
    wishlistService.getProductIds()
      .then(setProductIds)
      .catch(() => showToast('Unable to load your wishlist.', 'error'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, showToast]);

  const toggleWishlist = async (productId: string) => {
    if (!isAuthenticated) {
      showToast('Please sign in to manage your wishlist.', 'warning');
      return;
    }
    const included = productIds.includes(productId);
    if (included) {
      await wishlistService.remove(productId);
      setProductIds(current => current.filter(id => id !== productId));
      showToast('Removed from your wishlist.', 'info');
    } else {
      await wishlistService.add(productId);
      setProductIds(current => [...current, productId]);
      showToast('Added to your wishlist.', 'success');
    }
  };

  return <WishlistContext.Provider value={{ productIds, loading, isInWishlist: id => productIds.includes(id), toggleWishlist }}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
};
