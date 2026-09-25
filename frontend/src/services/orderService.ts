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

};