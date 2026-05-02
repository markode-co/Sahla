"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { CartItem, OrderStatus } from "@/types";

export async function createOrder(data: {
  storeId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerEmail?: string;
  paymentMethod: string;
  notes?: string;
  items: CartItem[];
  receiptUrl?: string | null;
}) {
  const supabase = await createClient();

  const totalAmount = data.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      store_id: data.storeId,
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      customer_address: data.customerAddress,
      customer_email: data.customerEmail || null,
      payment_method: data.paymentMethod,
      notes: data.notes || null,
      total_amount: totalAmount,
      status: "pending",
    })
    .select()
    .single();

  if (orderError || !order) throw new Error(orderError?.message ?? "فشل إنشاء الطلب");

  const orderItems = data.items.map((item) => ({
    order_id: order.id,
    product_id: item.product.id,
    product_name: item.product.name,
    product_price: item.product.price,
    quantity: item.quantity,
  }));

  await supabase.from("order_items").insert(orderItems);

  await supabase.from("payments").insert({
    order_id: order.id,
    method: data.paymentMethod,
    receipt_url: data.receiptUrl ?? null,
    status: "pending",
  });

  return order;
}

export async function getMerchantOrders(storeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items(*),
      payments(*)
    `)
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/merchant/orders");
  revalidatePath("/dashboard/admin/orders");
}

export async function getAllOrders() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      stores(name, slug),
      order_items(*),
      payments(*)
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}
