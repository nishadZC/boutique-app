import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Skeleton } from '@mui/material';
import { East as ArrowIcon } from '@mui/icons-material';
import { ProductCard } from 'components/common';
import { useCart } from 'contexts/CartContext';
import { useWishlist } from 'contexts/WishlistContext';
import { productService } from 'services/productService';
import { OutfitCombination } from 'services/skinToneService';
import { Product } from 'types';
import { getHex } from '../../../constants/colors';
import styles from './OutfitCard.module.css';

interface OutfitCardProps {
  outfit: OutfitCombination;
  index: number;
  onSelect: () => void;
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

// Each outfit is a full-width row: a summary column (look number, the three
// pieces, total) beside the same ProductCard used on the Products page. Size
// selection for buying the whole outfit still lives in the shared
// OutfitConfigDialog, opened via "Select outfit".
const OutfitCard: React.FC<OutfitCardProps> = ({ outfit, index, onSelect }) => {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [products, setProducts] = useState<Product[] | null>(null);

  const pieces = [
    { role: 'Shirt', item: outfit.topwear },
    { role: 'Trousers', item: outfit.pants },
    { role: 'Shoes', item: outfit.shoes },
  ];

  useEffect(() => {
    let cancelled = false;
    setProducts(null);
    Promise.all(pieces.map(({ item }) => productService.getById(item.id)))
      .then(result => { if (!cancelled) setProducts(result); })
      .catch(() => { if (!cancelled) setProducts([]); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outfit.topwear.id, outfit.pants.id, outfit.shoes.id]);

  const total = pieces.reduce((sum, { item }) => sum + Number(item.price || 0), 0);
  const compareTotal = pieces.reduce((sum, { item }) => sum + Number(item.compare_price || item.price || 0), 0);
  const savings = compareTotal - total;

  return (
    <Box component="article" className={styles.outfit}>
      <Box className={styles.summary}>
        <Typography variant="overline" className={styles.lookLabel}>Look</Typography>
        <Typography className={styles.lookNumber}>{String(index + 1).padStart(2, '0')}</Typography>

        <Box component="ul" className={styles.pieces}>
          {pieces.map(({ role, item }) => (
            <li key={role} className={styles.piece}>
              <span className={styles.pieceDot} style={{ background: getHex(item.color) }} />
              <span className={styles.pieceRole}>{role}</span>
              <span className={styles.pieceColor}>{item.color}</span>
            </li>
          ))}
        </Box>

        <Box className={styles.totals}>
          <Typography className={styles.totalLabel}>Complete look</Typography>
          <Typography className={styles.totalValue}>{inr(total)}</Typography>
          {savings > 0 && <Typography className={styles.savings}>You save {inr(savings)}</Typography>}
        </Box>

        <Button endIcon={<ArrowIcon />} onClick={onSelect} className={styles.selectBtn}>
          Select outfit
        </Button>
      </Box>

      <Box className={styles.products}>
        {products === null
          ? pieces.map(({ item }) => <Skeleton key={item.id} variant="rectangular" className={styles.skeleton} />)
          : products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              tone="dark"
              onAddToCart={(p, size) => addItem(p, size)}
              onToggleWishlist={toggleWishlist}
              isInWishlist={isInWishlist(product.id)}
            />
          ))}
      </Box>
    </Box>
  );
};

export default OutfitCard;
