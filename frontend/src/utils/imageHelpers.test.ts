import { describe, it, expect } from 'vitest';
import { FALLBACK_IMAGE, getProductImage, handleRecommendationImageError } from './imageHelpers';

describe('imageHelpers', () => {
  it('getProductImage', () => {
    expect(getProductImage({ image_url: 'x' })).toBe('x');
    expect(getProductImage(null)).toBe(FALLBACK_IMAGE);
  });
  it('handleRecommendationImageError swaps to fallback once', () => {
    const img = { src: 'bad' };
    handleRecommendationImageError({ currentTarget: img } as never);
    expect(img.src).toBe(FALLBACK_IMAGE);
    handleRecommendationImageError({ currentTarget: img } as never);
    expect(img.src).toBe(FALLBACK_IMAGE);
  });
});
