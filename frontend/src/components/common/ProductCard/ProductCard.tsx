import React, { memo, useCallback } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import {
  Favorite as WishlistIcon,
  FavoriteBorder as WishlistBorderIcon,
  ShoppingBagOutlined as AddToCartIcon,
} from '@mui/icons-material';
import { Product } from '../../../types';
import { getHex } from '../../../constants/colors';
import { productRequiresSize } from '../../../utils/productSizing';
import styles from './ProductCard.module.css';

const LOW_STOCK_THRESHOLD = 5;
const FALLBACK_IMG = 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787585185/boutique/products/405dce7e-bed9-4d33-81c2-9a3045d65312.jpg';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, selectedSize?: string) => void;
  onToggleWishlist?: (productId: string) => void;
  isInWishlist?: boolean;
  variant?: 'grid' | 'list';
  /** 'dark' for the home page's dark sections, 'light' everywhere else. */
  tone?: 'light' | 'dark';
}

const formatPrice = (value: number) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const ProductCard = memo<ProductCardProps>(function ProductCard({
  product, onAddToCart, onToggleWishlist, isInWishlist = false, variant = 'grid', tone = 'light',
}) {
  const navigate = useNavigate();
  const stock = product.inventory_quantity ?? product.inventory ?? 0;
  const isOutOfStock = stock === 0;
  const needsSize = productRequiresSize(product);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = FALLBACK_IMG;
    e.currentTarget.onerror = null;
  }, []);

  const handleWishlist = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleWishlist?.(product.id);
  }, [onToggleWishlist, product.id]);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (needsSize) void navigate(`/products/${product.id}`);
    else onAddToCart(product, 'One Size');
  }, [navigate, needsSize, onAddToCart, product]);

  const price = typeof product.price === 'string' ? Number.parseFloat(product.price) : product.price;
  const origPrice = typeof product.originalPrice === 'string' ? Number.parseFloat(product.originalPrice ?? '0') : (product.originalPrice ?? 0);
  const discount = origPrice > price ? Math.round((1 - price / origPrice) * 100) : 0;

  return (
    <RouterLink
      to={`/products/${product.id}`}
      className={[
        styles.card,
        variant === 'list' ? styles.cardList : styles.cardGrid,
        tone === 'dark' ? styles.dark : styles.light,
      ].join(' ')}
    >
      <Box className={styles.imageWrapper}>
        <Box
          component="img"
          className={styles.image}
          src={product.imageUrl || FALLBACK_IMG}
          alt={product.name}
          loading="lazy"
          onError={handleImageError}
        />
        <Box className={styles.badges}>
          {product.isNew && <span className={styles.badge}>New</span>}
          {product.isHandcrafted && <span className={`${styles.badge} ${styles.badgeCraft}`}>Handcrafted</span>}
        </Box>
        {onToggleWishlist && (
          <Tooltip title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}>
            <IconButton onClick={handleWishlist} className={styles.wishlistBtn} size="small" aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}>
              {isInWishlist ? <WishlistIcon className={styles.wishlistActive} /> : <WishlistBorderIcon />}
            </IconButton>
          </Tooltip>
        )}
        {isOutOfStock
          ? <Box className={styles.soldOut}>Sold out</Box>
          : (
            <button type="button" onClick={handleAddToCart} className={styles.quickAdd}>
              <AddToCartIcon fontSize="inherit" />
              {needsSize ? 'Choose size' : 'Add to cart'}
            </button>
          )}
      </Box>

      <Box className={styles.content}>
        {product.brand && <Typography component="p" className={styles.brand}>{product.brand}</Typography>}
        <Typography component="h3" className={`${styles.name} ${variant === 'list' ? styles.nameList : ''}`}>
          {product.name}
        </Typography>
        {variant === 'list' && (
          <Typography component="p" className={styles.description}>{product.description}</Typography>
        )}
        <Box className={styles.priceRow}>
          <span className={styles.price}>{formatPrice(price || 0)}</span>
          {discount > 0 && <span className={styles.originalPrice}>{formatPrice(origPrice)}</span>}
        </Box>
        <Box className={styles.metaRow}>
          {product.color && (
            <Tooltip title={product.color}>
              <span className={styles.swatch} style={{ backgroundColor: getHex(product.color) }} aria-label={`Colour: ${product.color}`} />
            </Tooltip>
          )}
          {!isOutOfStock && stock <= LOW_STOCK_THRESHOLD && <span className={styles.lowStock}>Only {stock} left</span>}
        </Box>
      </Box>
    </RouterLink>
  );
});

export default ProductCard;
