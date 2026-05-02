export type UserRole = "admin" | "merchant";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type StoreStatus = "pending" | "approved" | "rejected";

export interface Store {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  logo_color: string;
  logo_initials: string | null;
  status: StoreStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "delivered";

export type PaymentMethodType =
  | "instapay"
  | "bank_transfer"
  | "cash_on_delivery";

export interface Order {
  id: string;
  store_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_email: string | null;
  status: OrderStatus;
  payment_method: PaymentMethodType;
  notes: string | null;
  total_amount: number;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  payments?: Payment[];
  stores?: Store;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_price: number;
  quantity: number;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  method: string;
  receipt_url: string | null;
  status: "pending" | "verified" | "rejected";
  created_at: string;
}

export type SubscriptionPlan = "basic" | "pro" | "premium";

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: "active" | "expired" | "cancelled";
  started_at: string;
  expires_at: string | null;
  created_at: string;
}

export type DocumentType =
  | "national_id"
  | "commercial_register"
  | "tax_card";

export interface Document {
  id: string;
  user_id: string;
  type: DocumentType;
  file_url: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  store_id: string;
  instapay_username: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  cash_on_delivery: boolean;
  created_at: string;
  updated_at: string;
}

// Cart types (client-side only)
export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  storeId: string | null;
  storeSlug: string | null;
}

// Plan limits
export const PLAN_LIMITS: Record<SubscriptionPlan, { products: number; analytics: boolean; customization: boolean }> = {
  basic: { products: 20, analytics: false, customization: false },
  pro: { products: Infinity, analytics: false, customization: false },
  premium: { products: Infinity, analytics: true, customization: true },
};

export const PLAN_PRICES: Record<SubscriptionPlan, number> = {
  basic: 99,
  pro: 199,
  premium: 399,
};
