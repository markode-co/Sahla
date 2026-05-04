import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountSettingsForm } from "./account-settings-form";

export default async function AdminAccountSettings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">إعدادات الحساب</h1>
        <p className="text-gray-500 mt-1">تحكم في معلومات حساب المدير ومعلومات التواصل.</p>
      </div>
      <AccountSettingsForm profile={profile} />
    </div>
  );
}
