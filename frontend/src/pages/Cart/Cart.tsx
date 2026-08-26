import React, { useState } from 'react';
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
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useCheckout } from '../../hooks/useCheckout';
import { calculateCartTotals } from '../../utils/cartPricing';
import { AddressForm } from '../../components/AddressForm/AddressForm';
import { addressFromString, formatAddress, AddressFields, SavedAddress } from '../../types/address';
const Cart: React.FC = () => {
  const { items, removeItem, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [addressFields, setAddressFields] = useState<AddressFields>(() => addressFromString(user?.address));
  const [phone, setPhone] = useState(user?.phone || '');
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('current');
  const address = formatAddress(addressFields);
  const [addressError, setAddressError] = useState('');
  const savedAddressKey = user ? `savedAddresses:${user.id}` : '';
  const fallbackImage = 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787585185/boutique/products/405dce7e-bed9-4d33-81c2-9a3045d65312.jpg';

  const saveCurrentAddress = () => {
    if (!user || !address.trim() || !phone.trim()) return;
    const nextAddress: SavedAddress = {
      id: `${Date.now()}`,
      label: savedAddresses.length === 0 ? 'Primary address' : `Address ${savedAddresses.length + 1}`,
      fields: addressFields,
      phone,
    };
    const withoutDuplicate = savedAddresses.filter(saved => formatAddress(saved.fields) !== address || saved.phone !== phone);
    const nextAddresses = [...withoutDuplicate, nextAddress];
    localStorage.setItem(savedAddressKey, JSON.stringify(nextAddresses));
    setSavedAddresses(nextAddresses);
  };

  const { finalTotal, isCheckingOut, handleCheckout } = useCheckout({
    address,
    phone,
    setAddressError,
    onAddressSaved: saveCurrentAddress,
  });

  React.useEffect(() => {
    if (!user) return;
    setPhone(user.phone || '');
    const stored = localStorage.getItem(`savedAddresses:${user.id}`);
    let parsed: SavedAddress[] = [];
    try {
      parsed = stored ? JSON.parse(stored) : [];
    } catch {
      localStorage.removeItem(`savedAddresses:${user.id}`);
    }
    if (parsed.length > 0) {
      setSavedAddresses(parsed);
    } else if (user.address) {
      setSavedAddresses([{
        id: 'profile-address',
        label: 'Profile address',
        fields: addressFromString(user.address),
        phone: user.phone || '',
      }]);
    }
    if (user.address && !formatAddress(addressFields)) setAddressFields(addressFromString(user.address));
  }, [user]);

  const selectSavedAddress = (saved: SavedAddress) => {
    setSelectedAddressId(saved.id);
    setAddressFields(saved.fields);
    setPhone(saved.phone);
    setAddressError('');
  };

  const handleQuantityChange = (productId: string, delta: number, selectedSize?: string) => {
    const item = items.find(item => item.id === productId && item.selectedSize === selectedSize);
    if (item) {
      const newQuantity = item.quantity + delta;
      if (newQuantity >= 1 && newQuantity <= item.inventory) {
        updateQuantity(productId, selectedSize, newQuantity);
      }
    }
  };

  const handleRemoveItem = (productId: string, productName: string, selectedSize?: string) => {
    removeItem(productId, selectedSize);
    showToast(`${productName} removed from your cart.`, 'info');
  };

  if (items.length === 0) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <ShoppingBagIcon sx={{ fontSize: 80, color: '#d4af37', mb: 3 }} />
          <Typography variant="h3" component="h1" gutterBottom>
            Your Cart is Empty
          </Typography>
          <Typography variant="h6" color="text.secondary" paragraph sx={{ mb: 4 }}>
            Looks like you haven't added any products to your cart yet.
          </Typography>
          <Button
            variant="contained"
            size="large"
            href="/products"
            sx={{ px: 4, py: 1.5 }}
          >
            Start Shopping
          </Button>
        </Box>
      </Container>
    );
  }

  const { subtotal, shipping, tax } = calculateCartTotals(items);

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Shopping Cart
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          {items.length} {items.length === 1 ? 'Item' : 'Items'} in your cart
        </Typography>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper elevation={2} sx={{ p: 3 }}>
              {items.map((item, index) => (
                <Box key={`${item.id}-${item.selectedSize || 'one-size'}`}>
                  <Box sx={{ py: 2 }}>
                    <Grid container spacing={3} alignItems="center">
                      <Grid size={{ xs: 12, sm: 2 }}>
                        <CardMedia
                          component="img"
                          sx={{
                            height: 120,
                            objectFit: 'cover',
                            borderRadius: 2,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          }}
                          image={item.imageUrl || fallbackImage}
                          onError={(event) => {
                            if (event.currentTarget.src !== fallbackImage) event.currentTarget.src = fallbackImage;
                          }}
                          alt={item.name}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 5 }}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                          {item.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {item.category}
                        </Typography>
                        <Typography variant="body1" color="primary" sx={{ fontWeight: 600 }}>
                          ₹{typeof item.price === 'string' ? parseFloat(item.price).toFixed(2) : item.price.toFixed(2)} each
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton
                            onClick={() => handleQuantityChange(item.id, -1, item.selectedSize)}
                            disabled={item.quantity <= 1}
                            sx={{
                              backgroundColor: 'background.paper',
                              border: '1px solid',
                              borderColor: 'divider',
                              '&:hover': {
                                backgroundColor: 'action.hover',
                              },
                            }}
                          >
                            <RemoveIcon />
                          </IconButton>
                          <Typography
                            sx={{
                              minWidth: '3rem',
                              textAlign: 'center',
                              fontWeight: 600,
                              fontSize: '1.1rem'
                            }}
                          >
                            {item.quantity}
                          </Typography>
                          <IconButton
                            onClick={() => handleQuantityChange(item.id, 1, item.selectedSize)}
                            disabled={item.quantity >= item.inventory}
                            sx={{
                              backgroundColor: 'background.paper',
                              border: '1px solid',
                              borderColor: 'divider',
                              '&:hover': {
                                backgroundColor: 'action.hover',
                              },
                            }}
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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            ₹{((typeof item.price === 'string' ? parseFloat(item.price) : item.price) * item.quantity).toFixed(2)}
                          </Typography>
                          <IconButton
                            onClick={() => handleRemoveItem(item.id, item.name, item.selectedSize)}
                            color="error"
                            sx={{
                              '&:hover': {
                                backgroundColor: 'rgba(211, 47, 47, 0.04)',
                              },
                            }}
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

            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                href="/products"
                sx={{ px: 3 }}
              >
                Continue Shopping
              </Button>
              <Button
                variant="outlined"
                onClick={clearCart}
                color="error"
                sx={{ px: 3 }}
              >
                Clear Cart
              </Button>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={2} sx={{ p: 3, position: 'sticky', top: 24 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                Order Summary
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body1">Subtotal:</Typography>
                  <Typography variant="body1">₹{subtotal.toFixed(2)}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShippingIcon fontSize="small" />
                    <Typography variant="body1">Shipping:</Typography>
                  </Box>
                  <Typography variant="body1">
                    {shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}
                  </Typography>
                </Box>

                {shipping > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    Add ₹{(500 - subtotal).toFixed(2)} more for free shipping
                  </Typography>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body1">Tax:</Typography>
                  <Typography variant="body1">₹{tax.toFixed(2)}</Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Total:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#d4af37' }}>
                    ₹{finalTotal.toFixed(2)}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Shipping Address
                </Typography>
                {savedAddresses.length > 0 && (
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <RadioGroup value={selectedAddressId}>
                      {savedAddresses.map(saved => (
                        <FormControlLabel
                          key={saved.id}
                          value={saved.id}
                          control={<Radio />}
                          onChange={() => selectSavedAddress(saved)}
                          label={
                            <Box>
                              <Typography variant="body2" fontWeight={600}>{saved.label}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatAddress(saved.fields)} | {saved.phone || 'No phone saved'}
                              </Typography>
                            </Box>
                          }
                          sx={{ alignItems: 'flex-start', mr: 0 }}
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
                  sx={{ mb: 2 }}
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

              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  sx={{
                    py: 1.5,
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    border: '2px solid #000000',
                    '&:hover': {
                      backgroundColor: '#1a1a1a',
                      color: '#ffffff',
                      borderColor: '#1a1a1a',
                    }
                  }}
                >
                  Proceed to Checkout
                </Button>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', mb: 2 }}>
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
};

export default Cart;