import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPaymentSettings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div>
      <h2 className="section-title">طرق الدفع للمنصة</h2>
      <p className="text-gray-500 mt-1">إدارة طرق الدفع الخاصة بالمنصة.</p>
      {/* أضف إعدادات طرق الدفع هنا */}
    </div>
  );
}
