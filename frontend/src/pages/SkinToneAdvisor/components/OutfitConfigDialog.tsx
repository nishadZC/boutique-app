import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Dialog, IconButton, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';
import { Close as CloseIcon, ShoppingBag as BagIcon, Straighten as TapeIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCart } from 'contexts/CartContext';
import { OutfitCombination, ProductItem } from 'services/skinToneService';
import { productService } from 'services/productService';
import { Product } from 'types';
import { getSizeOptions } from 'utils/productSizing';
import { getProductImage, handleRecommendationImageError } from 'utils/imageHelpers';
import { getTailoringFields, isValidMeasurement, MEASUREMENT_LIMITS, MeasurementField } from 'utils/measurements';
import styles from './OutfitConfigDialog.module.css';

const SHIRT_FIELDS = getTailoringFields('shirt');
const EMPTY_MEASUREMENTS = { shoulder: '', chest: '', sleeve: '', neck: '' };
const MEASUREMENT_INPUTS = [
  { field: 'shoulder', label: 'Shoulder (cm)', placeholder: '20-70' },
  { field: 'chest', label: 'Chest (cm)', placeholder: '50-180' },
  { field: 'sleeve', label: 'Sleeve (cm)', placeholder: '20-100' },
  { field: 'neck', label: 'Neck (cm)', placeholder: '20-70' },
] as const;

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

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
  const [measurements, setMeasurements] = useState(EMPTY_MEASUREMENTS);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (open && outfit) {
      setSizes(Object.fromEntries(
        [outfit.topwear, outfit.pants, outfit.shoes].map(item => [item.id, ''])
      ));
      setCustomizing(false);
      setMeasurements(EMPTY_MEASUREMENTS);
      setAdding(false);
    }
  }, [open, outfit]);

  if (!outfit) return null;

  const outfitItems = [
    { item: outfit.topwear, label: 'Shirt' },
    { item: outfit.pants, label: 'Trousers' },
    { item: outfit.shoes, label: 'Shoes' },
  ];
  const total = outfitItems.reduce((sum, { item }) => sum + Number(item.price || 0), 0);

  const missingSize = outfitItems.some(({ item }) => {
    if (item.id === outfit.topwear.id && customizing) return false;
    return !sizes[item.id];
  });
  const invalidMeasurements = customizing
    && SHIRT_FIELDS.some(field => !isValidMeasurement(field, measurements[field as keyof typeof measurements]));

  // The recommendation API only returns a slim ProductItem, so the real
  // product is looked up and added to the cart - the same object a product
  // card would add. This stand-in is used only if that lookup fails.
  const fallbackProduct = (item: ProductItem): Product => ({
    id: item.id,
    name: item.name,
    description: '',
    price: Number(item.price || 0),
    originalPrice: Number(item.compare_price || item.price || 0),
    imageUrl: getProductImage(item),
    category: item.category,
    brand: item.brand,
    inventory: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const addCompleteOutfit = async () => {
    if (missingSize || invalidMeasurements || adding) return;
    setAdding(true);

    const shirtSize = customizing
      ? `Custom(S:${measurements.shoulder} C:${measurements.chest} Sl:${measurements.sleeve} N:${measurements.neck})`
      : sizes[outfit.topwear.id];

    try {
      const products = await Promise.all(
        outfitItems.map(({ item }) => productService.getById(item.id).catch(() => fallbackProduct(item)))
      );
      const selectedSizes = [shirtSize, sizes[outfit.pants.id], sizes[outfit.shoes.id]];

      // Stop at the first refusal (e.g. signed out) so the sign-in prompt shows once.
      const addedAll = products.every((product, i) => addItem(product, selectedSizes[i], false));
      if (addedAll) {
        onClose();
        void navigate('/cart');
      }
    } finally {
      setAdding(false);
    }
  };

  const menuProps = { PaperProps: { className: styles.menuPaper } };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      className={styles.root}
      PaperProps={{ className: styles.paper, 'aria-labelledby': 'outfit-config-title' } as object}
    >
      <Box className={styles.header}>
        <Box>
          <Typography variant="overline" className={styles.eyebrow}>Look {String(index + 1).padStart(2, '0')}</Typography>
          <Typography id="outfit-config-title" component="h2" className={styles.title}>Choose your sizes</Typography>
        </Box>
        <IconButton aria-label="Close" onClick={onClose} className={styles.close}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box className={styles.body}>
        <Typography className={styles.intro}>
          Select a size for every piece to add the complete look to your cart.
        </Typography>

        <Box component="ul" className={styles.items}>
          {outfitItems.map(({ item, label }) => {
            const isCustomShirt = customizing && item.id === outfit.topwear.id;
            return (
              <li key={item.id} className={styles.item}>
                <Box className={styles.thumb}>
                  <img src={getProductImage(item)} alt={item.name} onError={handleRecommendationImageError} />
                </Box>
                <Box className={styles.itemText}>
                  <Typography className={styles.itemRole}>{label}</Typography>
                  <Typography className={styles.itemName}>{item.name}</Typography>
                  <Typography className={styles.itemPrice}>{inr(Number(item.price || 0))}</Typography>
                </Box>
                {isCustomShirt ? (
                  <Typography className={styles.customTag}>Made to measure</Typography>
                ) : (
                  <FormControl size="small" className={styles.select}>
                    <InputLabel>Size</InputLabel>
                    <Select
                      value={sizes[item.id] ?? ''}
                      label="Size"
                      onChange={event => setSizes({ ...sizes, [item.id]: event.target.value as string })}
                      MenuProps={menuProps}
                    >
                      {getSizeOptions(item).map(size => <MenuItem value={size} key={size}>{size}</MenuItem>)}
                    </Select>
                  </FormControl>
                )}
              </li>
            );
          })}
        </Box>

        <button type="button" onClick={() => setCustomizing(!customizing)} className={styles.textBtn}>
          <TapeIcon fontSize="inherit" />
          {customizing ? 'Use standard shirt size' : 'Tailor the shirt to my measurements'}
        </button>

        {customizing && (
          <Box className={styles.measurements}>
            <Typography className={styles.measureTitle}>Your measurements (cm)</Typography>
            <Box className={styles.measureGrid}>
              {MEASUREMENT_INPUTS.map(({ field, label, placeholder }) => (
                <TextField
                  key={field}
                  size="small"
                  fullWidth
                  type="number"
                  inputProps={{ min: MEASUREMENT_LIMITS[field as MeasurementField].min, max: MEASUREMENT_LIMITS[field as MeasurementField].max, step: '0.01' }}
                  label={label}
                  placeholder={placeholder}
                  value={measurements[field]}
                  onChange={event => setMeasurements({ ...measurements, [field]: event.target.value })}
                  className={styles.field}
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>

      <Box className={styles.footer}>
        <Box>
          <Typography className={styles.totalLabel}>Complete look</Typography>
          <Typography className={styles.totalValue}>{inr(total)}</Typography>
        </Box>
        <Button
          onClick={addCompleteOutfit}
          disabled={missingSize || invalidMeasurements || adding}
          startIcon={<BagIcon />}
          className={styles.addBtn}
        >
          {adding ? 'Adding…' : 'Add look to cart'}
        </Button>
      </Box>
    </Dialog>
  );
};

export default OutfitConfigDialog;
