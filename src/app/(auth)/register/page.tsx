"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, UserPlus, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { GoogleButton } from "@/components/ui/google-button";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmRequired, setConfirmRequired] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }
    if (form.password.length < 8) {
      toast.error("يجب أن تكون كلمة المرور 8 أحرف على الأقل");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          phone: form.phone,
          role: "merchant",
        },
      },
    });

    if (error) {
      if (
        error.message.toLowerCase().includes("already registered") ||
        error.message.toLowerCase().includes("already been registered") ||
        error.message.toLowerCase().includes("user already registered")
      ) {
        toast.error("هذا البريد الإلكتروني مسجل بالفعل، جرب تسجيل الدخول");
      } else {
        toast.error("حدث خطأ، يرجى المحاولة مجدداً");
      }
      setLoading(false);
      return;
    }

    if (data.session) {
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session: data.session }),
      });

      // Email confirmation is disabled → user is logged in immediately
      toast.success("مرحباً! تم إنشاء حسابك بنجاح");
      router.push("/onboarding/store-setup");
    } else if (data.user) {
      // Email confirmation is enabled → show confirmation message
      setConfirmRequired(true);
    }

    setLoading(false);
  }

  // ── Email confirmation pending screen ────────────────────────────────────────
  if (confirmRequired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center px-4" dir="rtl">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Mail className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">تحقق من بريدك الإلكتروني</h1>
          <p className="text-gray-500 mb-2">
            أرسلنا رابط تفعيل إلى
          </p>
          <p className="font-semibold text-gray-900 mb-6">{form.email}</p>
          <p className="text-sm text-gray-400 mb-8">
            افتح البريد الإلكتروني واضغط على رابط التفعيل، ثم ارجع وسجل دخولك.
          </p>
          <Link href="/login" className="btn-primary inline-block px-10">
            الذهاب لتسجيل الدخول
          </Link>
          <p className="text-xs text-gray-400 mt-4">
            لم تجد الإيميل؟ تحقق من مجلد Spam
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center px-4 py-8" dir="rtl">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">س</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">سهلة</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">أنشئ حسابك</h1>
          <p className="text-gray-500 mt-1">ابدأ رحلتك في التجارة الإلكترونية</p>
        </div>

        <div className="card p-8">
          {/* Google button */}
          <GoogleButton label="التسجيل بحساب جوجل" />

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">أو بالبريد الإلكتروني</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">الاسم الكامل</label>
              <input
                type="text"
                required
                placeholder="محمد أحمد"
                className="input-field"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>

            <div>
              <label className="label">البريد الإلكتروني</label>
              <input
                type="email"
                required
                placeholder="example@email.com"
                className="input-field"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="label">رقم الهاتف</label>
              <input
                type="tel"
                required
                placeholder="01XXXXXXXXX"
                className="input-field"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="label">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="8 أحرف على الأقل"
                  className="input-field pl-12"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">تأكيد كلمة المرور</label>
              <input
                type="password"
                required
                placeholder="أعد كتابة كلمة المرور"
                className="input-field"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
              {loading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            لديك حساب بالفعل؟{" "}
            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              سجل دخولك
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
