import apiClient from './api';
import {
  AdminOrderDetail, AdminOrderSummary, AdminProduct, AdminProductInput, Customer, CustomerContact,
  CustomerOrderStats, InventoryAdjustment, InventorySummary, Kpis, Pagination,
} from '../types/admin';
import { OrderStatus } from '../types';

const data = <T>(response: { data: { data: T } }) => response.data.data;

/** Pulls the API's error message out of an axios error for display. */
export const apiErrorMessage = (error: unknown, fallback: string): string =>
  (error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback;

export const adminService = {
  // Orders & KPIs
  getKpis: async (days: number) => data<Kpis>(await apiClient.get('/orders/admin/kpis', { params: { days } })),
  listOrders: async (params: Record<string, string | number | undefined>) =>
    data<{ orders: AdminOrderSummary[]; pagination: Pagination }>(await apiClient.get('/orders/admin/orders', { params })),
  getOrder: async (id: string) => data<AdminOrderDetail>(await apiClient.get(`/orders/admin/orders/${id}`)),
  updateOrderStatus: async (id: string, status: OrderStatus, note?: string) => {
    const response = await apiClient.patch(`/orders/admin/orders/${id}/status`, { status, note });
    return response.data as { data: AdminOrderSummary; refundRequired: boolean; message: string };
  },
  recordRefund: async (id: string, note: string) => data(await apiClient.post(`/orders/admin/orders/${id}/refund`, { note })),
  customerOrderStats: async (userIds: string[]) =>
    userIds.length
      ? data<Record<string, CustomerOrderStats>>(await apiClient.get('/orders/admin/customers/summary', { params: { userIds: userIds.join(',') } }))
      : {},

  // Catalogue & inventory
  listCategories: async () => data<{ id: string; name: string; productCount: number }[]>(await apiClient.get('/products/admin/categories')),
  listProducts: async (params: Record<string, string | number | undefined>) =>
    data<{ products: AdminProduct[]; pagination: Pagination }>(await apiClient.get('/products/admin/products', { params })),
  getProduct: async (id: string) => data<AdminProduct>(await apiClient.get(`/products/admin/products/${id}`)),
  createProduct: async (input: AdminProductInput) => data<AdminProduct>(await apiClient.post('/products/admin/products', input)),
  updateProduct: async (id: string, input: AdminProductInput) => data<AdminProduct>(await apiClient.put(`/products/admin/products/${id}`, input)),
  setProductActive: async (id: string, isActive: boolean) =>
    data<AdminProduct>(await apiClient.patch(`/products/admin/products/${id}/status`, { isActive })),
  uploadProductImage: async (id: string, file: File) => {
    const form = new FormData();
    form.append('image', file);
    return data<{ imageUrl: string }>(await apiClient.post(`/products/admin/products/${id}/image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000,
    }));
  },
  adjustInventory: async (id: string, body: { mode: 'set' | 'adjust'; quantity: number; reason: string; note?: string }) =>
    data<{ previousQuantity: number; inventoryQuantity: number }>(await apiClient.post(`/products/admin/products/${id}/inventory`, body)),
  inventoryHistory: async (id: string) => data<InventoryAdjustment[]>(await apiClient.get(`/products/admin/products/${id}/inventory-history`)),
  inventorySummary: async () => data<InventorySummary>(await apiClient.get('/products/admin/inventory/summary')),

  // Customers
  listCustomers: async (params: Record<string, string | number | undefined>) =>
    data<{ customers: Customer[]; pagination: Pagination; summary: { totalAccounts: number; newLast30Days: number; admins: number } }>(
      await apiClient.get('/users/admin/customers', { params })),
  lookupCustomers: async (ids: string[]) =>
    ids.length
      ? data<Record<string, CustomerContact>>(await apiClient.get('/users/admin/customers/lookup', { params: { ids: [...new Set(ids)].join(',') } }))
      : {},
};
