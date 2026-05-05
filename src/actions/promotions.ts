"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getPromotions(storeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function createPromotion(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("غير مصرح");

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!store) throw new Error("لم يتم العثور على المتجر");

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const discount_percent = parseInt((formData.get("discount_percent") as string) || "0", 10);
  const is_active = formData.get("is_active") === "on";
  const starts_at = (formData.get("starts_at") as string)?.trim() || null;
  const ends_at = (formData.get("ends_at") as string)?.trim() || null;

  const { error } = await supabase.from("promotions").insert({
    store_id: store.id,
    title,
    description: description || null,
    discount_percent,
    is_active,
    starts_at,
    ends_at,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/merchant/promotions");
}

export async function updatePromotion(
  promotionId: string,
  data: {
    title: string;
    description: string;
    discount_percent: number;
    is_active: boolean;
    starts_at: string | null;
    ends_at: string | null;
  }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("promotions")
    .update({
      title: data.title,
      description: data.description || null,
      discount_percent: data.discount_percent,
      is_active: data.is_active,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", promotionId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/merchant/promotions");
}

export async function deletePromotion(promotionId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("promotions")
    .delete()
    .eq("id", promotionId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/merchant/promotions");
}
