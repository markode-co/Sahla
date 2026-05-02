"use client";

import { useState } from "react";
import { Store } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Store as StoreType, User } from "@/types";
import { generateLogoInitials } from "@/lib/utils";

export function StoreSettingsForm({
  store,
  profile,
}: {
  store: StoreType;
  profile: User | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: store.name,
    description: store.description ?? "",
    fullName: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
  });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();

    const [storeUpdate, profileUpdate] = await Promise.all([
      supabase.from("stores").update({
        name: form.name,
        description: form.description || null,
        logo_initials: generateLogoInitials(form.name),
      }).eq("id", store.id),
      supabase.from("users").update({
        full_name: form.fullName,
        phone: form.phone,
      }).eq("id", profile?.id ?? ""),
    ]);

    if (storeUpdate.error || profileUpdate.error) {
      toast.error("حدث خطأ أثناء الحفظ");
    } else {
      toast.success("تم حفظ الإعدادات");
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
          <Store className="w-5 h-5 text-primary-600" />
        </div>
        <h2 className="section-title">معلومات المتجر</h2>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">اسم المتجر</label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">رابط المتجر</label>
            <input
              className="input-field bg-gray-50 text-gray-400 cursor-not-allowed"
              value={store.slug}
              readOnly
            />
          </div>
        </div>

        <div>
          <label className="label">وصف المتجر</label>
          <textarea
            className="input-field resize-none"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="border-t border-gray-100 pt-4 mt-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">معلومات الحساب</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">الاسم الكامل</label>
              <input
                className="input-field"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>
            <div>
              <label className="label">رقم الهاتف</label>
              <input
                className="input-field"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
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
