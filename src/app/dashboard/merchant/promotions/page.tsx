import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PromotionManager } from "./promotion-manager";
import type { Promotion } from "@/types";

export default async function PromotionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!store) redirect("/onboarding/store-setup");

  const { data: promotions } = await supabase
    .from("promotions")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">العروض</h1>
          <p className="text-gray-500 mt-1">أضف وعدل عروض المتجر مباشرة من لوحة التحكم.</p>
        </div>
      </div>

      <PromotionManager initialPromotions={(promotions ?? []) as Promotion[]} />
    </div>
  );
}
