import apiClient from './api';

interface WishlistRow {
  product_id: string;
  created_at: string;
}

export const wishlistService = {
  async getProductIds(): Promise<string[]> {
    const response = await apiClient.get<{ data: WishlistRow[] }>('/wishlist');
    return response.data.data.map(item => item.product_id);
  },
  async add(productId: string): Promise<void> {
    await apiClient.post(`/wishlist/${productId}`);
  },
  async remove(productId: string): Promise<void> {
    await apiClient.delete(`/wishlist/${productId}`);
  },
};
