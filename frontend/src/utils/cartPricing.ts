import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST, TAX_RATE } from '../constants/config';

interface PricedCartItem {
  price: number | string;
  quantity: number;
}

export interface CartTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export const getItemPrice = (item: PricedCartItem): number =>
  typeof item.price === 'string' ? parseFloat(item.price) : item.price;

export const calculateCartTotals = (items: PricedCartItem[]): CartTotals => {
  const subtotal = items.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0);
  const shipping = subtotal > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;

  return { subtotal, shipping, tax, total: subtotal + shipping + tax };
};