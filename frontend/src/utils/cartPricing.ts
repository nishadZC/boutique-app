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
  const shipping = subtotal > 500 ? 0 : 15;
  const tax = subtotal * 0.08;

  return { subtotal, shipping, tax, total: subtotal + shipping + tax };
};