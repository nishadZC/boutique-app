import apiClient from './api';
import { Product } from '../types';

// Helper function to get proper image URL
const getImageUrl = (product: any): string => {
  // Backend is now handling image mapping, so just return the image_url as-is
  if (product.image_url) {
    return product.image_url;
  }
  
  // Default fallback
  return 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787585185/boutique/products/405dce7e-bed9-4d33-81c2-9a3045d65312.jpg';
};

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', 'One Size'];

/** Maps a product-service row (snake_case) to the storefront Product. */
const toProduct = (product: any): Product => ({
  id: product.id,
  name: product.name,
  description: product.description,
  price: Number.parseFloat(product.price),
  originalPrice: product.compare_price ? Number.parseFloat(product.compare_price) : undefined,
  imageUrl: getImageUrl(product),
  category: product.category || product.category_id,
  brand: product.brand,
  inventory: product.inventory_quantity || product.inventory || 0,
  rating: Number(product.rating) || 0,
  reviewCount: Number(product.review_count) || 0,
  color: product.base_colour || '',
  sizes: ALL_SIZES,
  isNew: !!product.is_featured,
  isHandcrafted: !!product.is_handcrafted,
  madeToMeasure: !!product.made_to_measure,
  makingDays: product.making_days ?? null,
  discountPercentage: product.discountPercentage,
  createdAt: product.created_at,
  updatedAt: product.updated_at,
  images: product.images || [],
});

export const productService = {
  getAll: async (): Promise<Product[]> => {
    const response = await apiClient.get('/products?limit=100');
    const apiResponse = response.data;
    if (apiResponse.success && apiResponse.data?.products) return apiResponse.data.products.map(toProduct);
    return Array.isArray(apiResponse) ? apiResponse.map(toProduct) : [];
  },

  getById: async (id: string): Promise<Product> => {
    const response = await apiClient.get(`/products/${id}`);
    return toProduct(response.data.data || response.data);
  },

  getByCategory: async (category: string): Promise<Product[]> => {
    const response = await apiClient.get(`/products?category=${category}`);
    return response.data;
  },

  search: async (query: string): Promise<Product[]> => {
    const response = await apiClient.get(`/products/search?q=${query}`);
    return response.data;
  },
};