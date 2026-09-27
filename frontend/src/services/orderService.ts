import apiClient from './api';
import { Order } from '../types';

export const orderService = {
  createOrder: async (orderData: {
    items: { productId: string; quantity: number; selectedSize?: string }[];
    shippingAddress: any;
  }): Promise<Order> => {
    const response = await apiClient.post('/orders', orderData);
    return response.data.data || response.data;
  },

  getUserOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get('/orders/my-orders');
    return response.data.data || response.data;
  },

  cancelOrder: async (orderId: string, reason: string, details?: string): Promise<string> => {
    const response = await apiClient.post(`/orders/${orderId}/cancel`, { reason, details });
    return response.data.message;
  },

  requestReturn: async (orderId: string, type: 'return' | 'refund', reason: string, details?: string): Promise<string> => {
    const response = await apiClient.post(`/orders/${orderId}/return`, { type, reason, details });
    return response.data.message;
  },

};