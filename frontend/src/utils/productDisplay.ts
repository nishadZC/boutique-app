import { Product } from '../types';

export const PLACEHOLDER_IMAGE = 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787585185/boutique/products/405dce7e-bed9-4d33-81c2-9a3045d65312.jpg';

export const getProductInventory = (product: Product): number =>
  product.inventory_quantity ?? product.inventory ?? 0;

export const isProductOutOfStock = (product: Product): boolean =>
  getProductInventory(product) === 0;

export const formatProductPrice = (price: Product['price'] | string | undefined): string => {
  const numericPrice = typeof price === 'string' ? Number.parseFloat(price) : price;
  return numericPrice !== undefined && Number.isFinite(numericPrice)
    ? numericPrice.toFixed(2)
    : '0.00';
};

export const getProductImage = (product: Product): string =>
  product.imageUrl || PLACEHOLDER_IMAGE;

export const hasDiscount = (product: Product): boolean =>
  Boolean(product.originalPrice && product.originalPrice > product.price);
