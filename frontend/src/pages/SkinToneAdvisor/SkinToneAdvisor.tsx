import React, { memo, useState } from 'react';
import {
  Container, Box, Button, Typography, CircularProgress, Alert,
} from '@mui/material';
import {
  Upload as UploadIcon,
  ArrowForward as ArrowIcon, Refresh as RefreshIcon, ShoppingBag as BagIcon,
  CheckroomOutlined as OutfitIcon, ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { getHex } from 'constants/colors';
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
    const confidence = Math.round(result.skinTone.confidence * 100);
    const tabs = [
      { id: 'outfits', label: 'Outfit Combinations', icon: <OutfitIcon fontSize="inherit" /> },
      { id: 'individual', label: 'Individual Pieces', icon: <BagIcon fontSize="inherit" /> },
    ] as const;

    return (
      <Box component="main" className={styles.page}>
        {fileInput}

        {/* ---------- Profile hero ---------- */}
        <Box component="section" className={styles.hero}>
          <Container maxWidth="lg" className={styles.heroInner}>
            <Box className={styles.heroText}>
              <Typography variant="overline" className={styles.eyebrow}>Style Advisor · Your profile</Typography>
              <Typography variant="h1" className={styles.heroTitle}>
                Your Style<br />Recommendations
              </Typography>
              <Typography className={styles.heroSubtitle}>
                A palette and outfits chosen to flatter your complexion — every piece in stock and ready to wear.
              </Typography>
            </Box>

            <Box className={styles.profileCard}>
              <Box className={styles.swatchRing}>
                <Box className={styles.swatch} style={{ background: result.skinTone.hex }} />
              </Box>
              <Box className={styles.profileBody}>
                <Typography className={styles.profileLabel}>Detected skin tone</Typography>
                <Typography className={styles.profileName}>{result.skinTone.name}</Typography>
                <Typography className={styles.profileHex}>{result.skinTone.hex.toUpperCase()}</Typography>

                <Box className={styles.confidence}>
                  <Box className={styles.confidenceRow}>
                    <span>Confidence</span>
                    <span className={styles.confidenceValue}>{confidence}%</span>
                  </Box>
                  <Box className={styles.confidenceTrack}>
                    <Box className={styles.confidenceFill} style={{ width: `${confidence}%` }} />
                  </Box>
                </Box>

                {!result.skinTone.faceDetected && (
                  <Typography className={styles.profileWarning}>
                    Face not clearly detected — results may be approximate.
                  </Typography>
                )}

                <button type="button" onClick={handleRetry} className={styles.textBtn}>
                  <RefreshIcon fontSize="inherit" /> Try another photo
                </button>
              </Box>
            </Box>
          </Container>
        </Box>

        <Container maxWidth="lg" className={styles.body}>
          {/* ---------- Palette ---------- */}
          <Box component="section" className={styles.section}>
            <Box className={styles.sectionHead}>
              <Typography variant="overline" className={styles.eyebrow}>Your palette</Typography>
              <Typography variant="h2" className={styles.sectionTitle}>Colours that flatter you</Typography>
            </Box>
            <Box className={styles.palette}>
              {result.recommendedColors.slice(0, 10).map((color) => (
                <Box key={color} className={styles.paletteItem}>
                  <Box className={styles.paletteSwatch} style={{ background: getHex(color) }} />
                  <Typography className={styles.paletteName}>{color}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* ---------- Tabs ---------- */}
          <Box className={styles.tabs} role="tablist" aria-label="Recommendation type">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={outfitTab === tab.id}
                onClick={() => setOutfitTab(tab.id)}
                className={`${styles.tab} ${outfitTab === tab.id ? styles.tabActive : ''}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </Box>

          {outfitTab === 'outfits' && (
            <Box component="section" className={styles.tabPanel}>
              <Typography className={styles.tabIntro}>
                Complete formal looks — shirt, trousers and shoes — built around your palette.
              </Typography>

              {result.outfits.length > 0 ? (
                <Box className={styles.outfitList}>
                  {result.outfits.map((outfit, i) => (
                    <OutfitCard key={i} outfit={outfit} index={i} onSelect={() => setSelectedOutfitIndex(i)} />
                  ))}
                </Box>
              ) : (
                <Alert severity="warning" className={styles.alertWarning}>
                  No outfit combinations found. Try browsing the individual pieces instead.
                </Alert>
              )}
            </Box>
          )}

          {outfitTab === 'individual' && (
            <Box component="section" className={styles.tabPanel}>
              {([
                { label: 'Formal Shirts', items: result.recommendations.topwear, cat: 'Formal+Shirts' },
                { label: 'Trousers & Pants', items: result.recommendations.pants, cat: 'Trousers+%26+Pants' },
                { label: 'Formal Shoes', items: result.recommendations.shoes, cat: 'Formal+Shoes' },
              ] as const).map(({ label, items, cat }) =>
                items.length > 0 ? (
                  <Box key={label} className={styles.category}>
                    <Box className={styles.categoryHead}>
                      <Typography variant="overline" className={styles.categoryTitle}>{label}</Typography>
                      <button type="button" onClick={() => navigate(`/products?category=${cat}`)} className={styles.textBtn}>
                        View all <ArrowIcon fontSize="inherit" />
                      </button>
                    </Box>
                    <RecommendedProductsGrid items={items.slice(0, 4)} />
                  </Box>
                ) : null
              )}
            </Box>
          )}

          <Box className={styles.footerCta}>
            <Button
              endIcon={<ArrowIcon />}
              onClick={() => {
                handleClose();
                void navigate('/products');
              }}
              className={styles.primaryBtn}
            >
              Browse the full collection
            </Button>
          </Box>
        </Container>

        <OutfitConfigDialog
          outfit={selectedOutfitIndex !== null ? result.outfits[selectedOutfitIndex] : null}
          index={selectedOutfitIndex ?? 0}
          open={selectedOutfitIndex !== null}
          onClose={() => setSelectedOutfitIndex(null)}
        />
      </Box>
    );
  }

  return (
    <Box component="main" className={styles.page}>
    <Container maxWidth="lg" className={styles.body}>
      {fileInput}

      <Box className={styles.stepHeader}>
        <Typography variant="overline" className={styles.eyebrow}>Style Advisor</Typography>
        <Typography variant="h1" className={styles.heroTitle}>
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

      <Box className={styles.stepPanel}>
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

              <Typography variant="caption" className={styles.stepHint}>
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

              <Typography variant="body2" className={styles.stepSubtitle}>
                Detecting face → Estimating skin tone → Finding matching
                colors → Building outfit combinations
              </Typography>
            </Box>
          )}
      </Box>
    </Container>
    </Box>
  );
});

export default SkinToneAdvisor;
