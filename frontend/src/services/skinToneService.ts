/**
 * Recommendations Service
 * Calls POST /api/recommendations with multipart/form-data image
 * Express backend → FastAPI → PostgreSQL → returns outfit combinations
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export interface SkinToneInfo {
  name: string;
  hex: string;
  confidence: number;
  faceDetected: boolean;
}

export interface ProductItem {
  id: string;
  name: string;
  price: number;
  compare_price: number;
  brand: string;
  color: string;
  category: string;
  image_url: string;
}

export interface OutfitCombination {
  topwear: ProductItem;
  pants: ProductItem;
  shoes: ProductItem;
}

export interface RecommendationResult {
  success: boolean;
  skinTone: SkinToneInfo;
  recommendedColors: string[];
  recommendations: {
    topwear: ProductItem[];
    pants: ProductItem[];
    shoes: ProductItem[];
  };
  outfits: OutfitCombination[];
}

const FALLBACK_IMAGE = 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787585185/boutique/products/405dce7e-bed9-4d33-81c2-9a3045d65312.jpg';

const normalizeProductItem = (item: Partial<ProductItem> & { imageUrl?: string }): ProductItem => ({
  id: item.id || '',
  name: item.name || 'Formal Wear',
  price: Number(item.price || 0),
  compare_price: Number(item.compare_price || item.price || 0),
  brand: item.brand || 'Lux Atelier',
  color: item.color || 'Neutral',
  category: item.category || 'Formal Wear',
  image_url: item.image_url || item.imageUrl || FALLBACK_IMAGE,
});

export const recommendationService = {
  /**
   * Send an image file to Express POST /api/recommendations.
   * Express calls FastAPI, queries PostgreSQL, returns outfits.
   */
  async analyze(imageFile: File | Blob): Promise<RecommendationResult> {
    const formData = new FormData();
    formData.append('image', imageFile, 'face.jpg');

    const response = await fetch(`${API_BASE}/recommendations`, {
      method: 'POST',
      body: formData,
      // Do NOT set Content-Type — browser sets it with boundary automatically
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as any).error || `Request failed with status ${response.status}`);
    }

    const result = await response.json() as RecommendationResult;
    result.recommendations.topwear = (result.recommendations?.topwear || []).map(normalizeProductItem);
    result.recommendations.pants = (result.recommendations?.pants || []).map(normalizeProductItem);
    result.recommendations.shoes = (result.recommendations?.shoes || []).map(normalizeProductItem);
    result.outfits = (result.outfits || []).map(outfit => ({
      topwear: normalizeProductItem(outfit.topwear),
      pants: normalizeProductItem(outfit.pants),
      shoes: normalizeProductItem(outfit.shoes),
    }));
    return result;
  },

  /**
   * Convert a canvas data URL to a Blob for sending as multipart.
   */
  dataUrlToBlob(dataUrl: string): Blob {
    const [header, base64] = dataUrl.split(',');
    const mimeMatch = header.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  },

  /**
   * Capture current video frame as a Blob ready for upload.
   */
  captureVideoBlob(video: HTMLVideoElement): Blob {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    return this.dataUrlToBlob(dataUrl);
  },

  /**
   * Get preview URL from a File or Blob (for <img> preview).
   */
  getPreviewUrl(file: File | Blob): string {
    return URL.createObjectURL(file);
  },
};
