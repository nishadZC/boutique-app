import React, { useEffect, useState } from 'react';
import { Grid, Skeleton } from '@mui/material';
import { ProductCard } from 'components/common';
import { useCart } from 'contexts/CartContext';
import { useWishlist } from 'contexts/WishlistContext';
import { productService } from 'services/productService';
import { ProductItem } from 'services/skinToneService';
import { Product } from 'types';

interface RecommendedProductsGridProps {
  items: ProductItem[];
}

// Renders recommended items as the same ProductCard used on the Products
// page - the recommendation API only returns a slim ProductItem (no
// inventory/description/rating), so the real product is looked up for each
// one before rendering.
const RecommendedProductsGrid: React.FC<RecommendedProductsGridProps> = ({ items }) => {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [products, setProducts] = useState<Product[] | null>(null);

  const ids = items.map(i => i.id).join(',');

  useEffect(() => {
    let cancelled = false;
    setProducts(null);
    Promise.all(items.map(item => productService.getById(item.id)))
      .then(result => { if (!cancelled) setProducts(result); })
      .catch(() => { if (!cancelled) setProducts([]); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  return (
    <Grid container spacing={3}>
      {products === null
        ? items.map(item => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={item.id}>
            <Skeleton variant="rectangular" sx={{ aspectRatio: '4 / 5', height: 'auto', bgcolor: '#1f1d1b' }} />
          </Grid>
        ))
        : products.map(product => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product.id}>
            <ProductCard
              product={product}
              tone="dark"
              onAddToCart={(p, size) => addItem(p, size)}
              onToggleWishlist={toggleWishlist}
              isInWishlist={isInWishlist(product.id)}
            />
          </Grid>
        ))
      }
    </Grid>
  );
};

export default RecommendedProductsGrid;
