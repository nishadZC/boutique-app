import React, { memo, useMemo, useRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container, Typography, Box, Button, Grid, IconButton, Breadcrumbs, Link, TextField,
  Accordion, AccordionSummary, AccordionDetails, Tooltip, Rating,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingBagOutlined as BagIcon,
  LocalShippingOutlined as ShippingIcon,
  CachedOutlined as ReturnsIcon,
  LockOutlined as SecureIcon,
  Favorite as WishlistFilledIcon,
  FavoriteBorder as WishlistIcon,
  ExpandMore as ExpandIcon,
  StraightenOutlined as MeasureIcon,
  ContentCutOutlined as TailorIcon,
  West as PrevIcon,
  East as NextIcon,
} from '@mui/icons-material';
import { getSizeOptions } from '../../utils/productSizing';
import { MEASUREMENT_LABELS, measurementExample } from '../../utils/measurements';
import { BRAND, getHex } from '../../constants/colors';
import { productsUrl } from '../../constants/navigation';
import { FREE_SHIPPING_THRESHOLD } from '../../constants/config';
import { ROUTES } from '../../constants/routes';
import LoadingSkeleton from '../../components/common/LoadingSkeleton/LoadingSkeleton';
import { ProductCard } from '../../components/common';
import { useProductDetail } from '../../hooks/useProductDetail';
import ProductGallery, { GalleryImage } from './ProductGallery';
import ProductReviews from './ProductReviews';
import styles from './ProductDetail.module.css';

const PROMISES = [
  { icon: <ShippingIcon />, title: 'Free shipping', desc: `On orders over ₹${FREE_SHIPPING_THRESHOLD}` },
  { icon: <ReturnsIcon />, title: 'Easy returns', desc: 'Within 30 days' },
  { icon: <SecureIcon />, title: 'Secure payment', desc: '100% protected' },
];

const toNumber = (value: number | string | undefined) => {
  const n = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  return Number.isFinite(n) ? n : 0;
};
const formatPrice = (value: number) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const ProductDetail: React.FC = memo(() => {
  const {
    product,
    loading,
    quantity,
    selectedSize,
    isCustomizing,
    customMeasurements,
    relatedProducts,
    garmentType,
    canTailor,
    isMadeToMeasure,
    tailoringFields,
    sizeGuideImages,
    navigate,
    handleAddToCart,
    handleQuantityChange,
    setSelectedSize,
    setIsCustomizing,
    setCustomMeasurements,
    toggleWishlist,
    isInWishlist,
    addItem,
    measurementLimits,
  } = useProductDetail();

  const railRef = useRef<HTMLDivElement>(null);
  const scrollRail = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (rail) rail.scrollBy({ left: direction * rail.clientWidth * 0.8, behavior: 'smooth' });
  };

  const galleryImages = useMemo<GalleryImage[]>(() => (product
    ? [{ src: product.imageUrl, alt: product.name }, ...sizeGuideImages.map(img => ({ ...img, isGuide: true }))]
    : []), [product, sizeGuideImages]);

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box className={styles.loadingBox}><LoadingSkeleton variant="detail" /></Box>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container maxWidth="md">
        <Box className={styles.notFoundBox}>
          <Typography variant="h4" gutterBottom>Product not found</Typography>
          <Button variant="contained" onClick={() => navigate(ROUTES.PRODUCTS)}>Back to Products</Button>
        </Box>
      </Container>
    );
  }

  const price = toNumber(product.price);
  const originalPrice = toNumber(product.originalPrice);
  const discount = originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0;
  const stock = product.inventory_quantity ?? product.inventory ?? 0;
  const isOutOfStock = stock === 0;
  const wishlisted = isInWishlist(product.id);
  const sizes = getSizeOptions(product);

  return (
    <Box className={styles.page}>
      <Container maxWidth="lg">
        <Breadcrumbs className={styles.breadcrumbs} aria-label="Breadcrumb">
          <Link component={RouterLink} to={ROUTES.HOME}>Home</Link>
          <Link component={RouterLink} to={productsUrl({ category: product.category })}>{product.category}</Link>
          <Typography color="text.primary" noWrap>{product.name}</Typography>
        </Breadcrumbs>

        <Grid container spacing={{ xs: 4, md: 7 }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <ProductGallery images={galleryImages} />
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Box className={styles.info}>
              <Box className={styles.badges}>
                {product.brand && <span className={styles.brand}>{product.brand}</span>}
                {product.isNew && <span className={styles.badge}>New</span>}
                {product.isHandcrafted && <span className={`${styles.badge} ${styles.badgeCraft}`}>Handcrafted</span>}
              </Box>

              <Typography variant="h1" className={styles.title}>{product.name}</Typography>
              {!!product.reviewCount && (
                <a href="#reviews" className={styles.ratingLink}>
                  <Rating value={product.rating ?? 0} precision={0.1} readOnly size="small" sx={{ color: BRAND.CHART_GOLD }} />
                  <span>{(product.rating ?? 0).toFixed(1)} · {product.reviewCount} review{product.reviewCount === 1 ? '' : 's'}</span>
                </a>
              )}

              <Box className={styles.priceRow}>
                <span className={styles.price}>{formatPrice(price)}</span>
                {discount > 0 && (
                  <>
                    <span className={styles.originalPrice}>{formatPrice(originalPrice)}</span>
                    <span className={styles.saving}>Save {discount}%</span>
                  </>
                )}
              </Box>
              <Typography className={styles.taxNote}>Inclusive of all taxes</Typography>

              <Typography className={styles.description}>{product.description}</Typography>

              {isMadeToMeasure && (
                <Box className={styles.craftNote}>
                  <TailorIcon fontSize="small" />
                  <Typography>
                    <strong>Made to measure available.</strong> Send us your measurements and our tailors will make this
                    piece for you{product.makingDays ? <> in about <strong>{product.makingDays} working days</strong> before it ships</> : null}.
                  </Typography>
                </Box>
              )}

              {product.color && (
                <Box className={styles.optionBlock}>
                  <Typography className={styles.optionLabel}>Colour: <span>{product.color}</span></Typography>
                  <Tooltip title={product.color}>
                    <span className={styles.colorSwatch} style={{ backgroundColor: getHex(product.color) }} aria-label={`Colour: ${product.color}`} />
                  </Tooltip>
                </Box>
              )}

              {!isOutOfStock && (
                <>
                  <Box className={styles.optionBlock}>
                    <Box className={styles.optionHeader}>
                      <Typography className={styles.optionLabel}>
                        Size{selectedSize && !isCustomizing ? <>: <span>{selectedSize}</span></> : null}
                      </Typography>
                      {canTailor && (
                        <button type="button" className={styles.linkButton} onClick={() => setIsCustomizing(!isCustomizing)}>
                          <MeasureIcon fontSize="inherit" />
                          {isCustomizing ? 'Choose a standard size' : isMadeToMeasure ? 'Made to measure' : 'Custom tailoring'}
                        </button>
                      )}
                    </Box>
                    <Box className={styles.sizeGrid} role="radiogroup" aria-label="Size">
                      {sizes.map(size => (
                        <button
                          key={size}
                          type="button"
                          role="radio"
                          aria-checked={selectedSize === size}
                          disabled={isCustomizing}
                          onClick={() => setSelectedSize(size)}
                          className={`${styles.sizeChip} ${selectedSize === size && !isCustomizing ? styles.sizeChipActive : ''}`}
                        >
                          {size}
                        </button>
                      ))}
                    </Box>
                  </Box>

                  {isCustomizing && (
                    <Box className={styles.customBox}>
                      <Typography className={styles.customTitle}>Your measurements (cm)</Typography>
                      <Grid container spacing={1.5}>
                        {tailoringFields.map(field => (
                          <Grid size={{ xs: 6 }} key={field}>
                            <TextField
                              size="small"
                              type="number"
                              label={`${MEASUREMENT_LABELS[field]} (cm)`}
                              placeholder={measurementExample(garmentType, field)}
                              value={customMeasurements[field]}
                              onChange={e => setCustomMeasurements({ ...customMeasurements, [field]: e.target.value })}
                              slotProps={{ htmlInput: { min: measurementLimits[field].min, max: measurementLimits[field].max, step: '0.01' } }}
                              helperText={`${measurementLimits[field].min}–${measurementLimits[field].max}`}
                              fullWidth
                            />
                          </Grid>
                        ))}
                      </Grid>
                      {isMadeToMeasure && product.makingDays && (
                        <Typography className={styles.customNote}>
                          Made to order: allow about {product.makingDays} working days for tailoring, then standard delivery.
                        </Typography>
                      )}
                    </Box>
                  )}
                </>
              )}

              <Box className={styles.purchaseRow}>
                {!isOutOfStock && (
                  <Box className={styles.quantity} aria-label="Quantity">
                    <IconButton size="small" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1} aria-label="Decrease quantity">
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <span aria-live="polite">{quantity}</span>
                    <IconButton size="small" onClick={() => handleQuantityChange(1)} disabled={quantity >= stock} aria-label="Increase quantity">
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  startIcon={<BagIcon />}
                  className={styles.addButton}
                >
                  {isOutOfStock ? 'Sold out' : 'Add to cart'}
                </Button>
                <Tooltip title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}>
                  <IconButton
                    onClick={() => toggleWishlist(product.id)}
                    aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    className={`${styles.wishlistButton} ${wishlisted ? styles.wishlistActive : ''}`}
                  >
                    {wishlisted ? <WishlistFilledIcon /> : <WishlistIcon />}
                  </IconButton>
                </Tooltip>
              </Box>
              {!isOutOfStock && stock <= 5 && <Typography className={styles.lowStock}>Only {stock} left — order soon</Typography>}

              <Box className={styles.promises}>
                {PROMISES.map(({ icon, title, desc }) => (
                  <Box key={title} className={styles.promise}>
                    {icon}
                    <Box>
                      <Typography className={styles.promiseTitle}>{title}</Typography>
                      <Typography className={styles.promiseDesc}>{desc}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>

              <Box className={styles.accordions}>
                <Accordion disableGutters elevation={0} className={styles.accordion}>
                  <AccordionSummary expandIcon={<ExpandIcon />}>Details</AccordionSummary>
                  <AccordionDetails>
                    <Box component="dl" className={styles.details}>
                      {product.brand && <><dt>Brand</dt><dd>{product.brand}</dd></>}
                      <dt>Category</dt><dd>{product.category}</dd>
                      {product.color && <><dt>Colour</dt><dd>{product.color}</dd></>}
                      {product.isHandcrafted && <><dt>Craft</dt><dd>Handcrafted in our atelier</dd></>}
                      {isMadeToMeasure && <><dt>Made to measure</dt><dd>{product.makingDays ? `Yes, about ${product.makingDays} working days` : 'Yes'}</dd></>}
                      <dt>Availability</dt><dd>{isOutOfStock ? 'Sold out' : 'In stock'}</dd>
                    </Box>
                  </AccordionDetails>
                </Accordion>
                <Accordion disableGutters elevation={0} className={styles.accordion}>
                  <AccordionSummary expandIcon={<ExpandIcon />}>Shipping &amp; returns</AccordionSummary>
                  <AccordionDetails>
                    <Box component="ul" className={styles.shippingList}>
                      <li>Free shipping on orders over ₹{FREE_SHIPPING_THRESHOLD}</li>
                      <li>Standard delivery in 5–7 business days</li>
                      <li>Express delivery in 2–3 business days</li>
                      <li>Easy returns within 30 days{isMadeToMeasure ? ' (standard sizes; made-to-measure pieces are altered free instead)' : ''}</li>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <ProductReviews productId={product.id} />

        {relatedProducts.length > 0 && (
          <Box component="section" className={styles.related}>
            <Box className={styles.relatedHeader}>
              <Box>
                <span className={styles.relatedEyebrow}>You may also like</span>
                <Typography variant="h2" className={styles.relatedTitle}>Top picks for you</Typography>
              </Box>
              <Box className={styles.relatedNav}>
                <IconButton aria-label="Scroll left" onClick={() => scrollRail(-1)} className={styles.relatedNavButton}><PrevIcon fontSize="small" /></IconButton>
                <IconButton aria-label="Scroll right" onClick={() => scrollRail(1)} className={styles.relatedNavButton}><NextIcon fontSize="small" /></IconButton>
              </Box>
            </Box>
            <Box ref={railRef} className={styles.rail}>
              {relatedProducts.map(related => (
                <Box key={related.id} className={styles.railItem}>
                  <ProductCard
                    product={related}
                    onAddToCart={addItem}
                    onToggleWishlist={toggleWishlist}
                    isInWishlist={isInWishlist(related.id)}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
});

export default ProductDetail;
