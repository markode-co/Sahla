"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { generateLogoInitials, generateLogoColor, slugify } from "@/lib/utils";

export default function StoreSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
  });
  const [slugManual, setSlugManual] = useState(false);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    setForm((prev) => ({
      ...prev,
      name,
      slug: slugManual ? prev.slug : slugify(name),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      toast.error("انتهت جلستك، يرجى تسجيل الدخول من جديد");
      router.push("/login");
      return;
    }

    // Check slug uniqueness
    const { data: existing } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", form.slug)
      .single();

    if (existing) {
      toast.error("هذا الرابط مستخدم بالفعل، جرب رابطاً آخر");
      setLoading(false);
      return;
    }

    const logoInitials = generateLogoInitials(form.name);
    const logoColor = generateLogoColor();

    const { error } = await supabase.from("stores").insert({
      user_id: user.id,
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      logo_initials: logoInitials,
      logo_color: logoColor,
      status: "pending",
    });

    if (error) {
      toast.error("حدث خطأ، يرجى المحاولة مجدداً");
      setLoading(false);
      return;
    }

    toast.success("تم إنشاء المتجر!");
    router.push("/onboarding/payment");
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            <Store className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">إعداد متجرك</h1>
            <p className="text-sm text-gray-500">الخطوة 1 من 4</p>
          </div>
        </div>

        {/* Logo Preview */}
        {form.name && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl mb-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-sm"
              style={{ backgroundColor: "#0ea5e9" }}
            >
              {generateLogoInitials(form.name) || "?"}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{form.name}</p>
              <p className="text-sm text-gray-400">
                سيتم توليد الشعار تلقائياً
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">اسم المتجر *</label>
            <input
              type="text"
              required
              placeholder="مثال: متجر الأزياء العصرية"
              className="input-field"
              value={form.name}
              onChange={handleNameChange}
            />
          </div>

          <div>
            <label className="label">رابط المتجر *</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm whitespace-nowrap">sahla.com/store/</span>
              <input
                type="text"
                required
                placeholder="my-store"
                className="input-field"
                value={form.slug}
                onChange={(e) => {
                  setSlugManual(true);
                  setForm({ ...form, slug: slugify(e.target.value) });
                }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              يظهر في رابط متجرك العام. حروف إنجليزية وأرقام وشرطات فقط.
            </p>
          </div>

          <div>
            <label className="label">وصف المتجر</label>
            <textarea
              rows={3}
              placeholder="أخبر عملاءك عن متجرك ومنتجاتك..."
              className="input-field resize-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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
              <ArrowLeft className="w-5 h-5" />
            )}
            {loading ? "جاري الحفظ..." : "التالي: طرق الدفع"}
          </button>
        </form>
      </div>
    </div>
  );
}
