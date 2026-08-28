import React from 'react';
import { Card, CardMedia, Chip, Box, CardContent, Typography, CardActions, Button } from '@mui/material';
import { ShoppingBag as BagIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ProductItem } from 'services/skinToneService';
import { getProductImage, handleRecommendationImageError } from 'utils/imageHelpers';

interface MiniCardProps {
  product: ProductItem;
  label: string;
}

const MiniProductCard: React.FC<MiniCardProps> = ({ product, label }) => {
  const navigate = useNavigate();

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
        <CardMedia
          component="img"
          height="140"
          image={getProductImage(product)}
          alt={product.name}
          onError={handleRecommendationImageError}
          sx={{ objectFit: 'cover' }}
        />
        <Chip
          label={label}
          size="small"
          sx={{
            position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.75)',
            color: '#d4af37', fontSize: '0.65rem', fontWeight: 700, height: 20
          }}
        />
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
        <Button
          size="small"
          variant="outlined"
          fullWidth
          startIcon={<BagIcon sx={{ fontSize: 13 }} />}
          onClick={e => { e.stopPropagation(); navigate(`/products/${product.id}`); }}
          sx={{
            fontSize: '0.68rem', py: 0.4, color: '#888', borderColor: '#333',
            '&:hover': { borderColor: '#d4af37', color: '#d4af37' }
          }}
        >
          Add to Cart
        </Button>
      </CardActions>
    </Card>
  );
};

export default MiniProductCard;
