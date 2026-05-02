"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, ArrowLeft, Smartphone, Building2, Truck } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

export default function PaymentSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    instapayUsername: "",
    bankName: "",
    bankAccountNumber: "",
    bankAccountName: "",
    cashOnDelivery: true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.instapayUsername && !form.bankName && !form.cashOnDelivery) {
      toast.error("يرجى إضافة طريقة دفع واحدة على الأقل");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!store) {
      toast.error("لم يتم العثور على المتجر");
      router.push("/onboarding/store-setup");
      return;
    }

    const { error } = await supabase.from("payment_methods").upsert({
      store_id: store.id,
      instapay_username: form.instapayUsername || null,
      bank_name: form.bankName || null,
      bank_account_number: form.bankAccountNumber || null,
      bank_account_name: form.bankAccountName || null,
      cash_on_delivery: form.cashOnDelivery,
    }, { onConflict: "store_id" });

    if (error) {
      toast.error("حدث خطأ، يرجى المحاولة مجدداً");
      setLoading(false);
      return;
    }

    toast.success("تم حفظ طرق الدفع!");
    router.push("/onboarding/documents");
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">طرق الدفع</h1>
            <p className="text-sm text-gray-500">الخطوة 2 من 4</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Instapay */}
          <div className="p-4 border border-gray-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-gray-800">انستاباي</span>
            </div>
            <input
              type="text"
              placeholder="اسم المستخدم على انستاباي"
              className="input-field"
              value={form.instapayUsername}
              onChange={(e) => setForm({ ...form, instapayUsername: e.target.value })}
            />
          </div>

          {/* Bank Transfer */}
          <div className="p-4 border border-gray-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-800">تحويل بنكي</span>
            </div>
            <input
              type="text"
              placeholder="اسم البنك"
              className="input-field"
              value={form.bankName}
              onChange={(e) => setForm({ ...form, bankName: e.target.value })}
            />
            <input
              type="text"
              placeholder="رقم الحساب"
              className="input-field"
              value={form.bankAccountNumber}
              onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })}
            />
            <input
              type="text"
              placeholder="اسم صاحب الحساب"
              className="input-field"
              value={form.bankAccountName}
              onChange={(e) => setForm({ ...form, bankAccountName: e.target.value })}
            />
          </div>

          {/* Cash on Delivery */}
          <div className="p-4 border border-gray-200 rounded-xl">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-green-600" />
                <div>
                  <span className="font-semibold text-gray-800 block">الدفع عند الاستلام</span>
                  <span className="text-xs text-gray-400">يدفع العميل عند وصول الطلب</span>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={form.cashOnDelivery}
                  onChange={(e) => setForm({ ...form, cashOnDelivery: e.target.checked })}
                />
                <div
                  className={`w-12 h-6 rounded-full transition-colors ${
                    form.cashOnDelivery ? "bg-primary-600" : "bg-gray-200"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform absolute top-0.5 ${
                      form.cashOnDelivery ? "translate-x-0.5" : "translate-x-6"
                    }`}
                  />
                </div>
              </div>
            </label>
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
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowLeft className="w-5 h-5" />
              )}
              {loading ? "جاري الحفظ..." : "التالي: المستندات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
