import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StoreSettingsForm } from "./store-settings-form";
import { PaymentSettingsForm } from "./payment-settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, storeRes] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase.from("stores").select("*").eq("user_id", user.id).single(),
  ]);

  const profile = profileRes.data;
  const store = storeRes.data;

  if (!store) redirect("/onboarding/store-setup");

  const { data: paymentMethod } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("store_id", store.id)
    .single();

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="page-title">الإعدادات</h1>
        <p className="text-gray-500 mt-1">إدارة معلومات متجرك وطرق الدفع</p>
      </div>

      <StoreSettingsForm store={store} profile={profile} />
      <PaymentSettingsForm storeId={store.id} paymentMethod={paymentMethod} />
    </div>
  );
}
