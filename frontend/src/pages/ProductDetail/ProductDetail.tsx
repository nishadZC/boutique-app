import React, { memo } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  IconButton,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Paper,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingBag as ShoppingBagIcon,
  LocalShipping as LocalShippingIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  FavoriteBorder as WishlistIcon,
} from '@mui/icons-material';
import { getSizeOptions } from '../../utils/productSizing';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { useProductDetail } from '../../hooks/useProductDetail';
import styles from './ProductDetail.module.css';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`product-tabpanel-${index}`}
      aria-labelledby={`product-tab-${index}`}
      {...other}
    >
      {value === index && <Box className={styles.container}>{children}</Box>}
    </div>
  );
}

const ProductDetail: React.FC = memo(() => {
  const {
    product,
    loading,
    quantity,
    tabValue,
    selectedSize,
    isCustomizing,
    customMeasurements,
    relatedProducts,
    isShirt,
    navigate,
    handleAddToCart,
    handleQuantityChange,
    handleTabChange,
    setSelectedSize,
    setIsCustomizing,
    setCustomMeasurements,
    toggleWishlist,
    isInWishlist
  } = useProductDetail();

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box className={styles.loadingBox}>
          <LoadingSkeleton variant="detail" />
        </Box>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container maxWidth="md">
        <Box className={styles.notFoundBox}>
          <Typography variant="h4" gutterBottom>
            Product not found
          </Typography>
          <Button variant="contained" onClick={() => navigate('/products')}>
            Back to Products
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box className={styles.container}>
        {/* Breadcrumbs */}
        <Breadcrumbs className={styles.breadcrumbs}>
          <Link component="button" variant="body1" onClick={() => navigate('/')}>
            Home
          </Link>
          <Link component="button" variant="body1" onClick={() => navigate('/products')}>
            Products
          </Link>
          <Typography variant="body1" color="text.primary">
            {product.name}
          </Typography>
        </Breadcrumbs>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={2} className={styles.imagePaper}>
              <CardMedia
                component="img"
                className={styles.productImage}
                image={product.imageUrl}
                alt={product.name}
              />
            </Paper>
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <Box className={styles.infoContainer}>
              {/* Product Info */}
              <Box className={styles.infoSection}>
                <Box className={styles.chipContainer}>
                  <Chip
                    label={product.category}
                    size="small"
                    variant="outlined"
                    className={styles.categoryChip}
                  />
                  {product.isNew && (
                    <Chip label="NEW" color="secondary" size="small" />
                  )}
                  {product.inventory <= 5 && product.inventory > 0 && (
                    <Chip label="Only a few left!" color="warning" size="small" />
                  )}
                </Box>
                
                <Typography variant="h3" component="h1" gutterBottom className={styles.title}>
                  {product.name}
                </Typography>
                
                {product.rating && (
                  <Box className={styles.ratingContainer}>
                    {[...Array(5)].map((_, index) => (
                      <StarIcon
                        key={index}
                        className={styles.starIcon}
                        style={{ color: index < product.rating! ? '#ffc107' : '#e0e0e0' }}
                      />
                    ))}
                    <Typography variant="body2" color="text.secondary">
                      ({product.reviewCount || 0} reviews)
                    </Typography>
                  </Box>
                )}
                
                <Box className={styles.priceContainer}>
                  <Typography variant="h4" color="primary" className={styles.price}>
                    ₹{(() => {
                      const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
                      return isNaN(price) || !isFinite(price) ? '0.00' : price.toFixed(2);
                    })()}
                  </Typography>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <Typography variant="h6" color="text.secondary" className={styles.originalPrice}>
                      ₹{(() => {
                        const price = typeof product.originalPrice === 'string' ? parseFloat(product.originalPrice) : product.originalPrice;
                        return isNaN(price) || !isFinite(price) ? '0.00' : price.toFixed(2);
                      })()}
                    </Typography>
                  )}
                  {product.discountPercentage && product.discountPercentage > 0 && (
                    <Chip
                      label={`-${product.discountPercentage}%`}
                      color="error"
                      size="small"
                    />
                  )}
                </Box>
                
                <Typography variant="body1" color="text.secondary" paragraph className={styles.description}>
                  {product.description}
                </Typography>
                
                <Box className={styles.featuresBox}>
                  <Box className={styles.featureItem}>
                    <LocalShippingIcon color="action" />
                    <Typography variant="body2">Free shipping over ₹500</Typography>
                  </Box>
                  <Box className={styles.featureItem}>
                    <RefreshIcon color="action" />
                    <Typography variant="body2">30-day returns</Typography>
                  </Box>
                  <Box className={styles.featureItem}>
                    <SecurityIcon color="action" />
                    <Typography variant="body2">Secure payment</Typography>
                  </Box>
                </Box>
              </Box>
              
              {/* Purchase Controls */}
              <Paper elevation={1} className={styles.purchasePaper}>
                {product.inventory === 0 ? (
                  <Typography variant="h6" color="error" gutterBottom>
                    Out of Stock
                  </Typography>
                ) : (
                  <>
                    <Box className={styles.sizeContainer}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="product-size-label">Size</InputLabel>
                        <Select
                          labelId="product-size-label"
                          value={selectedSize}
                          label="Size"
                          onChange={(event) => setSelectedSize(event.target.value as string)}
                          disabled={isCustomizing}
                        >
                          {getSizeOptions(product).map((size) => (
                            <MenuItem value={size} key={size}>{size}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      
                      {isShirt && (
                        <Button
                          variant={isCustomizing ? "contained" : "outlined"}
                          onClick={() => setIsCustomizing(!isCustomizing)}
                          className={isCustomizing ? styles.customizeButtonActive : styles.customizeButtonInactive}
                        >
                          {isCustomizing ? 'Cancel' : 'Customize'}
                        </Button>
                      )}
                    </Box>

                    {isCustomizing && (
                      <Box className={styles.customMeasurementsBox}>
                        <Typography variant="subtitle2" className={styles.customMeasurementsTitle}>
                          Enter your exact measurements (cm)
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <TextField 
                              size="small" 
                              label="Shoulder (cm)" 
                              placeholder="e.g. 45"
                              value={customMeasurements.shoulder}
                              onChange={(e) => setCustomMeasurements({...customMeasurements, shoulder: e.target.value})}
                              fullWidth
                              InputProps={{ className: styles.textFieldInput }}
                            />
                          </Grid>
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <TextField 
                              size="small" 
                              label="Chest (cm)" 
                              placeholder="e.g. 100"
                              value={customMeasurements.chest}
                              onChange={(e) => setCustomMeasurements({...customMeasurements, chest: e.target.value})}
                              fullWidth
                              InputProps={{ className: styles.textFieldInput }}
                            />
                          </Grid>
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <TextField 
                              size="small" 
                              label="Sleeve (cm)" 
                              placeholder="e.g. 64"
                              value={customMeasurements.sleeve}
                              onChange={(e) => setCustomMeasurements({...customMeasurements, sleeve: e.target.value})}
                              fullWidth
                              InputProps={{ className: styles.textFieldInput }}
                            />
                          </Grid>
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <TextField 
                              size="small" 
                              label="Neck (cm)" 
                              placeholder="e.g. 40"
                              value={customMeasurements.neck}
                              onChange={(e) => setCustomMeasurements({...customMeasurements, neck: e.target.value})}
                              fullWidth
                              InputProps={{ className: styles.textFieldInput }}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                    <Box className={styles.quantityBox}>
                      <Typography variant="body1" className={styles.quantityLabel}>
                        Quantity:
                      </Typography>
                      <Box className={styles.quantityControls}>
                        <IconButton
                          onClick={() => handleQuantityChange(-1)}
                          disabled={quantity <= 1}
                          className={styles.quantityButton}
                        >
                          <RemoveIcon />
                        </IconButton>
                        <Typography variant="body1" className={styles.quantityValue}>
                          {quantity}
                        </Typography>
                        <IconButton
                          onClick={() => handleQuantityChange(1)}
                          disabled={quantity >= product.inventory}
                          className={styles.quantityButton}
                        >
                          <AddIcon />
                        </IconButton>
                      </Box>
                      <Typography variant="body2" color="text.secondary" className={styles.inventoryStatus}>
                        {product.inventory} available
                      </Typography>
                    </Box>
                  </>
                )}
                
                <Box className={styles.actionsContainer}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleAddToCart}
                    disabled={product.inventory === 0}
                    startIcon={<ShoppingBagIcon />}
                    className={styles.addToCartButton}
                  >
                    {product.inventory === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </Button>
                  
                  <IconButton
                    onClick={() => toggleWishlist(product.id)}
                    color={isInWishlist(product.id) ? 'error' : 'default'}
                    aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                    className={styles.wishlistButton}
                  >
                    <WishlistIcon />
                  </IconButton>
                </Box>
                
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/cart')}
                  fullWidth
                  className={styles.viewCartButton}
                >
                  View Cart
                </Button>
              </Paper>
              
              {/* Additional Info */}
              <Box className={styles.additionalInfo}>
                <Typography variant="body2" color="text.secondary">
                  SKU: {product.id}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Category: {product.category}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Product Details Tabs */}
        <Box className={styles.tabsContainer}>
          <Paper elevation={2} className={styles.tabsPaper}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              className={styles.tabsList}
            >
              <Tab label="Description" />
              <Tab label="Details" />
              <Tab label="Reviews" />
              <Tab label="Shipping" />
              {isShirt && <Tab label="Size Guide" />}
            </Tabs>
            
            <Box className={styles.tabPanelContent}>
              <TabPanel value={tabValue} index={0}>
                <Typography variant="body1" paragraph className={styles.tabText}>
                  {product.description}
                </Typography>
                <Typography variant="body1" paragraph className={styles.tabText}>
                  Experience the perfect blend of luxury and functionality with this premium product. 
                  Crafted with attention to detail and using only the finest materials, this piece 
                  exemplifies excellence in design and quality.
                </Typography>
              </TabPanel>
              
              <TabPanel value={tabValue} index={1}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Product ID:</Typography>
                    <Typography variant="body1" paragraph>{product.id}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Category:</Typography>
                    <Typography variant="body1" paragraph>{product.category}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Availability:</Typography>
                    <Typography variant="body1" paragraph>
                      {product.inventory > 0 ? 'In Stock' : 'Out of Stock'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Shipping:</Typography>
                    <Typography variant="body1" paragraph>Free over ₹500</Typography>
                  </Grid>
                </Grid>
              </TabPanel>
              
              <TabPanel value={tabValue} index={2}>
                <Typography variant="body1" paragraph>
                  No reviews yet. Be the first to review this product!
                </Typography>
                <Button variant="outlined">Write a Review</Button>
              </TabPanel>
              
              <TabPanel value={tabValue} index={3}>
                <Typography variant="h6" gutterBottom>Shipping Information</Typography>
                <Typography variant="body1" paragraph>
                  • Free shipping on orders over ₹500<br/>
                  • Standard shipping: 5-7 business days<br/>
                  • Express shipping: 2-3 business days<br/>
                  • International shipping available<br/>
                  • 30-day return policy
                </Typography>
              </TabPanel>

              {isShirt && (
                <TabPanel value={tabValue} index={4}>
                  <Typography variant="h6" gutterBottom>Shirt Size & Measurement Guide</Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Use our detailed charts below to find your perfect fit. For the best accuracy, measure a shirt you already own that fits well.
                  </Typography>
                  <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box sx={{ border: '1px solid #eaeaea', borderRadius: 2, overflow: 'hidden' }}>
                        <img 
                          src="/images/size_chart.jpg" 
                          alt="Size Chart" 
                          style={{ width: '100%', display: 'block' }} 
                        />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box sx={{ border: '1px solid #eaeaea', borderRadius: 2, overflow: 'hidden' }}>
                        <img 
                          src="/images/measurement_guide.jpg" 
                          alt="Measurement Guide" 
                          style={{ width: '100%', display: 'block' }} 
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </TabPanel>
              )}
            </Box>
          </Paper>
        </Box>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <Box className={styles.relatedProductsContainer}>
            <Typography variant="h4" gutterBottom>
              Related Products
            </Typography>
            <Grid container spacing={3}>
              {relatedProducts.map((relatedProduct) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={relatedProduct.id}>
                  <Card className={styles.relatedProductCard}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={relatedProduct.imageUrl}
                      alt={relatedProduct.name}
                    />
                    <CardContent>
                      <Typography variant="h6">{relatedProduct.name}</Typography>
                      <Typography variant="h6" color="primary">
                        ₹{(() => {
                          const price = typeof relatedProduct.price === 'string' ? parseFloat(relatedProduct.price) : relatedProduct.price;
                          return isNaN(price) || !isFinite(price) ? '0.00' : price.toFixed(2);
                        })()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>
    </Container>
  );
});

export default ProductDetail;