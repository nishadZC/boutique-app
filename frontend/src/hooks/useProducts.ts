import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product } from '../types';
import { productService } from '../services/productService';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { FilterOptions } from '../components/common/FilterPanel/FilterPanel';
import { ITEMS_PER_PAGE } from '../constants/config';

const SORT_OPTIONS = ['featured', 'price-low', 'price-high', 'name', 'newest'];

export function useProducts() {
  // ?category=, ?q=, ?sort= and ?handcrafted=1 let the header, footer and home page link
  // straight into a filtered view.
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCategory = searchParams.get('category') ?? '';
  const urlQuery = searchParams.get('q') ?? '';
  const urlHandcrafted = searchParams.get('handcrafted') === '1';
  const urlSort = SORT_OPTIONS.includes(searchParams.get('sort') ?? '') ? searchParams.get('sort')! : 'featured';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({
    priceRange: [0, 99999], category: '', brand: [], size: [], color: [], rating: 0, inStock: false, handcrafted: false,
  });
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [resetKey, setResetKey] = useState(0);

  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    setActiveFilters(prev => ({ priceRange: [0, prev.priceRange[1]], category: urlCategory, brand: [], size: [], color: [], rating: 0, inStock: false, handcrafted: urlHandcrafted }));
    setSearchQuery(urlQuery);
    setSortBy(urlSort);
    setPage(1);
    setResetKey(k => k + 1);
  }, [urlCategory, urlQuery, urlSort, urlHandcrafted]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    productService.getAll()
      .then(data => { if (!cancelled) setProducts(data); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    if (activeFilters.inStock) filtered = filtered.filter(p => (p.inventory_quantity ?? p.inventory ?? 0) > 0);
    if (activeFilters.priceRange[0] > 0 || activeFilters.priceRange[1] < 99999)
      filtered = filtered.filter(p => p.price >= activeFilters.priceRange[0] && p.price <= activeFilters.priceRange[1]);
    if (activeFilters.handcrafted) filtered = filtered.filter(p => p.isHandcrafted);
    if (activeFilters.category) filtered = filtered.filter(p => p.category === activeFilters.category);
    if (activeFilters.brand.length) filtered = filtered.filter(p => p.brand && activeFilters.brand.includes(p.brand));
    if (activeFilters.size.length) filtered = filtered.filter(p => p.sizes?.some(s => activeFilters.size.includes(s)));
    if (activeFilters.color.length) filtered = filtered.filter(p => p.color && activeFilters.color.some(c => p.color!.toLowerCase() === c.toLowerCase()));
    if (activeFilters.rating) filtered = filtered.filter(p => (p.rating ?? 0) >= activeFilters.rating);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':  return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'name':       return a.name.localeCompare(b.name);
        case 'newest':     return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        default:           return 0;
      }
    });
  }, [products, activeFilters, searchQuery, sortBy]);

  const categories = useMemo(() => [...new Set(products.map(p => p.category))], [products]);
  const brands     = useMemo(() => [...new Set(products.map(p => p.brand).filter(Boolean))] as string[], [products]);
  const sizes      = useMemo(() => [...new Set(products.flatMap(p => p.sizes ?? []))], [products]);
  const colors     = useMemo(() => [...new Set(products.map(p => p.color).filter(Boolean))] as string[], [products]);
  const maxPrice   = useMemo(() => Math.max(...products.map(p => p.price), 1000), [products]);
  const pageCount  = useMemo(() => Math.ceil(filteredProducts.length / ITEMS_PER_PAGE), [filteredProducts.length]);
  const pagedProducts = useMemo(() => filteredProducts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE), [filteredProducts, page]);

  const handleSearch = useCallback((q: string) => { setSearchQuery(q); setPage(1); }, []);
  const handleFilterChange = useCallback((f: FilterOptions) => { setActiveFilters(f); setPage(1); }, []);
  const handleSortChange = useCallback((s: string) => { setSortBy(s); setPage(1); }, []);
  const handlePageChange = useCallback((_: React.ChangeEvent<unknown>, v: number) => {
    setPage(v);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  const handleClearFilters = useCallback(() => {
    setActiveFilters({ priceRange: [0, maxPrice], category: '', brand: [], size: [], color: [], rating: 0, inStock: false, handcrafted: false });
    setSearchQuery('');
    setSortBy('featured');
    setPage(1);
    setResetKey(k => k + 1);
    setSearchParams({}, { replace: true });
  }, [maxPrice, setSearchParams]);
  const handleAddToCart  = useCallback((product: Product, size?: string) => addItem(product, size), [addItem]);
  const handleToggleWishlist = useCallback((id: string) => toggleWishlist(id), [toggleWishlist]);

  return {
    products, loading, filteredProducts, pagedProducts,
    searchQuery, sortBy, activeFilters, page, pageCount, viewMode, resetKey,
    categories, brands, sizes, colors, maxPrice,
    isInWishlist, handleSearch, handleSortChange, handleFilterChange,
    handlePageChange, handleClearFilters, handleAddToCart, handleToggleWishlist,
    setViewMode,
  };
}