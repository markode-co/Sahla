"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { User as UserIcon } from "lucide-react";
import type { User } from "@/types";

interface AccountSettingsFormProps {
  profile: User | null;
}

export function AccountSettingsForm({ profile }: AccountSettingsFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
  });

  const email = profile?.email ?? "";

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("يرجى تسجيل الدخول مرة أخرى");
        return;
      }

      const { error } = await supabase
        .from("users")
        .update({
          full_name: form.fullName || null,
          phone: form.phone || null,
        })
        .eq("id", user.id);

      if (error) {
        toast.error("فشل حفظ معلومات الحساب");
        return;
      }

      toast.success("تم حفظ المعلومات بنجاح");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
          <UserIcon className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h2 className="section-title">بيانات الحساب</h2>
          <p className="text-gray-500 mt-1">تحديث معلومات المدير ومعلومات التواصل.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="label">البريد الإلكتروني</label>
          <input className="input-field bg-gray-50 text-gray-800" value={email} readOnly />
        </div>

        <div>
          <label className="label">الاسم الكامل</label>
          <input
            className="input-field"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder="الاسم الكامل"
          />
        </div>

        <div>
          <label className="label">رقم الهاتف</label>
          <input
            className="input-field"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="010XXXXXXXX"
          />
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>
      </form>
    </div>
  );
}
