import { OrderRequest, OrderRequestType, OrderStatus, PaymentStatus } from './index';

export interface Pagination { page: number; limit: number; total: number; totalPages: number }

export interface AdminOrderSummary {
  id: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  itemCount: number;
  nextStatus: OrderStatus | null;
  /** Type of a cancellation/return still waiting for an admin, if any. */
  openRequest: OrderRequestType | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderEvent {
  type: 'created' | 'status' | 'payment_status' | 'stock_shortage' | 'stock_sync_failed' | string;
  fromValue: string | null;
  toValue: string | null;
  note: string;
  actor: string;
  createdAt: string;
}

export interface AdminOrderDetail extends Omit<AdminOrderSummary, 'itemCount'> {
  shippingAddress: { address?: string } | string | null;
  subtotalAmount: number;
  shippingAmount: number;
  taxAmount: number;
  stockCommitted: boolean;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  items: {
    id: string; productId: string; quantity: number; price: number; size: string | null;
    product: { id: string; name: string; imageUrl: string; category: string; brand: string };
  }[];
  events: AdminOrderEvent[];
  requests: OrderRequest[];
}

export interface Kpis {
  periodDays: number;
  revenue: number;
  previousRevenue: number;
  revenueChange: number | null;
  paidOrders: number;
  previousPaidOrders: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  failedPayments: number;
  /** Cancellations and returns waiting for an admin to refund or reject. */
  pendingRefundRequests: number;
  payingCustomers: number;
  pipeline: Record<'awaitingPayment' | 'confirmed' | 'packed' | 'shipped' | 'outForDelivery' | 'delivered' | 'cancelled', number>;
  revenueByDay: { date: string; revenue: number; orders: number }[];
  topProducts: { productId: string; name: string; imageUrl: string; units: number; revenue: number }[];
}

export interface AdminProduct {
  id: string;
  name: string;
  sku: string;
  brand: string;
  description: string;
  shortDescription: string;
  price: number;
  comparePrice: number | null;
  materials: string;
  careInstructions: string;
  inventoryQuantity: number;
  isFeatured: boolean;
  isActive: boolean;
  isHandcrafted: boolean;
  madeToMeasure: boolean;
  makingDays: number | null;
  baseColour: string;
  skinToneTags: string[];
  categoryId: string;
  category: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export type AdminProductInput = Partial<Omit<AdminProduct, 'id' | 'category' | 'isActive' | 'createdAt' | 'updatedAt'>>;

export interface InventorySummary {
  activeProducts: number;
  archivedProducts: number;
  outOfStock: number;
  lowStock: number;
  unitsInStock: number;
  retailValue: number;
  lowStockThreshold: number;
  lowStockProducts: AdminProduct[];
}

export interface InventoryAdjustment {
  id: string; delta: number; resultingQuantity: number; reason: string; note: string; actor: string;
  orderId: string | null; createdAt: string;
}

export interface Customer {
  id: string; email: string; firstName: string; lastName: string; role: 'customer' | 'admin'; phone: string | null;
  createdAt: string;
}

export interface CustomerContact { id: string; email: string; firstName: string; lastName: string; phone: string | null }
export interface CustomerOrderStats { orders: number; spent: number; lastOrderAt: string }
