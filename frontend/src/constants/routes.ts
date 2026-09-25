export const ROUTES = {
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  CART: '/cart',
  WISHLIST: '/wishlist',
  ORDERS: '/orders',
  PROFILE: '/profile',
  STYLE_ADVISOR: '/style-advisor',
  ADMIN: '/admin',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_NEW_PRODUCT: '/admin/products/new',
  ADMIN_INVENTORY: '/admin/inventory',
  ADMIN_CUSTOMERS: '/admin/customers',
} as const;

export type RouteKey = keyof typeof ROUTES;