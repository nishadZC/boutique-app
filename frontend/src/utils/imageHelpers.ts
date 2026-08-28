import React from 'react';
import { ProductItem } from 'services/skinToneService';

export const FALLBACK_IMAGE = 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787585185/boutique/products/405dce7e-bed9-4d33-81c2-9a3045d65312.jpg';

export const getProductImage = (product: ProductItem | any) => product?.image_url || FALLBACK_IMAGE;

export const handleRecommendationImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
  const image = event.currentTarget;
  if (image.src !== FALLBACK_IMAGE) image.src = FALLBACK_IMAGE;
};
