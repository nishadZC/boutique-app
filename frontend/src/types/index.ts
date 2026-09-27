export interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: string;
  brand?: string;
  inventory: number;
  inventory_quantity?: number;
  rating?: number;
  reviewCount?: number;
  color?: string;
  sizes?: string[];
  isNew?: boolean;
  /** Made by hand in the atelier. */
  isHandcrafted?: boolean;
  /** Can be tailored to the customer's measurements. */
  madeToMeasure?: boolean;
  /** Working days to tailor a made-to-measure order. */
  makingDays?: number | null;
  discountPercentage?: number;
  createdAt: string;
  updatedAt: string;
  images?: ProductImage[];
}

export interface ProductImage {
  url: string;
  alt: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'admin';
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'pending' | 'confirmed' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  subtotalAmount?: number;
  shippingAmount?: number;
  taxAmount?: number;
  status: OrderStatus;
  shippingAddress: Address | { address: string } | string;
  paymentStatus: PaymentStatus;
  paidAt?: string | null;
  /** Status changes with timestamps, oldest first. */
  timeline?: { status: OrderStatus; at: string }[];
  /** Cancellation and return/refund requests, newest first. */
  requests?: OrderRequest[];
  createdAt: string;
  updatedAt: string;
}

export type OrderRequestType = 'cancel' | 'return' | 'refund';
/** pending: awaiting an admin; closed: cancelled before payment, nothing to refund. */
export type OrderRequestStatus = 'pending' | 'refunded' | 'rejected' | 'closed';

export interface OrderRequest {
  id: string;
  type: OrderRequestType;
  reason: string;
  details: string;
  status: OrderRequestStatus;
  resolutionNote: string;
  refundId: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  size?: string;
  product: Pick<Product, 'id' | 'name' | 'imageUrl' | 'category'> & { brand?: string };
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

/** Returned instead of a session when the account must choose a new password first. */
export interface PasswordChangeRequired {
  passwordChangeRequired: true;
  passwordChangeToken: string;
  user: { email: string; firstName?: string };
}

export type LoginResult = { passwordChangeRequired: false } | PasswordChangeRequired;

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}