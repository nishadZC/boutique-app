export const ROUTES = {
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  CART: '/cart',
  WISHLIST: '/wishlist',
  ORDERS: '/orders',
  PROFILE: '/profile',
  STYLE_ADVISOR: '/style-advisor',
} as const;

export type RouteKey = keyof typeof ROUTES;