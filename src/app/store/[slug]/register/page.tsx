"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

interface Props {
  params: {
    slug: string;
  };
}

function StoreRegisterForm({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [form, setForm] = useState({ email: "", password: "", fullName: "", phone: "" });

  const next = searchParams.get("next");
  const safeNext = next && next.startsWith("/") ? next : `/store/${storeSlug}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("يجب أن تكون كلمة المرور 8 أحرف على الأقل");
      return;
    }
    if (form.password !== confirmPassword) {
      toast.error("كلمة المرور غير مطابقة");
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
          role: "customer",
        },
      },
    });

    if (error) {
      toast.error("حدث خطأ أثناء إنشاء الحساب، حاول مرة أخرى");
      setLoading(false);
      return;
    }

    if (data.session) {
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session: data.session }),
      });
      router.push(safeNext);
    } else {
      toast.success("تم إنشاء الحساب. تحقق من بريدك لتأكيد الحساب ثم سجّل الدخول.");
      router.push(`/store/${storeSlug}/login?next=${encodeURIComponent(safeNext)}`);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center px-4 py-10" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">إنشاء حساب عميل</h1>
          <p className="text-gray-500 mt-1">أنشئ حسابًا لتتمكن من شراء المنتجات من هذا المتجر.</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">الاسم الكامل</label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="محمد أحمد"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>
            <div>
              <label className="label">رقم الهاتف</label>
              <input
                type="tel"
                required
                className="input-field"
                placeholder="01XXXXXXXXX"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="label">البريد الإلكتروني</label>
              <input
                type="email"
                required
                className="input-field"
                placeholder="example@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="input-field pl-12"
                  placeholder="••••••••"
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
                className="input-field"
                placeholder="أعد كتابة كلمة المرور"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            لديك حساب؟{' '}
            <Link
              href={`/store/${storeSlug}/login?next=${encodeURIComponent(safeNext)}`}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              سجل دخول الآن
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function StoreRegisterPage({ params }: Props) {
  return <StoreRegisterForm storeSlug={params.slug} />;
}
