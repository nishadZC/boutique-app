import React, { useState, useRef, useEffect } from 'react';
import {
  Container, Paper, Box, Button, Typography,
  IconButton, CircularProgress, Chip, Grid, Divider, Alert, Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon, Upload as UploadIcon,
  ArrowForward as ArrowIcon, Refresh as RefreshIcon, ShoppingBag as BagIcon,
  CheckroomOutlined as OutfitIcon, ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { recommendationService, RecommendationResult } from 'services/skinToneService';
import { LIGHT_COLORS, getHex } from 'constants/colors';
import MiniProductCard from './components/MiniProductCard';
import OutfitCard from './components/OutfitCard';

// ── Types ─────────────────────────────────────────────────────
type StepId = 'choose' | 'preview' | 'analyzing' | 'results';
// ── Main Component ────────────────────────────────────────────

const SkinToneAdvisor: React.FC = () => {
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
    navigate('/products');
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

    const maxSize = 20 * 1024 * 1024;

    if (file.size > maxSize) {
      setError('Image size must be less than 20MB.');
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
      let errorMessage = err?.message || 'Analysis failed. Please try again with a clearer face photo.';
      
      if (errorMessage.toLowerCase().includes('face')) {
        errorMessage = 'Face not detected. Please try a clearer photo.';
      }

      setError(errorMessage);

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
    <Container component="main" maxWidth="md" sx={{ py: 6 }}>
      <Paper
        elevation={3}
        sx={{
          borderRadius: 3,
          background: '#0d0d0d',
          color: '#fff',
          minHeight: '75vh',
          overflow: 'hidden',
        }}
      >
        {/* ── Header ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background:
            'linear-gradient(135deg, #111 0%, #1e1e1e 100%)',
          borderBottom: '1px solid #222',
          p: 3,
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
            Find Your Style
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', color: '#777', mt: 0.8 }}>
            <Typography variant="body2">Select your photo</Typography>
            <ChevronRightIcon sx={{ fontSize: 16, mx: 0.5 }} />
            <Typography variant="body2">Preview</Typography>
            <ChevronRightIcon sx={{ fontSize: 16, mx: 0.5 }} />
            <Typography variant="body2">Skin tone detected</Typography>
            <ChevronRightIcon sx={{ fontSize: 16, mx: 0.5 }} />
            <Typography variant="body2">Outfit recommendations generated</Typography>
          </Box>
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
      </Box>

      <Box sx={{ pt: 4, px: 3, pb: 4 }}>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
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
                            <MiniProductCard
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
      </Box>
    </Paper>
  </Container>
  );
};

export default SkinToneAdvisor;