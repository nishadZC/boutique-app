import React, { memo } from 'react';
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
import styles from './Cart.module.css';

const Cart: React.FC = memo(() => {
  const {
    items,
    fallbackImage,
    addressFields,
    setAddressFields,
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
  } = useCartPage();

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
            <Paper elevation={0} className={styles.cartItemsPaper}>
              {items.map((item, index) => (
                <Box key={`${item.id}-${item.selectedSize || 'one-size'}`}>
                  <Box className={styles.cartItemBox}>
                    <Grid container spacing={3} alignItems="center">
                      <Grid size={{ xs: 12, sm: 2 }}>
                        <CardMedia
                          component="img"
                          className={styles.cartItemMedia}
                          image={item.imageUrl || fallbackImage}
                          onError={(event) => {
                            if (event.currentTarget.src !== fallbackImage) event.currentTarget.src = fallbackImage;
                          }}
                          alt={item.name}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 5 }}>
                        <Typography variant="h6" className={styles.itemTitle}>
                          {item.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" className={styles.itemCategory}>
                          {item.category}
                        </Typography>
                        <Typography variant="body1" color="primary" className={styles.itemPriceText}>
                          ₹{typeof item.price === 'string' ? parseFloat(item.price).toFixed(2) : item.price.toFixed(2)} each
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 3 }}>
                        <Box className={styles.quantityBox}>
                          <IconButton
                            onClick={() => handleQuantityChange(item.id, -1, item.selectedSize)}
                            disabled={item.quantity <= 1}
                            className={styles.quantityIconButton}
                          >
                            <RemoveIcon />
                          </IconButton>
                          <Typography className={styles.quantityText}>
                            {item.quantity}
                          </Typography>
                          <IconButton
                            onClick={() => handleQuantityChange(item.id, 1, item.selectedSize)}
                            disabled={item.quantity >= item.inventory}
                            className={styles.quantityIconButton}
                          >
                            <AddIcon />
                          </IconButton>
                        </Box>
                        {item.inventory <= 5 && item.inventory > 0 && (
                          <Typography variant="caption" color="warning.main">
                            Only {item.inventory} left in stock!
                          </Typography>
                        )}
                      </Grid>

                      <Grid size={{ xs: 12, sm: 2 }}>
                        <Box className={styles.itemTotalBox}>
                          <Typography variant="h6" className={styles.itemTotalPrice}>
                            ₹{((typeof item.price === 'string' ? parseFloat(item.price) : item.price) * item.quantity).toFixed(2)}
                          </Typography>
                          <IconButton
                            onClick={() => handleRemoveItem(item.id, item.name, item.selectedSize)}
                            color="error"
                            className={styles.removeButton}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                  {index < items.length - 1 && <Divider />}
                </Box>
              ))}
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
                                {formatAddress(saved.fields)} | {saved.phone || 'No phone saved'}
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
                  required
                  fullWidth
                  value={phone}
                  onChange={event => setPhone(event.target.value)}
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
              </Box>

              <Box className={styles.checkoutButtonBox}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
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