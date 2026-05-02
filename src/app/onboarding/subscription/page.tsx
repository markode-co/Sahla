"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Check, Zap } from "lucide-react";
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
    color: "border-gray-200",
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

  async function handleSubscribe() {
    setLoading(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Check if subscription already exists
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    const payload = {
      plan: selected,
      status: "active" as const,
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

    toast.success("تم تفعيل اشتراكك! مرحباً بك في سهلة 🎉");
    router.push("/dashboard/merchant");
    router.refresh();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Crown className="w-6 h-6 text-yellow-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">اختر خطة اشتراكك</h1>
        <p className="text-gray-500 mt-1">الخطوة 4 من 4 — اختر الخطة المناسبة وابدأ البيع</p>
      </div>

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
              <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-3 py-1 rounded-full ${
                plan.id === "pro" ? "bg-primary-600" : "bg-yellow-500"
              }`}>
                {plan.badge}
              </div>
            )}

            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
                <div className="mt-1">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
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
                {selected === plan.id && (
                  <Check className="w-3.5 h-3.5 text-white" />
                )}
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

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-700">الخطة المختارة</span>
          <span className="font-semibold text-gray-900">
            {PLANS.find((p) => p.id === selected)?.name} — {PLAN_PRICES[selected]} جنيه/شهر
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
          <Zap className="w-4 h-4" />
          سيتم تفعيل الاشتراك فور الدفع. يمكنك الترقية في أي وقت.
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary flex-1"
          >
            السابق
          </button>
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Crown className="w-5 h-5" />
            )}
            {loading ? "جاري التفعيل..." : "اشترك وابدأ الآن"}
          </button>
        </div>
      </div>
    </div>
  );
}
