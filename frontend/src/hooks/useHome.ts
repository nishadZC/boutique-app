import { useState, useEffect, useCallback } from 'react';
import { Product } from '../types';
import { productService } from '../services/productService';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function useHome() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    productService.getAll()
      .then(data => { if (!cancelled) setProducts(shuffle(data).slice(0, 8)); })
      .catch(() => { if (!cancelled) setError('Failed to load products'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleAddToCart = useCallback((product: Product, size?: string) => {
    addItem(product, size);
  }, [addItem]);

  const handleToggleWishlist = useCallback((productId: string) => {
    toggleWishlist(productId);
  }, [toggleWishlist]);

  return { products, loading, error, isInWishlist, handleAddToCart, handleToggleWishlist };
}