import apiClient from './api';

export interface Review { id: string; productId: string; rating: number; title: string; comment: string; reviewerName: string; createdAt: string }
export interface ReviewSummary { count: number; average: number; distribution: Record<1 | 2 | 3 | 4 | 5, number> }

export const reviewService = {
  forProduct: async (productId: string, limit = 10) => {
    const response = await apiClient.get(`/products/reviews/product/${productId}`, { params: { limit } });
    return response.data.data as { reviews: Review[]; summary: ReviewSummary };
  },
  mineForOrder: async (orderId: string) => {
    const response = await apiClient.get('/products/reviews/mine', { params: { orderId } });
    return response.data.data as { productId: string; rating: number }[];
  },
  create: async (input: { productId: string; orderId: string; rating: number; title?: string; comment?: string }) => {
    const response = await apiClient.post('/products/reviews', input);
    return response.data.data as Review;
  },
};
