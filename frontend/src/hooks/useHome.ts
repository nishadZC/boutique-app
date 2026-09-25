import { useState, useEffect, useCallback, useMemo } from 'react';
import { Product } from '../types';
import { productService } from '../services/productService';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { SHOP_CATEGORIES } from '../constants/navigation';

const ROW_COUNT = 6;

export interface HomeCategory {
  label: string;
  category: string;
  image?: string;
  /** The image is a curated lifestyle photo rather than a product shot. */
  curated: boolean;
  count: number;
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
      .then(data => { if (!cancelled) setProducts(data); })
      .catch(() => { if (!cancelled) setError('Failed to load products'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const inStock = useMemo(() => products.filter(p => (p.inventory_quantity ?? p.inventory ?? 0) > 0), [products]);

  // There are no sales figures in the API, so "best sellers" are the featured
  // products; new arrivals are the most recently added of the rest.
  const bestSellers = useMemo(() => inStock.filter(p => p.isNew).slice(0, ROW_COUNT), [inStock]);
  const newArrivals = useMemo(() => {
    const shown = new Set(bestSellers.map(p => p.id));
    return inStock
      .filter(p => !shown.has(p.id))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, ROW_COUNT);
  }, [inStock, bestSellers]);

  const categories = useMemo<HomeCategory[]>(() => SHOP_CATEGORIES.map(({ label, category, tileImage }) => {
    const inCategory = products.filter(p => p.category === category);
    return { label, category, count: inCategory.length, curated: !!tileImage, image: tileImage ?? inCategory.find(p => p.imageUrl)?.imageUrl };
  }), [products]);

  // A handcrafted piece whose photo is not already on a category tile.
  const handcraftedImage = useMemo(() => {
    const used = new Set(categories.map(c => c.image));
    const handcrafted = products.filter(p => p.isHandcrafted && p.imageUrl);
    return (handcrafted.find(p => !used.has(p.imageUrl)) ?? handcrafted[0])?.imageUrl;
  }, [products, categories]);

  const handleAddToCart = useCallback((product: Product, size?: string) => {
    addItem(product, size);
  }, [addItem]);

  const handleToggleWishlist = useCallback((productId: string) => {
    toggleWishlist(productId);
  }, [toggleWishlist]);

  return { bestSellers, newArrivals, categories, handcraftedImage, loading, error, isInWishlist, handleAddToCart, handleToggleWishlist };
}
