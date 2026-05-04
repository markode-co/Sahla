import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { CreditCard, Smartphone, Banknote } from "lucide-react";
import { getPaymentMethodLabel } from "@/lib/utils";

export default async function AdminPaymentSettings() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/login");

  const supabase = createAdminClient();
  const { data: paymentMethods } = await supabase.from("payment_methods").select("*");

  const storeIds = Array.from(new Set((paymentMethods ?? []).map((method) => method.store_id).filter(Boolean)));
  let stores: Array<{ id: string; name: string; slug: string }> = [];
  if (storeIds.length > 0) {
    const { data: storesData } = await supabase.from("stores").select("id, name, slug").in("id", storeIds);
    stores = storesData ?? [];
  }

  const storesMap = new Map(stores.map((store) => [store.id, store]));
  const totalMethods = paymentMethods?.length ?? 0;
  const instapayCount = (paymentMethods ?? []).filter((item) => item.instapay_username).length;
  const bankCount = (paymentMethods ?? []).filter((item) => item.bank_name).length;
  const codCount = (paymentMethods ?? []).filter((item) => item.cash_on_delivery).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">طرق الدفع للمنصة</h1>
        <p className="text-gray-500 mt-1">عرض وتحديث طرق الدفع لكل متجر مسجل.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-primary-600" />
            <div>
              <p className="text-sm text-gray-500">إجمالي إعدادات الدفع</p>
              <p className="text-2xl font-semibold text-gray-900">{totalMethods}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm text-gray-500">انستاباي مفعّل</p>
              <p className="text-2xl font-semibold text-gray-900">{instapayCount}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <Banknote className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-500">تحويل بنكي أو دفع عند الاستلام</p>
              <p className="text-2xl font-semibold text-gray-900">{bankCount + codCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="section-title">إعدادات الدفع حسب المتجر</h2>
            <p className="text-gray-500 mt-1">راجع كل المتاجر التي أضافت بيانات دفع.</p>
          </div>
          <Link href="/dashboard/admin/merchants" className="text-sm text-primary-600 hover:text-primary-700">
            مراجعة التجار
          </Link>
        </div>

        {paymentMethods && paymentMethods.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-xs font-medium text-gray-500">المتجر</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500">الطريقة</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500">تفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paymentMethods.map((method) => (
                  <tr key={method.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-900">{storesMap.get(method.store_id)?.name ?? "متجر غير معروف"}</p>
                      <p className="text-xs text-primary-600">/store/{storesMap.get(method.store_id)?.slug ?? "-"}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {method.instapay_username ? "انستاباي" : method.bank_name ? "تحويل بنكي" : method.cash_on_delivery ? "الدفع عند الاستلام" : "غير محددة"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 space-y-1">
                      {method.instapay_username && <p>انستاباي: {method.instapay_username}</p>}
                      {method.bank_name && <p>بنك: {method.bank_name}</p>}
                      {method.bank_account_number && <p>رقم حساب: {method.bank_account_number}</p>}
                      {method.bank_account_name && <p>اسم الحساب: {method.bank_account_name}</p>}
                      {method.cash_on_delivery && <p>يدعم الدفع عند الاستلام</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            لا توجد بيانات دفع مسجلة بعد.
          </div>
        )}
      </div>
    </div>
  );
}
