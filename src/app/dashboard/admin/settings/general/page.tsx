import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminGeneralSettings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div>
      <h2 className="section-title">إعدادات عامة</h2>
      <p className="text-gray-500 mt-1">إعدادات عامة للنظام أو المنصة.</p>
      {/* أضف إعدادات عامة هنا */}
    </div>
  );
}
