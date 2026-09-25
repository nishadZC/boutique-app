// Calls to the product service. All requests carry the internal token so that
// archived products still resolve (order history) and stock can be committed.
import axios from 'axios';

const PRODUCTS_SERVICE_URL = process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3003';
const headers = () => ({ 'x-internal-token': process.env.INTERNAL_API_TOKEN ?? '' });

export interface ProductSnapshot {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  brand: string;
  inventoryQuantity: number;
  isActive: boolean;
}

export async function getProduct(productId: string): Promise<ProductSnapshot | null> {
  try {
    const response = await axios.get(`${PRODUCTS_SERVICE_URL}/${productId}`, { headers: headers(), timeout: 5000 });
    const p = response.data.data;
    return {
      id: p.id,
      name: p.name,
      price: Number(p.price),
      imageUrl: p.image_url ?? '',
      category: p.category ?? '',
      brand: p.brand ?? '',
      inventoryQuantity: Number(p.inventory_quantity ?? 0),
      isActive: p.is_active !== false,
    };
  } catch (error: any) {
    if (error?.response?.status === 404) return null;
    throw error;
  }
}

/** Looks up several products at once, tolerating ones that no longer exist. */
export async function getProducts(productIds: string[]): Promise<Map<string, ProductSnapshot>> {
  const unique = [...new Set(productIds)];
  const results = await Promise.all(unique.map(id => getProduct(id).catch(() => null)));
  const map = new Map<string, ProductSnapshot>();
  results.forEach(p => { if (p) map.set(p.id, p); });
  return map;
}

export async function commitStock(orderId: string, direction: 'sale' | 'restock', items: { productId: string; quantity: number }[]) {
  const response = await axios.post(
    `${PRODUCTS_SERVICE_URL}/internal/inventory/commit`,
    { orderId, direction, items },
    { headers: headers(), timeout: 10000 },
  );
  return response.data.data as { shortages: { productId: string; requested: number; available: number }[] };
}
