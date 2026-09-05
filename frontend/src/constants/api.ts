const BASE = import.meta.env.VITE_API_URL || '/api';

export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: `${BASE}/auth/login`,
  AUTH_REGISTER: `${BASE}/auth/register`,
  AUTH_LOGOUT: `${BASE}/auth/logout`,
  AUTH_ME: `${BASE}/auth/me`,
  AUTH_GOOGLE: `${BASE}/auth/google`,
  AUTH_REFRESH: `${BASE}/auth/refresh`,

  // Users
  USER_PROFILE: `${BASE}/users/profile`,
  USER_ADDRESSES: `${BASE}/users/addresses`,

  // Products
  PRODUCTS: `${BASE}/products`,
  PRODUCT_DETAIL: (id: string) => `${BASE}/products/${id}`,

  // Cart (client-side only)

  // Orders
  ORDERS: `${BASE}/orders`,
  ORDER_DETAIL: (id: string) => `${BASE}/orders/${id}`,

  // Payments
  PAYMENT_CREATE: `${BASE}/payments/create-order`,
  PAYMENT_VERIFY: `${BASE}/payments/verify`,
  PAYMENT_FAIL: (id: string) => `${BASE}/payments/${id}/fail`,

  // Wishlist
  WISHLIST: `${BASE}/wishlist`,
  WISHLIST_ITEM: (id: string) => `${BASE}/wishlist/${id}`,

  // Skin Tone
  SKIN_TONE_RECOMMEND: `${BASE}/skin-tone/recommend`,
} as const;