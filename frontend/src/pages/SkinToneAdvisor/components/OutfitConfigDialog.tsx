import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Button, Dialog, DialogTitle, DialogContent, CardMedia, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';
import { ShoppingBag as BagIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCart } from 'contexts/CartContext';
import { OutfitCombination, ProductItem } from 'services/skinToneService';
import { productService } from 'services/productService';
import { Product } from 'types';
import { getSizeOptions } from 'utils/productSizing';
import { getProductImage, handleRecommendationImageError } from 'utils/imageHelpers';
import { getTailoringFields, isValidMeasurement, MEASUREMENT_LIMITS, MeasurementField } from 'utils/measurements';

const SHIRT_FIELDS = getTailoringFields('shirt');
import { BRAND } from '../../../constants/colors';

interface OutfitConfigDialogProps {
  outfit: OutfitCombination | null;
  index: number;
  open: boolean;
  onClose: () => void;
}

// The single shared "configure outfit" dialog for the Style Advisor results
// page - one instance for all outfit cards, rather than each card owning its
// own Dialog.
const OutfitConfigDialog: React.FC<OutfitConfigDialogProps> = ({ outfit, index, open, onClose }) => {
  const { addItem } = useCart();
  const navigate = useNavigate();

  const [sizes, setSizes] = useState<Record<string, string>>({});
  const [customizing, setCustomizing] = useState(false);
  const [measurements, setMeasurements] = useState({ shoulder: '', chest: '', sleeve: '', neck: '' });

  useEffect(() => {
    if (open && outfit) {
      setSizes(Object.fromEntries(
        [outfit.topwear, outfit.pants, outfit.shoes].map(item => [item.id, ''])
      ));
      setCustomizing(false);
      setMeasurements({ shoulder: '', chest: '', sleeve: '', neck: '' });
    }
  }, [open, outfit]);

  if (!outfit) return null;

  const outfitItems = [
    { item: outfit.topwear, label: 'Shirt' },
    { item: outfit.pants, label: 'Trousers' },
    { item: outfit.shoes, label: 'Shoes' },
  ];

  // The recommendation API doesn't return stock info (ProductItem has no
  // inventory field), so the real product is looked up before adding to
  // cart. Falls back to 1 only if that lookup fails.
  const toCartProduct = (item: ProductItem, inventory = 1): Product => ({
    id: item.id,
    name: item.name,
    description: `Premium ${item.category} from Lux Atelier`,
    price: Number(item.price || 0),
    originalPrice: Number(item.compare_price || item.price || 0),
    imageUrl: getProductImage(item),
    category: item.category,
    brand: item.brand,
    inventory,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const addCompleteOutfit = async () => {
    if (outfitItems.some(({ item }) => {
      if (item.id === outfit.topwear.id && customizing) return false;
      return !sizes[item.id];
    })) return;
    if (customizing && SHIRT_FIELDS.some(field => !isValidMeasurement(field, measurements[field as keyof typeof measurements]))) return;

    const shirtSize = customizing
      ? `Custom(S:${measurements.shoulder} C:${measurements.chest} Sl:${measurements.sleeve} N:${measurements.neck})`
      : sizes[outfit.topwear.id];

    const [topwearProduct, pantsProduct, shoesProduct] = await Promise.all(
      [outfit.topwear, outfit.pants, outfit.shoes].map(item =>
        productService.getById(item.id).catch(() => null)
      )
    );

    const addedShirt = addItem(toCartProduct(outfit.topwear, topwearProduct?.inventory), shirtSize, false);
    const addedPants = addItem(toCartProduct(outfit.pants, pantsProduct?.inventory), sizes[outfit.pants.id], false);
    const addedShoes = addItem(toCartProduct(outfit.shoes, shoesProduct?.inventory), sizes[outfit.shoes.id], false);

    if (addedShirt && addedPants && addedShoes) {
      onClose();
      navigate('/cart');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>Configure Outfit {index + 1}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Select a size for every item before adding the complete combination.
        </Typography>
        {outfitItems.map(({ item, label }) => (
          <Box key={item.id} sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2.5 }}>
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 0.5 }}>
              <CardMedia
                component="img"
                image={getProductImage(item)}
                alt={item.name}
                onError={handleRecommendationImageError}
                sx={{ width: 60, height: 60, borderRadius: 0.5, objectFit: 'cover', objectPosition: 'top' }}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Typography>
              <Typography variant="body2" noWrap sx={{ fontWeight: 500, color: '#111' }}>{item.name}</Typography>
            </Box>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>{label} size</InputLabel>
              <Select
                value={sizes[item.id] ?? ''}
                label={`${label} size`}
                onChange={event => setSizes({ ...sizes, [item.id]: event.target.value as string })}
              >
                {getSizeOptions(item).map(size => <MenuItem value={size} key={size}>{size}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        ))}

        <Button
          size="small"
          variant="outlined"
          onClick={() => setCustomizing(!customizing)}
          sx={{
            mb: 3,
            minWidth: 120,
            height: 40,
            color: customizing ? '#c62828 !important' : `${BRAND.GOLD} !important`,
            border: customizing ? '1px solid #c62828 !important' : `1px solid ${BRAND.GOLD} !important`,
            backgroundColor: '#fff !important',
            '&:hover': {
              backgroundColor: customizing ? '#fff5f5 !important' : 'rgba(200, 164, 110, 0.08) !important',
              borderColor: customizing ? '#b71c1c !important' : `${BRAND.GOLD_DARK} !important`,
            },
          }}
        >
          {customizing ? 'Cancel' : 'Customize'}
        </Button>

        {customizing && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2, border: '1px solid #eee' }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Enter your exact measurements (cm)
            </Typography>
            <Grid container spacing={2}>
              {[
                { field: 'shoulder', label: 'Shoulder (cm)', placeholder: '20-70' },
                { field: 'chest', label: 'Chest (cm)', placeholder: '50-180' },
                { field: 'sleeve', label: 'Sleeve (cm)', placeholder: '20-100' },
                { field: 'neck', label: 'Neck (cm)', placeholder: '20-70' }
              ].map(({ field, label, placeholder }) => (
                <Grid size={{ xs: 6 }} key={field}>
                  <TextField
                    size="small"
                    fullWidth
                    type="number"
                    inputProps={{ min: MEASUREMENT_LIMITS[field as MeasurementField].min, max: MEASUREMENT_LIMITS[field as MeasurementField].max, step: '0.01' }}
                    label={label}
                    placeholder={placeholder}
                    value={measurements[field as keyof typeof measurements]}
                    onChange={event => setMeasurements({ ...measurements, [field]: event.target.value })}
                    sx={{ bgcolor: '#fff' }}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={addCompleteOutfit}
          disabled={
            outfitItems.some(({ item }) => {
              if (item.id === outfit.topwear.id && customizing) return false;
              return !sizes[item.id];
            }) ||
            (customizing && SHIRT_FIELDS.some(field => !isValidMeasurement(field, measurements[field as keyof typeof measurements])))
          }
          startIcon={<BagIcon />}
          sx={{
            background: BRAND.GOLD, color: '#111', fontWeight: 600, py: 1.5,
            borderRadius: 2,
            boxShadow: 'none',
            '&:hover': { background: BRAND.GOLD_DARK, boxShadow: 'none' },
            '&.Mui-disabled': { background: '#e0e0e0', color: '#9e9e9e' }
          }}
        >
          Add to Cart
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default OutfitConfigDialog;
