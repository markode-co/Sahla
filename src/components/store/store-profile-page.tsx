"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Mail, Phone, MapPin, Share2, HelpCircle, Settings, LogOut, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { AuthModal } from "@/components/store/auth-modal";
import type { Store } from "@/types";

interface StoreProfilePageProps {
  storeSlug: string;
  store: Store;
}

const actionItems = [
  { label: "الملف الشخصي", icon: User, href: "/" },
  { label: "الإعدادات", icon: Settings, href: "/" },
  { label: "اتصل بنا", icon: Mail, href: "/" },
  { label: "مشاركة التطبيق", icon: Share2, href: "/" },
  { label: "مساعدة", icon: HelpCircle, href: "/" },
];

export function StoreProfilePage({ storeSlug, store }: StoreProfilePageProps) {
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", address: "" });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
        setForm({
          fullName: data.user.user_metadata?.full_name || "",
          email: data.user.email || "",
          phone: data.user.user_metadata?.phone || "",
          address: data.user.user_metadata?.address || "",
        });
      }
      setLoading(false);
    });
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = store.custom_domain ? "/" : `/store/${storeSlug}`;
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: form.fullName,
        phone: form.phone,
        address: form.address,
      },
    });

    if (error) {
      toast.error("حدث خطأ أثناء حفظ البيانات");
    } else {
      toast.success("تم حفظ البيانات بنجاح");
      setEditing(false);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="space-y-4">
          <div className="h-24 rounded-3xl bg-slate-200" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-40 rounded-3xl bg-slate-200" />
            <div className="h-40 rounded-3xl bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm">
          <p className="text-xl font-semibold text-slate-900">الملف الشخصي</p>
          <p className="mt-3 text-slate-600">يرجى تسجيل الدخول لتتمكن من عرض وإدارة بياناتك.</p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="mt-6 inline-flex items-center justify-center rounded-3xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
          >
            تسجيل الدخول
          </button>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          storeSlug={storeSlug}
          nextUrl={`/store/${storeSlug}/profile`}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[380px_1fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-100 text-3xl font-semibold text-primary-700">
              {user.user_metadata?.full_name
                ? user.user_metadata.full_name.charAt(0).toUpperCase()
                : user.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">{user.user_metadata?.full_name || "اسم المستخدم"}</h1>
              <p className="mt-1 text-sm text-slate-500">{user.email}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {actionItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  className="flex w-full items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                >
                  <span className="inline-flex items-center gap-3 text-sm font-medium">
                    <Icon className="w-5 h-5 text-slate-500" />
                    {item.label}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-3xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            <LogOut className="w-5 h-5" />
            تسجيل الخروج
          </button>
        </section>

        <section className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">الحساب</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">معلومات حسابك</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditing((prev) => !prev)}
                className="rounded-3xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
              >
                {editing ? "إلغاء" : "تعديل"}
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">الاسم</p>
                {editing ? (
                  <input
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                  />
                ) : (
                  <p className="mt-2 text-sm font-medium text-slate-900">{form.fullName || "غير محدد"}</p>
                )}
              </div>

              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">البريد الإلكتروني</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{form.email}</p>
              </div>

              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">الهاتف</p>
                {editing ? (
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                  />
                ) : (
                  <p className="mt-2 text-sm font-medium text-slate-900">{form.phone || "غير محدد"}</p>
                )}
              </div>

              <div className="rounded-3xl bg-slate-50 p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">العنوان</p>
                {editing ? (
                  <textarea
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    rows={4}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
                  />
                ) : (
                  <p className="mt-2 text-sm font-medium text-slate-900">{form.address || "غير محدد"}</p>
                )}
              </div>
            </div>

            {editing && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-60"
              >
                حفظ التغييرات
              </button>
            )}
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm uppercase tracking-[0.2em] text-slate-500">الحالة</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">عدد الطلبات</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">12</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">أحدث زيارة</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">اليوم</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
