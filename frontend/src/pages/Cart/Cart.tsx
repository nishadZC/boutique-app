import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  CardMedia,
  IconButton,
  Grid,
  Paper,
  Divider,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingBag as ShoppingBagIcon,
  LocalShipping as ShippingIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { AddressForm } from '../../components/AddressForm/AddressForm';
import { formatAddress } from '../../types/address';
import { useCartPage } from '../../hooks/useCartPage';
import { formatPhone, getPhoneError, PHONE_MAX_INPUT_LENGTH } from '../../utils/validation';
import { estimatedDeliveryDate, formatDeliveryDate } from '../../utils/delivery';
import styles from './Cart.module.css';

const Cart: React.FC = memo(() => {
  const {
    items,
    fallbackImage,
    addressFields,
    setAddressFields,
    addressComplete,
    phone,
    setPhone,
    savedAddresses,
    selectedAddressId,
    setSelectedAddressId,
    addressError,
    finalTotal,
    isCheckingOut,
    handleCheckout,
    selectSavedAddress,
    handleQuantityChange,
    handleRemoveItem,
    clearCart,
    subtotal,
    shipping,
    tax,
    unselectedKeys,
    toggleItemSelection,
    toggleAllSelection,
    selectedCartItems,
    getItemKey,
  } = useCartPage();
  const [phoneTouched, setPhoneTouched] = React.useState(false);
  const phoneError = getPhoneError(phone);
  const showPhoneError = phoneTouched && !!phoneError;

  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <Container maxWidth="md">
        <Box className={styles.emptyCartBox}>
          <ShoppingBagIcon className={styles.emptyCartIcon} />
          <Typography variant="h3" component="h1" gutterBottom>
            Your Cart is Empty
          </Typography>
          <Typography variant="h6" color="text.secondary" paragraph className={styles.emptyCartText}>
            Looks like you haven't added any products to your cart yet.
          </Typography>
          <Button
            variant="contained"
            size="large"
            href="/products"
            className={styles.emptyCartButton}
          >
            Start Shopping
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box className={styles.cartContainer}>
        <Typography variant="h3" component="h1" gutterBottom>
          Shopping Cart
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          {items.length} {items.length === 1 ? 'Item' : 'Items'} in your cart
        </Typography>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper elevation={0} className={styles.cartItemsPaper} sx={{ p: 0, overflow: 'hidden' }}>
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.08)', bgcolor: '#fafafa' }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {items.length - unselectedKeys.size} of {items.length} Selected
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={toggleAllSelection}
                  sx={{
                    color: '#1a1a1a',
                    borderColor: '#ccc',
                    borderRadius: '6px',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': { borderColor: '#1a1a1a', bgcolor: 'rgba(0,0,0,0.02)' }
                  }}
                >
                  {unselectedKeys.size === 0 && items.length > 0 ? 'Deselect All' : 'Select All'}
                </Button>
              </Box>

              <Box sx={{ p: 2 }}>
                {items.map((item) => (
                  <Box key={`${item.id}-${item.selectedSize || 'one-size'}`} sx={{ mb: 3 }}>
                    <Box className={styles.cartItemBox} sx={{ p: 0, overflow: 'hidden' }}>
                      <Box sx={{ display: 'flex', gap: 3, p: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                        <Box onClick={() => navigate(`/products/${item.id}`)} sx={{ cursor: 'pointer', flexShrink: 0 }}>
                          <CardMedia
                            component="img"
                            className={styles.cartItemMedia}
                            sx={{ width: { xs: 100, sm: 120 }, height: { xs: 100, sm: 120 } }}
                            image={item.imageUrl || fallbackImage}
                            onError={(event) => {
                              if (event.currentTarget.src !== fallbackImage) event.currentTarget.src = fallbackImage;
                            }}
                            alt={item.name}
                          />
                        </Box>

                        <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Box>
                              <Typography variant="h6" className={styles.itemTitle} noWrap sx={{ cursor: 'pointer', mb: 0.5, '&:hover': { color: 'primary.main' } }} onClick={() => navigate(`/products/${item.id}`)}>
                                {item.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" className={styles.itemCategory}>
                                {item.category} {item.selectedSize && `| Size: ${item.selectedSize}`}
                              </Typography>
                            </Box>
                            <Typography variant="h6" className={styles.itemTotalPrice} sx={{ pl: 2 }}>
                              ₹{((typeof item.price === 'string' ? Number.parseFloat(item.price) : item.price) * item.quantity).toFixed(2)}
                            </Typography>
                          </Box>

                          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', md: '-webkit-box' }, WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 2 }}>
                            {item.shortDescription || item.description || 'Premium quality product.'}
                          </Typography>

                          <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Qty:</Typography>
                            <Box className={styles.quantityBox}>
                              <IconButton onClick={() => handleQuantityChange(item.id, -1, item.selectedSize)} disabled={item.quantity <= 1} size="small" sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                              <Typography sx={{ fontWeight: 600, minWidth: '1.5rem', textAlign: 'center' }}>{item.quantity}</Typography>
                              <IconButton onClick={() => handleQuantityChange(item.id, 1, item.selectedSize)} disabled={item.quantity >= item.inventory} size="small" sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Box>
                            {item.inventory <= 5 && item.inventory > 0 && (
                              <Typography variant="caption" color="warning.main" sx={{ ml: 2, fontWeight: 500 }}>
                                Only {item.inventory} left!
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>

                      {/* Bottom Actions */}
                      <Box sx={{ display: 'flex', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.08)', bgcolor: '#fafafa' }}>
                        <Button
                          fullWidth
                          sx={{ py: 1.5, borderRadius: 0, color: 'error.main', fontWeight: 600, borderRight: '1px solid rgba(0,0,0,0.08)', '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.04)' } }}
                          onClick={() => handleRemoveItem(item.id, item.name, item.selectedSize)}
                          startIcon={<DeleteIcon fontSize="small" />}
                        >
                          REMOVE
                        </Button>
                        <Button
                          fullWidth
                          sx={{
                            py: 1.5, borderRadius: 0, fontWeight: 600,
                            color: !unselectedKeys.has(getItemKey(item.id, item.selectedSize)) ? '#1a1a1a' : 'text.secondary',
                            bgcolor: !unselectedKeys.has(getItemKey(item.id, item.selectedSize)) ? 'rgba(0,0,0,0.03)' : 'transparent',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.06)' }
                          }}
                          onClick={() => toggleItemSelection(item.id, item.selectedSize)}
                        >
                          {!unselectedKeys.has(getItemKey(item.id, item.selectedSize)) ? 'SELECTED' : 'SELECT'}
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>

            <Box className={styles.cartActionsBox}>
              <Button
                variant="outlined"
                href="/products"
                className={styles.actionButton}
              >
                Continue Shopping
              </Button>
              <Button
                variant="outlined"
                onClick={clearCart}
                color="error"
                className={styles.actionButton}
              >
                Clear Cart
              </Button>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={0} className={styles.orderSummaryPaper}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                Order Summary
              </Typography>

              <Box className={styles.summarySection}>
                <Box className={styles.summaryRow}>
                  <Typography variant="body1">Subtotal:</Typography>
                  <Typography variant="body1">₹{subtotal.toFixed(2)}</Typography>
                </Box>

                <Box className={styles.summaryRow}>
                  <Box className={styles.summaryRowWithIcon}>
                    <ShippingIcon fontSize="small" />
                    <Typography variant="body1">Shipping:</Typography>
                  </Box>
                  <Typography variant="body1">
                    {shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}
                  </Typography>
                </Box>

                {shipping > 0 && (
                  <Typography variant="caption" color="text.secondary" className={styles.freeShippingText}>
                    Add ₹{(500 - subtotal).toFixed(2)} more for free shipping
                  </Typography>
                )}

                <Box className={styles.summaryRow}>
                  <Typography variant="body1">Delivery by:</Typography>
                  <Typography variant="body1">{formatDeliveryDate(estimatedDeliveryDate())}</Typography>
                </Box>

                <Box className={styles.summaryRow}>
                  <Typography variant="body1">Tax:</Typography>
                  <Typography variant="body1">₹{tax.toFixed(2)}</Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box className={styles.totalRow}>
                  <Typography variant="h6" className={styles.totalText}>
                    Total:
                  </Typography>
                  <Typography variant="h6" className={styles.totalAmount}>
                    ₹{finalTotal.toFixed(2)}
                  </Typography>
                </Box>
              </Box>

              <Box className={styles.summarySection}>
                <Typography variant="subtitle2" gutterBottom>
                  Shipping Address
                </Typography>
                {savedAddresses.length > 0 && (
                  <FormControl fullWidth className={styles.addressFormControl}>
                    <RadioGroup value={selectedAddressId}>
                      {savedAddresses.map(saved => (
                        <FormControlLabel
                          key={saved.id}
                          value={saved.id}
                          control={<Radio />}
                          onChange={() => selectSavedAddress(saved)}
                          label={
                            <Box className={styles.radioLabelBox}>
                              <Typography variant="body2" fontWeight={600}>{saved.label}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatAddress(saved.fields)} | {saved.phone ? formatPhone(saved.phone) : 'No phone saved'}
                              </Typography>
                            </Box>
                          }
                          className={styles.radioLabelAddress}
                        />
                      ))}
                      <FormControlLabel
                        value="current"
                        control={<Radio />}
                        onChange={() => setSelectedAddressId('current')}
                        label="Enter a new delivery address"
                      />
                    </RadioGroup>
                  </FormControl>
                )}
                <TextField
                  label="Phone Number"
                  type="tel"
                  required
                  fullWidth
                  value={phone}
                  onChange={event => setPhone(event.target.value)}
                  onBlur={() => { if (phone.trim()) setPhoneTouched(true); }}
                  error={showPhoneError}
                  helperText={showPhoneError ? phoneError : 'For delivery updates, e.g. 98765 43210'}
                  autoComplete="tel"
                  slotProps={{ htmlInput: { inputMode: 'tel', maxLength: PHONE_MAX_INPUT_LENGTH } }}
                  className={styles.phoneField}
                  sx={{ mb: 3 }}
                />
                <AddressForm
                  value={addressFields}
                  onChange={value => {
                    setSelectedAddressId('current');
                    setAddressFields(value);
                  }}
                />
                {addressError && <Typography variant="caption" color="error">{addressError}</Typography>}
                {!addressError && !addressComplete && (
                  <Typography variant="caption" color="text.secondary">
                    Fill in all address fields to proceed to checkout.
                  </Typography>
                )}
              </Box>

              <Box className={styles.checkoutButtonBox}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handleCheckout}
                  disabled={isCheckingOut || selectedCartItems.length === 0 || !!phoneError || !addressComplete}
                  className={styles.checkoutButton}
                >
                  Proceed to Checkout
                </Button>
              </Box>

              <Box className={styles.secureCheckoutBox}>
                <SecurityIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  Secure Checkout Process
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
});

export default Cart;
