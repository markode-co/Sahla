"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getUserNotifications(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function sendPromotionNotification(userId: string, storeId: string, promotion: {
  title: string;
  description?: string;
  discount_percent: number;
}) {
  const supabase = await createClient();
  
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    store_id: storeId,
    type: "promotion",
    title: `عرض خاص: ${promotion.title}`,
    message: `احصل على خصم ${promotion.discount_percent}% ${promotion.description ? `- ${promotion.description}` : ""}`,
    read: false,
  });

  if (error) throw new Error(error.message);
}

export async function sendOrderNotification(
  userId: string,
  storeId: string,
  orderId: string,
  status: string
) {
  const supabase = await createClient();
  
  const statusMessages: Record<string, { title: string; message: string }> = {
    pending: {
      title: "تم استقبال طلبك",
      message: "سيتم مراجعة طلبك قريباً من قبل الفريق",
    },
    approved: {
      title: "تم تأكيد طلبك",
      message: "تم تأكيد طلبك وجاري التجهيز للشحن",
    },
    preparing: {
      title: "الطلب قيد التجهيز",
      message: "يتم تجهيز طلبك الآن",
    },
    on_the_way: {
      title: "الطلب في الطريق",
      message: "تم شحن طلبك وهو في الطريق إليك",
    },
    delivered: {
      title: "تم استلام الطلب",
      message: "تم توصيل طلبك بنجاح شكراً لك",
    },
    rejected: {
      title: "تم رفض الطلب",
      message: "عذراً، تم رفض طلبك",
    },
  };

  const messageInfo = statusMessages[status] || {
    title: "تحديث الطلب",
    message: `تم تحديث حالة طلبك إلى: ${status}`,
  };

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    store_id: storeId,
    type: "order_update",
    title: messageInfo.title,
    message: messageInfo.message,
    order_id: orderId,
    read: false,
  });

  if (error) throw new Error(error.message);
}

export async function sendDiscountAppliedNotification(
  userId: string,
  storeId: string,
  discount_percent: number,
  savings: number
) {
  const supabase = await createClient();
  
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    store_id: storeId,
    type: "promotion",
    title: "تم تطبيق الخصم بنجاح",
    message: `تم تطبيق خصم ${discount_percent}% على طلبك وتوفير ${savings} جنيه`,
    read: false,
  });

  if (error) throw new Error(error.message);
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);

  if (error) throw new Error(error.message);
}

export async function markAllNotificationsAsRead(userId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) throw new Error(error.message);
}

export async function deleteNotification(notificationId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId);

  if (error) throw new Error(error.message);
}
