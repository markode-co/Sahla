"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Crown, Check, Zap, Smartphone, Building2, Upload, X, ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import type { SubscriptionPlan } from "@/types";
import { PLAN_PRICES } from "@/types";

const PLANS = [
  {
    id: "basic" as SubscriptionPlan,
    name: "أساسي",
    price: PLAN_PRICES.basic,
    features: [
      "حتى 20 منتج",
      "صفحة متجر احترافية",
      "إدارة الطلبات",
      "3 طرق دفع",
      "دعم فني",
    ],
    color: "border-gray-300",
    badge: null,
  },
  {
    id: "pro" as SubscriptionPlan,
    name: "احترافي",
    price: PLAN_PRICES.pro,
    features: [
      "منتجات غير محدودة",
      "صفحة متجر احترافية",
      "إدارة الطلبات المتقدمة",
      "3 طرق دفع",
      "دعم فني أولوية",
    ],
    color: "border-primary-500",
    badge: "الأكثر شيوعاً",
  },
  {
    id: "premium" as SubscriptionPlan,
    name: "مميز",
    price: PLAN_PRICES.premium,
    features: [
      "منتجات غير محدودة",
      "تحليلات متقدمة",
      "تخصيص المتجر",
      "3 طرق دفع",
      "دعم فني مخصص 24/7",
    ],
    color: "border-yellow-400",
    badge: "الأفضل",
  },
];

export default function SubscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<SubscriptionPlan>("pro");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار صورة فقط");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
      return;
    }
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
  }

  function clearReceipt() {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubscribe() {
    if (!receiptFile) {
      toast.error("يرجى رفع صورة إيصال التحويل أولاً");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Upload receipt to storage
    const ext = receiptFile.name.split(".").pop();
    const path = `subscription-receipts/${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(path, receiptFile, { upsert: true });

    if (uploadError) {
      toast.error("فشل رفع الإيصال، يرجى المحاولة مجدداً");
      setLoading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("receipts").getPublicUrl(path);

    // Check if subscription already exists
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    const payload = {
      plan: selected,
      status: "pending" as const,
      receipt_url: publicUrl,
      started_at: new Date().toISOString(),
    };

    const { error } = existing
      ? await supabase.from("subscriptions").update(payload).eq("user_id", user.id)
      : await supabase.from("subscriptions").insert({ user_id: user.id, ...payload });

    if (error) {
      toast.error("حدث خطأ، يرجى المحاولة مجدداً");
      setLoading(false);
      return;
    }

    toast.success("تم إرسال طلب الاشتراك، في انتظار مراجعة الإدارة");
    router.push("/onboarding/subscription-pending");
  }

  const selectedPlan = PLANS.find((p) => p.id === selected)!;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Crown className="w-6 h-6 text-yellow-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">اختر خطة اشتراكك</h1>
        <p className="text-gray-500 mt-1">الخطوة 4 من 4 — اختر الخطة وادفع للبدء</p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            onClick={() => setSelected(plan.id)}
            className={`card p-6 cursor-pointer transition-all relative ${
              selected === plan.id
                ? `${plan.color} border-2 shadow-md`
                : "border border-gray-100 hover:border-gray-200"
            }`}
          >
            {plan.badge && (
              <div
                className={`absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-3 py-1 rounded-full ${
                  plan.id === "pro" ? "bg-primary-600" : "bg-yellow-500"
                }`}
              >
                {plan.badge}
              </div>
            )}

            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
                <div className="mt-1">
                  <span className="text-3xl font-bold text-gray-900">
                    {plan.price.toLocaleString("ar-EG")}
                  </span>
                  <span className="text-gray-400 text-sm mr-1">جنيه/شهر</span>
                </div>
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selected === plan.id
                    ? "border-primary-600 bg-primary-600"
                    : "border-gray-300"
                }`}
              >
                {selected === plan.id && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
            </div>

            <ul className="space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Payment instructions */}
      <div className="card p-6 mb-6 space-y-4">
        <h2 className="font-semibold text-gray-900 text-base">طرق الدفع</h2>

        {/* InstaPay */}
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-purple-800">انستاباي</span>
            <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">متاح الآن</span>
          </div>
          <p className="text-sm text-purple-700">
            حوّل مبلغ{" "}
            <span className="font-bold">{selectedPlan.price.toLocaleString("ar-EG")} جنيه</span>{" "}
            على رقم انستاباي:
          </p>
          <p className="text-lg font-bold text-purple-900 mt-1 font-mono" dir="ltr">
            +201090886364
          </p>
        </div>

        {/* Bank Transfer */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl opacity-60">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-5 h-5 text-gray-500" />
            <span className="font-semibold text-gray-600">تحويل بنكي</span>
            <span className="text-xs bg-gray-400 text-white px-2 py-0.5 rounded-full">قريباً</span>
          </div>
          <p className="text-sm text-gray-500">بيانات التحويل البنكي ستتوفر قريباً</p>
        </div>
      </div>

      {/* Receipt upload */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 text-base mb-3">رفع إيصال التحويل</h2>
        <p className="text-sm text-gray-500 mb-4">
          بعد إتمام التحويل، ارفع صورة الإيصال لمراجعتها وتفعيل اشتراكك
        </p>

        {receiptPreview ? (
          <div className="relative inline-block">
            <img
              src={receiptPreview}
              alt="إيصال التحويل"
              className="w-full max-w-xs h-48 object-cover rounded-xl border border-gray-200"
            />
            <button
              type="button"
              onClick={clearReceipt}
              className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              تم اختيار الإيصال
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center gap-3 text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
          >
            <ImageIcon className="w-10 h-10" />
            <div className="text-center">
              <p className="text-sm font-medium">انقر لرفع صورة الإيصال</p>
              <p className="text-xs mt-0.5">PNG، JPG حتى 5 ميجابايت</p>
            </div>
            <div className="flex items-center gap-2 text-xs bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg">
              <Upload className="w-3.5 h-3.5" />
              اختر صورة
            </div>
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Summary + submit */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-700">الخطة المختارة</span>
          <span className="font-semibold text-gray-900">
            {selectedPlan.name} — {selectedPlan.price.toLocaleString("ar-EG")} جنيه/شهر
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
          <Zap className="w-4 h-4" />
          سيتم تفعيل الاشتراك بعد مراجعة إيصال الدفع من قِبل الإدارة.
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary flex-1">
            السابق
          </button>
          <button
            onClick={handleSubscribe}
            disabled={loading || !receiptFile}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Crown className="w-5 h-5" />
            )}
            {loading ? "جاري الإرسال..." : "إرسال طلب الاشتراك"}
          </button>
        </div>
      </div>
    </div>
  );
}
