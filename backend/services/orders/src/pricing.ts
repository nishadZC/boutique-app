// Order pricing. The storefront cart shows the same numbers
// (frontend/src/utils/cartPricing.ts); keep the two in step.
export const FREE_SHIPPING_THRESHOLD = 500;
export const SHIPPING_FEE = 15;
export const TAX_RATE = 0.08;

const round2 = (n: number) => Math.round(n * 100) / 100;

export function priceOrder(lines: { price: number; quantity: number }[]) {
  const subtotal = round2(lines.reduce((sum, l) => sum + l.price * l.quantity, 0));
  const shipping = subtotal > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const tax = round2(subtotal * TAX_RATE);
  return { subtotal, shipping, tax, total: round2(subtotal + shipping + tax) };
}
