import React, { memo, useCallback } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Card, CardMedia, CardContent, CardActions,
  Typography, Button, Box, Chip, IconButton, Tooltip,
} from '@mui/material';
import {
  ShoppingCart as AddToCartIcon,
  Favorite as WishlistIcon,
  FavoriteBorder as WishlistBorderIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import { Product } from '../../../types';
import { productRequiresSize } from '../../../utils/productSizing';
import styles from './ProductCard.module.css';

const FALLBACK_IMG = 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787585185/boutique/products/405dce7e-bed9-4d33-81c2-9a3045d65312.jpg';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, selectedSize?: string) => void;
  onToggleWishlist?: (productId: string) => void;
  isInWishlist?: boolean;
  variant?: 'grid' | 'list';
}

const StarRating = memo(({ rating, count }: { rating: number; count: number }) => (
  <Box className={styles.ratingRow}>
    {[...Array(5)].map((_, i) =>
      i < rating
        ? <StarIcon key={i} className={styles.starFilled} />
        : <StarBorderIcon key={i} className={styles.starEmpty} />
    )}
    <Typography variant="caption" color="text.secondary">({count})</Typography>
  </Box>
));

const ProductCard = memo<ProductCardProps>(function ProductCard({
  product, onAddToCart, onToggleWishlist, isInWishlist = false, variant = 'grid',
}) {
  const navigate = useNavigate();
  const isOutOfStock = (product.inventory_quantity ?? product.inventory ?? 0) === 0;

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
    if (productRequiresSize(product)) {
      navigate(`/products/${product.id}`);
    } else {
      onAddToCart(product, 'One Size');
    }
  }, [navigate, onAddToCart, product]);

  const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
  const origPrice = typeof product.originalPrice === 'string' ? parseFloat(product.originalPrice ?? '0') : (product.originalPrice ?? 0);
  const formattedPrice = isNaN(price) ? '0.00' : price.toFixed(2);

  return (
    <Card
      component={RouterLink}
      to={`/products/${product.id}`}
      className={`${styles.card} ${variant === 'list' ? styles.cardList : styles.cardGrid}`}
    >
      <Box className={styles.imageWrapper}>
        <CardMedia
          component="img"
          className={`${styles.image} ${variant === 'list' ? styles.imageList : ''}`}
          image={product.imageUrl || FALLBACK_IMG}
          alt={product.name}
          onError={handleImageError}
        />
        {product.isNew && <Chip label="NEW" color="secondary" size="small" className={styles.badgeNew} />}
        {!!product.discountPercentage && <Chip label={`-${product.discountPercentage}%`} color="error" size="small" className={styles.badgeDiscount} />}
        {isOutOfStock && <Box className={styles.outOfStockOverlay}><Typography variant="h6" color="white" fontWeight="bold">OUT OF STOCK</Typography></Box>}
        {onToggleWishlist && (
          <Tooltip title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}>
            <IconButton
              onClick={handleWishlist}
              className={styles.wishlistBtn}
              size="small"
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 2,
                width: 36,
                height: 36,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                backgroundColor: '#fff',
                '&:hover': { backgroundColor: '#f5f5f5' },
              }}
            >
              {isInWishlist ? <WishlistIcon color="error" /> : <WishlistBorderIcon />}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <CardContent className={styles.content}>
        <Chip label={product.category} size="small" variant="outlined" className={styles.categoryChip} />
        <Typography variant="h6" component="h3" className={`${styles.name} ${variant === 'list' ? styles.nameList : ''}`}>
          {product.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" className={`${styles.description} ${variant === 'list' ? styles.descList : ''}`}>
          {product.description}
        </Typography>
        {!!product.rating && <StarRating rating={product.rating} count={product.reviewCount ?? 0} />}
        <Box className={styles.priceRow}>
          <Typography variant="h6" color="primary" fontWeight="bold" className={styles.price}>₹{formattedPrice}</Typography>
          {origPrice > price && (
            <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>₹{origPrice.toFixed(2)}</Typography>
          )}
        </Box>
        <Typography variant="caption" color="text.secondary">
          {isOutOfStock ? 'Out of stock' : `${product.inventory_quantity ?? product.inventory} in stock`}
        </Typography>
      </CardContent>

      <CardActions className={styles.actions}>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddToCartIcon />}
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          fullWidth
          className={styles.addBtn}
        >
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </CardActions>
    </Card>
  );
});

export default ProductCard;