import React, { useState } from 'react';
import { Box, Typography, Grid, Button, Dialog, DialogTitle, DialogContent, CardMedia, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';
import { ShoppingBag as BagIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCart } from 'contexts/CartContext';
import { OutfitCombination, ProductItem } from 'services/skinToneService';
import { Product } from 'types';
import { getSizeOptions } from 'utils/productSizing';
import { getProductImage, handleRecommendationImageError } from 'utils/imageHelpers';

interface OutfitCardProps {
  outfit: OutfitCombination;
  index: number;
}

const OutfitCard: React.FC<OutfitCardProps> = ({ outfit, index }) => {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [configOpen, setConfigOpen] = useState(false);
  
  const outfitItems = [
    { item: outfit.topwear, label: 'Shirt' },
    { item: outfit.pants, label: 'Trousers' },
    { item: outfit.shoes, label: 'Shoes' },
  ];
  
  const [sizes, setSizes] = useState<Record<string, string>>(() =>
    Object.fromEntries(outfitItems.map(({ item }) => [item.id, '']))
  );
  
  const [customizing, setCustomizing] = useState(false);
  const [measurements, setMeasurements] = useState({ shoulder: '', chest: '', sleeve: '', neck: '' });
  
  const total = Number(outfit.topwear.price || 0) + Number(outfit.pants.price || 0) + Number(outfit.shoes.price || 0);

  const toCartProduct = (item: ProductItem): Product => ({
    id: item.id,
    name: item.name,
    description: `Premium ${item.category} from Lux Atelier`,
    price: Number(item.price || 0),
    originalPrice: Number(item.compare_price || item.price || 0),
    imageUrl: getProductImage(item),
    category: item.category,
    brand: item.brand,
    inventory: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const addCompleteOutfit = () => {
    if (outfitItems.some(({ item }) => !sizes[item.id])) return;
    if (customizing && Object.values(measurements).some(value => !value)) return;

    const shirtSize = customizing
      ? `Custom (Shoulder: ${measurements.shoulder}, Chest: ${measurements.chest}, Sleeve: ${measurements.sleeve}, Neck: ${measurements.neck})`
      : sizes[outfit.topwear.id];
      
    const addedShirt = addItem(toCartProduct(outfit.topwear), shirtSize, false);
    const addedPants = addItem(toCartProduct(outfit.pants), sizes[outfit.pants.id], false);
    const addedShoes = addItem(toCartProduct(outfit.shoes), sizes[outfit.shoes.id], false);

    if (addedShirt && addedPants && addedShoes) {
      setConfigOpen(false);
      navigate('/cart');
    }
  };

  return (
    <Box sx={{
      border: '1px solid #f0f0f0', borderRadius: 3, p: 2, background: '#fff',
      transition: 'all 0.3s', '&:hover': { borderColor: '#d4af3760' },
    }}>
      <Typography variant="caption" sx={{ color: '#d4af37', fontWeight: 700, letterSpacing: 1 }}>
        OUTFIT {index + 1}
      </Typography>
      <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
        {outfitItems.map(({ item, label }) => (
          <Grid size={{ xs: 4 }} key={item.id}>
            <Box
              sx={{ textAlign: 'center', cursor: 'pointer' }}
              onClick={() => navigate(`/products/${item.id}`)}
            >
              <Box sx={{
                borderRadius: 2, overflow: 'hidden', mb: 0.5,
                border: '1px solid #f0f0f0',
                '&:hover': { borderColor: '#d4af37' },
              }}>
                <img
                  src={getProductImage(item)}
                  alt={item.name}
                  onError={handleRecommendationImageError}
                  style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: '#666', fontSize: '0.62rem' }}>{label}</Typography>
              <Typography variant="caption" sx={{ color: '#d4af37', fontSize: '0.7rem', display: 'block', fontWeight: 600 }}>
                ₹{item.price?.toLocaleString('en-IN')}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
        <Typography variant="body2" sx={{ color: '#424242', fontWeight: 700 }}>
          Total: <span style={{ color: '#d4af37' }}>₹{total.toLocaleString('en-IN')}</span>
        </Typography>
        <Button
          size="small"
          variant="contained"
          startIcon={<BagIcon sx={{ fontSize: 13 }} />}
          onClick={() => setConfigOpen(true)}
          sx={{
            fontSize: '0.68rem', py: 0.4, px: 1.5, background: '#d4af37', color: '#000',
            '&:hover': { background: '#b8941f' }
          }}
        >
          Select outfit
        </Button>
      </Box>

      <Dialog open={configOpen} onClose={() => setConfigOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configure Outfit {index + 1}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a size for every item before adding the complete combination.
          </Typography>
          {outfitItems.map(({ item, label }) => (
            <Box key={item.id} sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
              <CardMedia
                component="img"
                image={getProductImage(item)}
                alt={item.name}
                onError={handleRecommendationImageError}
                sx={{ width: 56, height: 56, borderRadius: 1, objectFit: 'cover' }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="body2" noWrap>{item.name}</Typography>
              </Box>
              <FormControl size="small" sx={{ minWidth: 110 }}>
                <InputLabel>{label} size</InputLabel>
                <Select
                  value={sizes[item.id]}
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
            variant={customizing ? 'contained' : 'outlined'}
            onClick={() => setCustomizing(!customizing)}
            sx={{ mb: 2 }}
          >
            Customize shirt
          </Button>
          
          {customizing && (
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              {(['shoulder', 'chest', 'sleeve', 'neck'] as const).map(field => (
                <Grid size={{ xs: 6 }} key={field}>
                  <TextField
                    size="small"
                    fullWidth
                    label={field[0].toUpperCase() + field.slice(1)}
                    value={measurements[field]}
                    onChange={event => setMeasurements({ ...measurements, [field]: event.target.value })}
                  />
                </Grid>
              ))}
            </Grid>
          )}
          
          <Button
            fullWidth
            variant="contained"
            onClick={addCompleteOutfit}
            disabled={
              outfitItems.some(({ item }) => {
                if (item.id === outfit.topwear.id && customizing) return false;
                return !sizes[item.id];
              }) || 
              (customizing && Object.values(measurements).some(value => !value))
            }
            startIcon={<BagIcon />}
            sx={{ background: '#d4af37', color: '#000', fontWeight: 'bold', '&:hover': { background: '#b8941f' }, '&.Mui-disabled': { background: '#333', color: '#999' } }}
          >
            Add complete outfit to cart
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default OutfitCard;
