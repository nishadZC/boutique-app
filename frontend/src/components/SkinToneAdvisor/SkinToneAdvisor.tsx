import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogTitle, Box, Button, Typography,
  IconButton, CircularProgress, Chip, Grid, Card, CardMedia,
  CardContent, CardActions, Divider, Alert, Stepper, Step, StepLabel, Tooltip,
  FormControl, InputLabel, Select, MenuItem, TextField,
} from '@mui/material';
import {
  Close as CloseIcon, CameraAlt as CameraIcon, Upload as UploadIcon,
  ArrowForward as ArrowIcon, Refresh as RefreshIcon, ShoppingBag as BagIcon,
  CheckroomOutlined as OutfitIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  recommendationService,
  RecommendationResult,
  ProductItem,
  OutfitCombination,
} from '../../services/skinToneService';
import { useCart } from '../../contexts/CartContext';
import { getSizeOptions } from '../../utils/productSizing';
import { Product } from '../../types';

// ── Types ─────────────────────────────────────────────────────
interface Props { open: boolean; onClose: () => void; }
type StepId = 'choose' | 'preview' | 'analyzing' | 'results';

// ── Color lookup ──────────────────────────────────────────────
const CSS_COLORS: Record<string, string> = {
  'White': '#FFFFFF', 'Light Blue': '#ADD8E6', 'Navy Blue': '#001F5B',
  'Blue': '#1E40AF', 'Charcoal': '#374151', 'Cream': '#FFFDD0',
  'Lavender': '#C8A2C8', 'Burgundy': '#800020', 'Olive': '#808000',
  'Pink': '#FFC0CB', 'Peach': '#FFCBA4', 'Teal': '#008080',
  'Mustard': '#FFDB58', 'Coral': '#FF7F50', 'Sea Green': '#2E8B57',
  'Grey': '#9CA3AF', 'Black': '#111111', 'Brown': '#8B4513',
  'Khaki': '#C3B091', 'Beige': '#F5F5DC', 'Tan': '#D2B48C',
  'Yellow': '#FFEB3B', 'Gold': '#FFD700', 'Turquoise Blue': '#00CED1',
};
const getHex = (name: string) => CSS_COLORS[name] || '#888';
const LIGHT_COLORS = new Set(['White', 'Cream', 'Beige', 'Peach', 'Lavender', 'Light Blue', 'Pink', 'Mustard']);
const FALLBACK_IMAGE = 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787585185/boutique/products/405dce7e-bed9-4d33-81c2-9a3045d65312.jpg';

const getProductImage = (product: ProductItem) => product.image_url || FALLBACK_IMAGE;

const handleRecommendationImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
  const image = event.currentTarget;
  if (image.src !== FALLBACK_IMAGE) image.src = FALLBACK_IMAGE;
};

// ── Mini product card ─────────────────────────────────────────
const MiniCard: React.FC<{ product: ProductItem; label: string }> = ({ product, label }) => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  return (
    <Card
      sx={{
        borderRadius: 2, overflow: 'hidden', background: '#1e1e1e', border: '1px solid #2a2a2a',
        transition: 'all 0.25s', cursor: 'pointer',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' },
      }}
      onClick={() => navigate(`/products/${product.id}`)}
    >
      <Box sx={{ position: 'relative' }}>
          <CardMedia component="img" height="140" image={getProductImage(product)} alt={product.name}
            onError={handleRecommendationImageError} sx={{ objectFit: 'cover' }} />
        <Chip label={label} size="small"
          sx={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.75)',
                color: '#d4af37', fontSize: '0.65rem', fontWeight: 700, height: 20 }} />
      </Box>
      <CardContent sx={{ p: 1.5, pb: 0.5 }}>
        <Typography variant="caption" sx={{ color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {product.brand}
        </Typography>
        <Typography variant="body2" fontWeight={600} noWrap sx={{ color: '#e0e0e0', fontSize: '0.78rem' }}>
          {product.name}
        </Typography>
        <Typography variant="body2" sx={{ color: '#d4af37', fontWeight: 700, fontSize: '0.82rem' }}>
          ₹{product.price?.toLocaleString('en-IN')}
        </Typography>
      </CardContent>
      <CardActions sx={{ p: 1, pt: 0 }}>
        <Button size="small" variant="outlined" fullWidth startIcon={<BagIcon sx={{ fontSize: 13 }} />}
          onClick={e => { e.stopPropagation(); navigate(`/products/${product.id}`); }}
          sx={{ fontSize: '0.68rem', py: 0.4, color: '#888', borderColor: '#333',
               '&:hover': { borderColor: '#d4af37', color: '#d4af37' } }}>
          Add to Cart
        </Button>
      </CardActions>
    </Card>
  );
};

// ── Outfit Card ───────────────────────────────────────────────
const OutfitCard: React.FC<{ outfit: OutfitCombination; index: number }> = ({ outfit, index }) => {
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
      border: '1px solid #2a2a2a', borderRadius: 3, p: 2, background: '#1a1a1a',
      transition: 'all 0.3s', '&:hover': { borderColor: '#d4af3760' },
    }}>
      <Typography variant="caption" sx={{ color: '#d4af37', fontWeight: 700, letterSpacing: 1 }}>
        OUTFIT {index + 1}
      </Typography>
      <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
        {[
          { item: outfit.topwear, label: 'Shirt' },
          { item: outfit.pants,   label: 'Trousers' },
          { item: outfit.shoes,   label: 'Shoes' },
        ].map(({ item, label }) => (
          <Grid size={{ xs: 4 }} key={item.id}>
              <Box
              sx={{ textAlign: 'center', cursor: 'pointer' }}
              onClick={() => navigate(`/products/${item.id}`)}
            >
              <Box sx={{
                borderRadius: 2, overflow: 'hidden', mb: 0.5,
                border: '1px solid #2a2a2a',
                '&:hover': { borderColor: '#d4af37' },
              }}>
                <img src={getProductImage(item)} alt={item.name} onError={handleRecommendationImageError}
                  style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }} />
              </Box>
              <Typography variant="caption" sx={{ color: '#888', fontSize: '0.62rem' }}>{label}</Typography>
              <Typography variant="caption" sx={{ color: '#d4af37', fontSize: '0.7rem', display: 'block', fontWeight: 600 }}>
                ₹{item.price?.toLocaleString('en-IN')}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
        <Typography variant="body2" sx={{ color: '#ccc', fontWeight: 700 }}>
          Total: <span style={{ color: '#d4af37' }}>₹{total.toLocaleString('en-IN')}</span>
        </Typography>
        <Button size="small" variant="contained"
          startIcon={<BagIcon sx={{ fontSize: 13 }} />}
          onClick={() => setConfigOpen(true)}
          sx={{ fontSize: '0.68rem', py: 0.4, px: 1.5, background: '#d4af37', color: '#000',
               '&:hover': { background: '#b8941f' } }}>
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
              <CardMedia component="img" image={getProductImage(item)} alt={item.name}
                onError={handleRecommendationImageError} sx={{ width: 56, height: 56, borderRadius: 1, objectFit: 'cover' }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="body2" noWrap>{item.name}</Typography>
              </Box>
              <FormControl size="small" sx={{ minWidth: 110 }}>
                <InputLabel>{label} size</InputLabel>
                <Select value={sizes[item.id]} label={`${label} size`}
                  onChange={event => setSizes({ ...sizes, [item.id]: event.target.value })}>
                  {getSizeOptions(item).map(size => <MenuItem value={size} key={size}>{size}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
          ))}
          <Button size="small" variant={customizing ? 'contained' : 'outlined'}
            onClick={() => setCustomizing(!customizing)} disabled={!sizes[outfit.topwear.id]}
            sx={{ mb: 2 }}>
            Customize shirt
          </Button>
          {customizing && (
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              {(['shoulder', 'chest', 'sleeve', 'neck'] as const).map(field => (
                <Grid size={{ xs: 6 }} key={field}>
                  <TextField size="small" fullWidth label={field[0].toUpperCase() + field.slice(1)}
                    value={measurements[field]}
                    onChange={event => setMeasurements({ ...measurements, [field]: event.target.value })} />
                </Grid>
              ))}
            </Grid>
          )}
          <Button fullWidth variant="contained" onClick={addCompleteOutfit}
            disabled={outfitItems.some(({ item }) => !sizes[item.id]) || (customizing && Object.values(measurements).some(value => !value))}
            startIcon={<BagIcon />}>
            Add complete outfit to cart
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
};
// ── Main Component ────────────────────────────────────────────

const SkinToneAdvisor: React.FC<Props> = ({ open, onClose }) => {
  const [step, setStep] = useState<StepId>('choose');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [outfitTab, setOutfitTab] = useState<'outfits' | 'individual'>('outfits');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const resetState = () => {
    setStep('choose');
    setImageFile(null);
    setPreviewUrl(null);
    setError(null);
    setResult(null);
    setOutfitTab('outfits');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleChoosePhoto = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      setError('Image size must be less than 10MB.');
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const newPreviewUrl = URL.createObjectURL(file);

    setImageFile(file);
    setPreviewUrl(newPreviewUrl);
    setError(null);
    setStep('preview');
  };

  const handleAnalyze = async () => {
    if (!imageFile) {
      setError('Please select a photo first.');
      setStep('choose');
      return;
    }

    setStep('analyzing');
    setError(null);

    try {
      const data = await recommendationService.analyze(imageFile);

      setResult(data);
      setStep('results');
    } catch (err: any) {
      setError(
        err?.message ||
          'Analysis failed. Please try again with a clearer face photo.'
      );

      setStep('preview');
    }
  };

  const handleRetry = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setImageFile(null);
    setPreviewUrl(null);
    setError(null);
    setResult(null);
    setStep('choose');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: '#0d0d0d',
          color: '#fff',
          minHeight: '75vh',
        },
      }}
    >
      {/* ── Header ── */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background:
            'linear-gradient(135deg, #111 0%, #1e1e1e 100%)',
          borderBottom: '1px solid #222',
          pb: 1.5,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{
              fontFamily: '"Playfair Display", serif',
              color: '#d4af37',
            }}
          >
            🎨 Find Your Style
          </Typography>

          <Typography
            variant="body2"
            sx={{ color: '#777', mt: 0.8 }}
          >
            Select your photo → Preview → Skin tone detected → Outfit
            recommendations generated
          </Typography>
        </Box>

        <IconButton
          onClick={handleClose}
          sx={{
            color: '#555',
            '&:hover': { color: '#fff' },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 4 }}>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* ═══════════════════════════════════════
            STEP 1 — CHOOSE PHOTO
        ═══════════════════════════════════════ */}
        {step === 'choose' && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  background: '#1a0808',
                  color: '#ffcdd2',
                  border: '1px solid #3a1010',
                }}
              >
                {error}
              </Alert>
            )}

            <UploadIcon
              sx={{
                fontSize: 64,
                color: '#d4af37',
                mb: 2,
              }}
            />

            <Typography
              variant="h6"
              sx={{
                color: '#fff',
                mb: 1,
                fontWeight: 700,
              }}
            >
              Select Your Photo
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: '#777',
                mb: 4,
              }}
            >
              Upload a clear photo of your face to get personalized color
              and outfit recommendations.
            </Typography>

            <Button
              variant="contained"
              size="large"
              startIcon={<UploadIcon />}
              onClick={handleChoosePhoto}
              sx={{
                background: '#d4af37',
                color: '#000',
                fontWeight: 700,
                px: 4,
                py: 1.2,
                '&:hover': {
                  background: '#b8941f',
                },
              }}
            >
              Select Photo
            </Button>

            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: '#555',
                mt: 2,
              }}
            >
              JPG, PNG, WEBP supported · Maximum 10MB
            </Typography>
          </Box>
        )}

        {/* ═══════════════════════════════════════
            STEP 1 — PREVIEW
        ═══════════════════════════════════════ */}
        {step === 'preview' && imageFile && previewUrl && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  background: '#1a0808',
                  color: '#ffcdd2',
                  border: '1px solid #3a1010',
                }}
              >
                {error}
              </Alert>
            )}

            <Typography
              variant="h6"
              sx={{
                color: '#fff',
                mb: 1,
              }}
            >
              Preview Your Photo
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: '#888',
                mb: 3,
              }}
            >
              If the photo looks correct, click Analyze to get your
              personalized recommendations.
            </Typography>

            <Box
              sx={{
                display: 'inline-block',
                borderRadius: 3,
                overflow: 'hidden',
                border: '2px solid #d4af37',
                mb: 3,
                maxWidth: '100%',
              }}
            >
              <img
                src={previewUrl}
                alt="Selected preview"
                style={{
                  maxWidth: 360,
                  width: '100%',
                  maxHeight: 400,
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowIcon />}
                onClick={handleAnalyze}
                sx={{
                  background: '#d4af37',
                  color: '#000',
                  fontWeight: 700,
                  px: 4,
                  '&:hover': {
                    background: '#b8941f',
                  },
                }}
              >
                Analyze & Get Outfits
              </Button>

              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRetry}
                sx={{
                  color: '#aaa',
                  borderColor: '#444',
                  '&:hover': {
                    borderColor: '#d4af37',
                    color: '#d4af37',
                  },
                }}
              >
                Choose Another Photo
              </Button>
            </Box>
          </Box>
        )}

        {/* ═══════════════════════════════════════
            ANALYZING
        ═══════════════════════════════════════ */}
        {step === 'analyzing' && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress
              size={72}
              thickness={2}
              sx={{
                color: '#d4af37',
                mb: 3,
              }}
            />

            <Typography
              variant="h6"
              sx={{
                color: '#fff',
                mb: 1,
              }}
            >
              Analyzing your skin tone...
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: '#555',
              }}
            >
              Detecting face → Estimating skin tone → Finding matching
              colors → Building outfit combinations
            </Typography>
          </Box>
        )}

        {/* ═══════════════════════════════════════
            STEP 2 — RESULTS
        ═══════════════════════════════════════ */}
        {step === 'results' && result && (
          <Box>

            {/* Skin Tone Card */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                p: 3,
                borderRadius: 3,
                background: '#111',
                border: '1px solid #222',
                mb: 4,
              }}
            >
              <Box
                sx={{
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: result.skinTone.hex,
                  border: '3px solid #d4af37',
                  boxShadow: `0 0 24px ${result.skinTone.hex}60`,
                }}
              />

              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#d4af37',
                    fontFamily: '"Playfair Display", serif',
                  }}
                >
                  {result.skinTone.name} Skin Tone
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: '#888',
                    mt: 0.5,
                  }}
                >
                  Hex:{' '}
                  <span
                    style={{
                      color: '#ccc',
                      fontWeight: 600,
                    }}
                  >
                    {result.skinTone.hex}
                  </span>

                  &ensp;·&ensp;Confidence:{' '}

                  <span style={{ color: '#4caf50' }}>
                    {Math.round(
                      result.skinTone.confidence * 100
                    )}
                    %
                  </span>
                </Typography>

                {!result.skinTone.faceDetected && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#ff9800',
                      mt: 0.5,
                    }}
                  >
                    Face not clearly detected — results may be approximate
                  </Typography>
                )}
              </Box>

              <Button
                size="small"
                startIcon={<RefreshIcon />}
                variant="outlined"
                onClick={handleRetry}
                sx={{
                  color: '#aaa',
                  borderColor: '#444',
                  '&:hover': {
                    borderColor: '#d4af37',
                    color: '#d4af37',
                  },
                }}
              >
                Try Again
              </Button>
            </Box>

            {/* Recommended Colors */}
            <Typography
              variant="subtitle1"
              sx={{
                color: '#fff',
                mb: 1.5,
                fontWeight: 700,
              }}
            >
              Your Recommended Color Palette
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1.5,
                mb: 4,
              }}
            >
              {result.recommendedColors
                .slice(0, 10)
                .map((color) => (
                  <Tooltip
                    key={color}
                    title={color}
                    arrow
                  >
                    <Chip
                      label={color}
                      sx={{
                        background: getHex(color),
                        color: LIGHT_COLORS.has(color)
                          ? '#111'
                          : '#fff',
                        fontWeight: 600,
                        fontSize: '0.73rem',
                        border:
                          '2px solid rgba(255,255,255,0.1)',
                      }}
                    />
                  </Tooltip>
                ))}
            </Box>

            <Divider
              sx={{
                borderColor: '#1e1e1e',
                mb: 3,
              }}
            />

            {/* Tabs */}
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                mb: 3,
                flexWrap: 'wrap',
              }}
            >
              {[
                {
                  id: 'outfits',
                  label: 'Outfit Combinations',
                  icon: <OutfitIcon sx={{ fontSize: 16 }} />,
                },
                {
                  id: 'individual',
                  label: 'Individual Products',
                  icon: <BagIcon sx={{ fontSize: 16 }} />,
                },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  size="small"
                  startIcon={tab.icon}
                  variant={
                    outfitTab === tab.id
                      ? 'contained'
                      : 'outlined'
                  }
                  onClick={() =>
                    setOutfitTab(
                      tab.id as 'outfits' | 'individual'
                    )
                  }
                  sx={
                    outfitTab === tab.id
                      ? {
                          background: '#d4af37',
                          color: '#000',
                          fontWeight: 700,
                          '&:hover': {
                            background: '#b8941f',
                          },
                        }
                      : {
                          color: '#666',
                          borderColor: '#333',
                          '&:hover': {
                            borderColor: '#555',
                          },
                        }
                  }
                >
                  {tab.label}
                </Button>
              ))}
            </Box>

            {/* Outfit Combinations */}
            {outfitTab === 'outfits' && (
              <>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#666',
                    mb: 2,
                  }}
                >
                  Complete formal outfit combinations curated for your skin tone
                </Typography>

                {result.outfits.length > 0 ? (
                  <Grid
                    container
                    spacing={2}
                  >
                    {result.outfits.map((outfit, i) => (
                      <Grid
                        size={{ xs: 12, sm: 6 }}
                        key={i}
                      >
                        <OutfitCard
                          outfit={outfit}
                          index={i}
                        />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Alert
                    severity="warning"
                    sx={{
                      background: '#1a1a00',
                      color: '#ffd54f',
                      border: '1px solid #3a3a00',
                    }}
                  >
                    No outfit combinations found. Try browsing the individual
                    products below.
                  </Alert>
                )}
              </>
            )}

            {/* Individual Products */}
            {outfitTab === 'individual' && (
              <>
                {(
                  [
                    {
                      label: 'Formal Shirts',
                      items: result.recommendations.topwear,
                      cat: 'Formal+Shirts',
                    },
                    {
                      label: 'Trousers & Pants',
                      items: result.recommendations.pants,
                      cat: 'Trousers+%26+Pants',
                    },
                    {
                      label: 'Formal Shoes',
                      items: result.recommendations.shoes,
                      cat: 'Formal+Shoes',
                    },
                  ] as const
                ).map(({ label, items, cat }) =>
                  items.length > 0 ? (
                    <Box
                      key={label}
                      sx={{ mb: 4 }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 2,
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{
                            color: '#d4af37',
                            fontWeight: 700,
                          }}
                        >
                          {label}
                        </Typography>

                        <Button
                          size="small"
                          endIcon={<ArrowIcon />}
                          sx={{
                            color: '#555',
                            fontSize: '0.72rem',
                          }}
                          onClick={() =>
                            navigate(
                              `/products?category=${cat}`
                            )
                          }
                        >
                          View All
                        </Button>
                      </Box>

                      <Grid
                        container
                        spacing={2}
                      >
                        {items.slice(0, 4).map((product) => (
                          <Grid
                            size={{ xs: 6, sm: 3 }}
                            key={product.id}
                          >
                            <MiniCard
                              product={product}
                              label={product.color}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ) : null
                )}
              </>
            )}

            <Box
              sx={{
                textAlign: 'center',
                mt: 4,
              }}
            >
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowIcon />}
                onClick={() => {
                  handleClose();
                  navigate('/products');
                }}
                sx={{
                  background: '#d4af37',
                  color: '#000',
                  fontWeight: 700,
                  px: 4,
                  '&:hover': {
                    background: '#b8941f',
                  },
                }}
              >
                Browse Full Collection
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SkinToneAdvisor;