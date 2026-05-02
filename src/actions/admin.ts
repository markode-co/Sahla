"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { StoreStatus } from "@/types";

export async function getAllMerchants() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select(`
      *,
      stores(*),
      subscriptions(*),
      documents(*)
    `)
    .eq("role", "merchant")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateStoreStatus(
  storeId: string,
  status: StoreStatus,
  rejectionReason?: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("stores")
    .update({
      status,
      rejection_reason: rejectionReason || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", storeId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/admin/merchants");
}

export async function updateSubscription(
  userId: string,
  plan: string,
  status: string
) {
  const supabase = await createClient();
  const { error } = await supabase.from("subscriptions").upsert({
    user_id: userId,
    plan,
    status,
    started_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/admin/subscriptions");
}

export async function getAdminStats() {
  const supabase = await createClient();

  const [merchantsRes, ordersRes, subscriptionsRes, pendingStoresRes] =
    await Promise.all([
      supabase.from("users").select("id", { count: "exact" }).eq("role", "merchant"),
      supabase.from("orders").select("id, total_amount, status", { count: "exact" }),
      supabase.from("subscriptions").select("id, plan", { count: "exact" }).eq("status", "active"),
      supabase.from("stores").select("id", { count: "exact" }).eq("status", "pending"),
    ]);

  const totalRevenue = (ordersRes.data ?? [])
    .filter((o) => o.status === "approved" || o.status === "delivered")
    .reduce((sum, o) => sum + (o.total_amount ?? 0), 0);

  return {
    totalMerchants: merchantsRes.count ?? 0,
    totalOrders: ordersRes.count ?? 0,
    activeSubscriptions: subscriptionsRes.count ?? 0,
    pendingStores: pendingStoresRes.count ?? 0,
    totalRevenue,
  };
}
