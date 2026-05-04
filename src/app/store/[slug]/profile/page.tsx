"use client";

import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Mail, Phone, MapPin, Save, Edit3 } from "lucide-react";
import toast from "react-hot-toast";
import { AuthModal } from "@/components/store/auth-modal";

interface Props {
  params: {
    slug: string;
  };
}

function StoreProfilePage({ params }: Props) {
  const { slug } = params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
  });

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

  async function handleSave() {
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
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="space-y-6">
          <div className="card p-6 text-center">
            <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">يرجى تسجيل الدخول</h2>
            <p className="text-gray-500 mb-4">يجب تسجيل الدخول لعرض وتعديل الملف الشخصي.</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="btn-primary inline-block"
            >
              تسجيل الدخول
            </button>
          </div>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          storeSlug={slug}
          nextUrl={`/store/${slug}/profile`}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">الملف الشخصي</h1>
            <p className="text-gray-500 mt-1">إدارة بياناتك الشخصية ومعلومات الاتصال.</p>
          </div>
          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : editing ? (
              <Save className="w-4 h-4" />
            ) : (
              <Edit3 className="w-4 h-4" />
            )}
            {editing ? "حفظ" : "تعديل"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            معلومات الحساب
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label">الاسم الكامل</label>
              {editing ? (
                <input
                  type="text"
                  className="input-field"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              ) : (
                <p className="text-gray-900 font-medium">{form.fullName || "غير محدد"}</p>
              )}
            </div>
            <div>
              <label className="label flex items-center gap-2">
                <Mail className="w-4 h-4" />
                البريد الإلكتروني
              </label>
              <p className="text-gray-900 font-medium">{form.email}</p>
              <p className="text-xs text-gray-500 mt-1">لا يمكن تعديل البريد الإلكتروني</p>
            </div>
            <div>
              <label className="label flex items-center gap-2">
                <Phone className="w-4 h-4" />
                رقم الهاتف
              </label>
              {editing ? (
                <input
                  type="tel"
                  className="input-field"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              ) : (
                <p className="text-gray-900 font-medium">{form.phone || "غير محدد"}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            عنوان الشحن
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label">العنوان التفصيلي</label>
              {editing ? (
                <textarea
                  rows={3}
                  className="input-field resize-none"
                  placeholder="الشارع، المدينة، المحافظة"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              ) : (
                <p className="text-gray-900 font-medium">{form.address || "غير محدد"}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <div className="card p-6 border-l-4 border-yellow-500 bg-yellow-50">
          <p className="text-sm text-yellow-800">
            <strong>ملاحظة:</strong> التغييرات ستُحفظ في حسابك وستُستخدم في طلباتك المستقبلية.
          </p>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage({ params }: Props) {
  return <StoreProfilePage params={params} />;
}
