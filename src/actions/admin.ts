"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { StoreStatus } from "@/types";

export async function getAllMerchants() {
  const supabase = createAdminClient();

  const { data: merchants, error: merchantsError } = await supabase
    .from("users")
    .select("*")
    .eq("role", "merchant")
    .order("created_at", { ascending: false });

  if (merchantsError) throw new Error(merchantsError.message);

  const merchantIds = (merchants ?? []).map((merchant) => merchant.id);

  const [storesRes, subscriptionsRes, documentsRes] = await Promise.all([
    merchantIds.length > 0
      ? supabase.from("stores").select("*").in("user_id", merchantIds)
      : Promise.resolve({ data: [] }),
    merchantIds.length > 0
      ? supabase.from("subscriptions").select("*").in("user_id", merchantIds)
      : Promise.resolve({ data: [] }),
    merchantIds.length > 0
      ? supabase.from("documents").select("*").in("user_id", merchantIds)
      : Promise.resolve({ data: [] }),
  ]);

  const storesByUserId = new Map((storesRes.data ?? []).map((store: any) => [store.user_id, store]));
  const subscriptionsByUserId = new Map((subscriptionsRes.data ?? []).map((subscription: any) => [subscription.user_id, subscription]));
  const documentsByUserId = new Map<string, any[]>();

  (documentsRes.data ?? []).forEach((doc: any) => {
    const current = documentsByUserId.get(doc.user_id) ?? [];
    current.push(doc);
    documentsByUserId.set(doc.user_id, current);
  });

  return (merchants ?? []).map((merchant) => ({
    ...merchant,
    stores: storesByUserId.has(merchant.id) ? [storesByUserId.get(merchant.id)] : [],
    subscriptions: subscriptionsByUserId.has(merchant.id) ? [subscriptionsByUserId.get(merchant.id)] : [],
    documents: documentsByUserId.get(merchant.id) ?? [],
  }));
}

export async function updateStoreStatus(
  storeId: string,
  status: StoreStatus,
  rejectionReason?: string
) {
  const supabase = createAdminClient();
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
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  const payload: Record<string, string> = { plan, status };
  if (!existing) payload.started_at = new Date().toISOString();

  const { error } = existing
    ? await supabase.from("subscriptions").update(payload).eq("user_id", userId)
    : await supabase.from("subscriptions").insert({ user_id: userId, ...payload, started_at: new Date().toISOString() });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/admin/subscriptions");
}

export async function deleteSubscription(subscriptionId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("id", subscriptionId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/admin/subscriptions");
}

export async function getAdminStats() {
  const supabase = createAdminClient();

  const [merchantsRes, ordersRes, subscriptionsRes, pendingStoresRes] =
    await Promise.all([
      supabase.from("users").select("id", { count: "exact" }).eq("role", "merchant"),
      supabase.from("orders").select("id, total_amount, status", { count: "exact" }),
      supabase.from("subscriptions").select("id, plan", { count: "exact" }).eq("status", "active"),
      supabase.from("stores").select("id", { count: "exact" }).eq("status", "pending"),
    ]);

  const totalRevenue = (ordersRes.data ?? [])
    .filter((o) => o.status === "approved" || o.status === "delivered")
    .reduce(
      (sum, o) => sum + Number(o.total_amount ?? 0),
      0
    );

  return {
    totalMerchants: merchantsRes.count ?? 0,
    totalOrders: ordersRes.count ?? 0,
    activeSubscriptions: subscriptionsRes.count ?? 0,
    pendingStores: pendingStoresRes.count ?? 0,
    totalRevenue,
  };
}
