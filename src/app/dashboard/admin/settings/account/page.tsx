import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminAccountSettings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div>
      <h2 className="section-title">إعدادات الحساب</h2>
      <p className="text-gray-500 mt-1">تغيير بيانات الحساب مثل الاسم أو البريد الإلكتروني أو كلمة المرور.</p>
      {/* أضف نموذج تغيير البيانات هنا */}
    </div>
  );
}
