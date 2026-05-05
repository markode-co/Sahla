"use server";

import { createClient } from "@/lib/supabase/server";
import { sendDiscountAppliedNotification } from "./notifications";

export async function applyPromotion(promotionId: string, userId: string, totalAmount: number) {
  const supabase = await createClient();

  // Fetch promotion
  const { data: promotion, error: promError } = await supabase
    .from("promotions")
    .select("*")
    .eq("id", promotionId)
    .single();

  if (promError || !promotion) {
    throw new Error("العرض غير موجود");
  }

  // Check if promotion is active
  if (!promotion.is_active) {
    throw new Error("هذا العرض غير نشط");
  }

  // Check dates
  const now = new Date();
  if (promotion.starts_at && new Date(promotion.starts_at) > now) {
    throw new Error("هذا العرض لم يبدأ بعد");
  }
  if (promotion.ends_at && new Date(promotion.ends_at) < now) {
    throw new Error("هذا العرض انتهى");
  }

  // Calculate discount
  const discountAmount = (totalAmount * promotion.discount_percent) / 100;
  const finalAmount = totalAmount - discountAmount;

  // Send notification to user
  try {
    await sendDiscountAppliedNotification(
      userId,
      promotion.store_id,
      promotion.discount_percent,
      discountAmount
    );
  } catch (err) {
    console.warn("Failed to send discount notification:", err);
  }

  return {
    promotionId,
    originalAmount: totalAmount,
    discount: discountAmount,
    discountPercent: promotion.discount_percent,
    finalAmount,
  };
}

export async function validatePromotion(promotionId: string) {
  const supabase = await createClient();

  const { data: promotion, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("id", promotionId)
    .single();

  if (error || !promotion) {
    return { valid: false, error: "العرض غير موجود" };
  }

  if (!promotion.is_active) {
    return { valid: false, error: "هذا العرض غير نشط" };
  }

  const now = new Date();
  if (promotion.starts_at && new Date(promotion.starts_at) > now) {
    return { valid: false, error: "هذا العرض لم يبدأ بعد" };
  }
  if (promotion.ends_at && new Date(promotion.ends_at) < now) {
    return { valid: false, error: "هذا العرض انتهى" };
  }

  return { valid: true, promotion };
}
