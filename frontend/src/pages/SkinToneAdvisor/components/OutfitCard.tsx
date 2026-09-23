import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Button, Skeleton } from '@mui/material';
import { ShoppingBag as BagIcon } from '@mui/icons-material';
import { ProductCard } from 'components/common';
import { useCart } from 'contexts/CartContext';
import { useWishlist } from 'contexts/WishlistContext';
import { productService } from 'services/productService';
import { OutfitCombination } from 'services/skinToneService';
import { Product } from 'types';

interface OutfitCardProps {
  outfit: OutfitCombination;
  index: number;
  onSelect: () => void;
}

// Shows each outfit item as the same ProductCard used on the Products page,
// so an outfit reads as a normal product grid rather than a custom tile
// layout. Size selection for buying the whole outfit together still lives
// in the single shared OutfitConfigDialog, opened via "Select Outfit".
const OutfitCard: React.FC<OutfitCardProps> = ({ outfit, index, onSelect }) => {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [products, setProducts] = useState<Product[] | null>(null);

  const itemIds = [outfit.topwear.id, outfit.pants.id, outfit.shoes.id];

  useEffect(() => {
    let cancelled = false;
    setProducts(null);
    Promise.all(itemIds.map(id => productService.getById(id)))
      .then(result => { if (!cancelled) setProducts(result); })
      .catch(() => { if (!cancelled) setProducts([]); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outfit.topwear.id, outfit.pants.id, outfit.shoes.id]);

  const total = Number(outfit.topwear.price || 0) + Number(outfit.pants.price || 0) + Number(outfit.shoes.price || 0);

  return (
    <Box sx={{ maxWidth: 900 }}>
      <Typography variant="overline" sx={{ color: '#888', fontWeight: 600, letterSpacing: 1.5 }}>
        OUTFIT {index + 1}
      </Typography>

      <Grid container spacing={2} sx={{ mt: 0.5, mb: 2 }}>
        {products === null
          ? itemIds.map(id => (
            <Grid size={{ xs: 12, sm: 4 }} key={id}>
              <Skeleton variant="rounded" height={320} />
            </Grid>
          ))
          : products.map(product => (
            <Grid size={{ xs: 12, sm: 4 }} key={product.id}>
              <ProductCard
                product={product}
                onAddToCart={(p, size) => addItem(p, size)}
                onToggleWishlist={toggleWishlist}
                isInWishlist={isInWishlist(product.id)}
              />
            </Grid>
          ))
        }
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1 }}>
        <Typography variant="body1" sx={{ color: '#555', fontWeight: 500 }}>
          Total: <Box component="span" sx={{ color: '#1a1a1a', fontWeight: 700, ml: 0.5 }}>₹{total.toLocaleString('en-IN')}</Box>
        </Typography>
        <Button
          size="large"
          variant="contained"
          startIcon={<BagIcon sx={{ fontSize: 20 }} />}
          onClick={onSelect}
          sx={{
            py: 1.25, px: 4, background: '#d4af37', color: '#000',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '1rem',
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': { background: '#b8941f', boxShadow: 'none' }
          }}
        >
          Select Outfit
        </Button>
      </Box>
    </Box>
  );
};

export default OutfitCard;
