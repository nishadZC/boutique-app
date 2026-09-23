import React, { memo, useState } from 'react';
import {
  Container, Box, Button, Typography,
  CircularProgress, Chip, Grid, Divider, Alert, Tooltip,
} from '@mui/material';
import {
  Upload as UploadIcon,
  ArrowForward as ArrowIcon, Refresh as RefreshIcon, ShoppingBag as BagIcon,
  CheckroomOutlined as OutfitIcon, ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { LIGHT_COLORS, getHex } from 'constants/colors';
import RecommendedProductsGrid from './components/RecommendedProductsGrid';
import OutfitCard from './components/OutfitCard';
import OutfitConfigDialog from './components/OutfitConfigDialog';
import { useSkinToneAdvisor } from '../../hooks/useSkinToneAdvisor';
import styles from './SkinToneAdvisor.module.css';

const SkinToneAdvisor: React.FC = memo(() => {
  const {
    step,
    imageFile,
    previewUrl,
    error,
    result,
    outfitTab,
    setOutfitTab,
    fileInputRef,
    navigate,
    handleClose,
    handleChoosePhoto,
    handleFileChange,
    handleAnalyze,
    handleRetry
  } = useSkinToneAdvisor();

  // A single shared dialog instance for every outfit card, instead of each
  // card owning its own Dialog - only the selected outfit's index is tracked.
  const [selectedOutfitIndex, setSelectedOutfitIndex] = useState<number | null>(null);

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
      onChange={handleFileChange}
    />
  );

  if (step === 'results' && result) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {fileInput}

        <Box sx={{ mb: 1 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Your Style Recommendations
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Curated for your skin tone
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Box className={styles.skinToneCard}>
            <Box
              className={styles.swatch}
              style={{
                background: result.skinTone.hex,
                boxShadow: `0 0 24px ${result.skinTone.hex}60`,
              }}
            />

            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ color: '#d4af37', fontFamily: '"Playfair Display", serif' }}>
                {result.skinTone.name} Skin Tone
              </Typography>

              <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
                Hex:{' '}
                <span style={{ color: '#424242', fontWeight: 600 }}>
                  {result.skinTone.hex}
                </span>
                &ensp;·&ensp;Confidence:{' '}
                <span style={{ color: '#4caf50' }}>
                  {Math.round(result.skinTone.confidence * 100)}%
                </span>
              </Typography>

              {!result.skinTone.faceDetected && (
                <Typography variant="body2" sx={{ color: '#ff9800', mt: 0.5 }}>
                  Face not clearly detected — results may be approximate
                </Typography>
              )}
            </Box>

            <Button
              size="small"
              startIcon={<RefreshIcon />}
              variant="outlined"
              onClick={handleRetry}
              className={styles.secondaryBtn}
            >
              Try Again
            </Button>
          </Box>

          <Typography variant="subtitle1" className={styles.colorPaletteTitle}>
            Your Recommended Color Palette
          </Typography>

          <Box className={styles.colorsContainer}>
            {result.recommendedColors.slice(0, 10).map((color) => (
              <Tooltip key={color} title={color} arrow>
                <Chip
                  label={color}
                  style={{
                    background: getHex(color),
                    color: LIGHT_COLORS.has(color) ? '#111' : '#fff',
                  }}
                  className={styles.colorChip}
                />
              </Tooltip>
            ))}
          </Box>

          <Divider className={styles.divider} />

          <Box className={styles.tabsContainer}>
            {[
              { id: 'outfits', label: 'Outfit Combinations', icon: <OutfitIcon sx={{ fontSize: 16 }} /> },
              { id: 'individual', label: 'Individual Products', icon: <BagIcon sx={{ fontSize: 16 }} /> },
            ].map((tab) => (
              <Button
                key={tab.id}
                size="small"
                startIcon={tab.icon}
                variant={outfitTab === tab.id ? 'contained' : 'outlined'}
                onClick={() => setOutfitTab(tab.id as 'outfits' | 'individual')}
                className={outfitTab === tab.id ? styles.tabActive : styles.tabInactive}
              >
                {tab.label}
              </Button>
            ))}
          </Box>

          {outfitTab === 'outfits' && (
            <>
              <Typography variant="body2" className={styles.outfitSubtitle}>
                Complete formal outfit combinations curated for your skin tone
              </Typography>

              {result.outfits.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {result.outfits.map((outfit, i) => (
                    <Box key={i}>
                      <OutfitCard outfit={outfit} index={i} onSelect={() => setSelectedOutfitIndex(i)} />
                      {i < result.outfits.length - 1 && <Divider sx={{ mt: 4 }} />}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Alert severity="warning" className={styles.alertWarning}>
                  No outfit combinations found. Try browsing the individual
                  products below.
                </Alert>
              )}
            </>
          )}

          {outfitTab === 'individual' && (
            <>
              {([
                { label: 'Formal Shirts', items: result.recommendations.topwear, cat: 'Formal+Shirts' },
                { label: 'Trousers & Pants', items: result.recommendations.pants, cat: 'Trousers+%26+Pants' },
                { label: 'Formal Shoes', items: result.recommendations.shoes, cat: 'Formal+Shoes' },
              ] as const).map(({ label, items, cat }) =>
                items.length > 0 ? (
                  <Box key={label} sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="subtitle1" className={styles.categoryTitle}>
                        {label}
                      </Typography>

                      <Button
                        size="small"
                        endIcon={<ArrowIcon />}
                        onClick={() => navigate(`/products?category=${cat}`)}
                        className={styles.viewAllBtn}
                      >
                        View All
                      </Button>
                    </Box>

                    <RecommendedProductsGrid items={items.slice(0, 4)} />
                  </Box>
                ) : null
              )}
            </>
          )}

          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowIcon />}
              onClick={() => {
                handleClose();
                navigate('/products');
              }}
              className={styles.primaryBtn}
            >
              Browse Full Collection
            </Button>
          </Box>
        </Box>

        <OutfitConfigDialog
          outfit={selectedOutfitIndex !== null ? result.outfits[selectedOutfitIndex] : null}
          index={selectedOutfitIndex ?? 0}
          open={selectedOutfitIndex !== null}
          onClose={() => setSelectedOutfitIndex(null)}
        />
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="lg" sx={{ py: 4 }}>
      {fileInput}

      <Box sx={{ mb: 1 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Find Your Style
        </Typography>
        <Box className={styles.breadcrumb}>
          <Typography variant="body2">Select your photo</Typography>
          <ChevronRightIcon className={styles.breadcrumbIcon} />
          <Typography variant="body2">Preview</Typography>
          <ChevronRightIcon className={styles.breadcrumbIcon} />
          <Typography variant="body2">Skin tone detected</Typography>
          <ChevronRightIcon className={styles.breadcrumbIcon} />
          <Typography variant="body2">Outfit recommendations generated</Typography>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 560, mx: 'auto', mt: 4 }}>
          {step === 'choose' && (
            <Box className={styles.stepContainer}>
              {error && (
                <Alert severity="error" className={styles.alertError}>
                  {error}
                </Alert>
              )}

              <UploadIcon className={styles.uploadIcon} />

              <Typography variant="h6" className={styles.stepTitle}>
                Select Your Photo
              </Typography>

              <Typography variant="body2" className={styles.stepSubtitle}>
                Upload a clear photo of your face to get personalized color
                and outfit recommendations.
              </Typography>

              <Button
                variant="contained"
                size="large"
                startIcon={<UploadIcon />}
                onClick={handleChoosePhoto}
                className={styles.primaryBtn}
              >
                Select Photo
              </Button>

              <Typography variant="caption" sx={{ display: 'block', color: '#555', mt: 2 }}>
                JPG, PNG, WEBP supported · Maximum 10MB
              </Typography>
            </Box>
          )}

          {step === 'preview' && imageFile && previewUrl && (
            <Box className={styles.stepContainer} sx={{ py: 2 }}>
              {error && (
                <Alert severity="error" className={styles.alertError}>
                  {error}
                </Alert>
              )}

              <Typography variant="h6" className={styles.stepTitle}>
                Preview Your Photo
              </Typography>

              <Typography variant="body2" className={styles.stepSubtitle} sx={{ mb: 3 }}>
                If the photo looks correct, click Analyze to get your
                personalized recommendations.
              </Typography>

              <Box className={styles.previewContainer}>
                <img
                  src={previewUrl}
                  alt="Selected preview"
                  className={styles.previewImg}
                />
              </Box>

              <Box className={styles.actionButtons}>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowIcon />}
                  onClick={handleAnalyze}
                  className={styles.primaryBtn}
                >
                  Analyze & Get Outfits
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleRetry}
                  className={styles.secondaryBtn}
                >
                  Choose Another Photo
                </Button>
              </Box>
            </Box>
          )}

          {step === 'analyzing' && (
            <Box className={styles.stepContainer} sx={{ py: 8 }}>
              <CircularProgress size={72} thickness={2} className={styles.spinner} />

              <Typography variant="h6" className={styles.stepTitle}>
                Analyzing your skin tone...
              </Typography>

              <Typography variant="body2" sx={{ color: '#555' }}>
                Detecting face → Estimating skin tone → Finding matching
                colors → Building outfit combinations
              </Typography>
            </Box>
          )}
      </Box>
    </Container>
  );
});

export default SkinToneAdvisor;
