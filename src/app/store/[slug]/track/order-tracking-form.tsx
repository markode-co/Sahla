"use client";

import { useState } from "react";
import { CheckCircle, Search } from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency, formatDate, getOrderStatusLabel, getPaymentMethodLabel } from "@/lib/utils";
import { ReceiptLink } from "@/components/receipt-link";

interface OrderTrackingFormProps {
  storeSlug: string;
}

export default function OrderTrackingForm({ storeSlug }: OrderTrackingFormProps) {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const orderSteps = [
    { id: "pending", label: "تحت المعالجة" },
    { id: "received", label: "تم الاستلام" },
    { id: "preparing", label: "قيد التجهيز" },
    { id: "on_the_way", label: "في الطريق" },
    { id: "delivered", label: "تم التسليم" },
  ];

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!orderId.trim() || !phone.trim()) {
      setError("يرجى إدخال رقم الطلب ورقم الهاتف");
      return;
    }

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const response = await fetch("/api/track-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ storeSlug, orderId, customerPhone: phone }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "فشل البحث عن الطلب");
      }

      setOrder(data.order);
    } catch (err) {
      const message = err instanceof Error ? err.message : "حدث خطأ أثناء البحث";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="section-title">بحث الطلب</h2>
        <p className="text-gray-500 mt-1">أدخل بيانات الطلب لعرض تفاصيل الحالة.</p>

        <form onSubmit={handleSearch} className="grid gap-4 sm:grid-cols-[1fr_220px] mt-6">
          <div className="space-y-4">
            <div>
              <label className="label">رقم الطلب</label>
              <input
                className="input-field"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="مثال: abc123..."
              />
            </div>
            <div>
              <label className="label">رقم الهاتف</label>
              <input
                className="input-field"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010XXXXXXXX"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary h-12 w-full"
          >
            {loading ? "جاري البحث..." : 
              <span className="inline-flex items-center justify-center gap-2">
                <Search className="w-4 h-4" /> بحث
              </span>
            }
          </button>
        </form>

        {error && (
          <p className="text-sm text-red-600 mt-3">{error}</p>
        )}
      </div>

      {order && (
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">حالة الطلب</h3>
              </div>
              <p className="text-sm text-gray-600">{getOrderStatusLabel(order.status)}</p>
              <p className="text-xs text-gray-400 mt-2">#{order.id.slice(0, 8)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">تاريخ الطلب</p>
              <p className="font-medium text-gray-900">{formatDate(order.created_at)}</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="grid gap-3 sm:grid-cols-5">
              {orderSteps.map((step, index) => {
                const currentIndex = orderSteps.findIndex((item) => item.id === order.status);
                const isComplete = index <= currentIndex;
                const isActive = step.id === order.status;
                return (
                  <div key={step.id} className="flex flex-col items-center text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${isComplete ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {index + 1}
                    </div>
                    <p className={`mt-2 text-xs ${isActive ? 'text-primary-700' : 'text-gray-500'}`}>
                      {step.label}
                    </p>
                    {index < orderSteps.length - 1 && (
                      <div className={`w-px h-8 mx-auto mt-2 ${isComplete ? 'bg-primary-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-6">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400">اسم العميل</p>
                <p className="font-medium text-gray-900">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">الهاتف</p>
                <p className="font-medium text-gray-900">{order.customer_phone}</p>
              </div>
              {order.customer_email && (
                <div>
                  <p className="text-xs text-gray-400">البريد الإلكتروني</p>
                  <p className="font-medium text-gray-900">{order.customer_email}</p>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400">طريقة الدفع</p>
                <p className="font-medium text-gray-900">{getPaymentMethodLabel(order.payment_method)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">الإجمالي</p>
                <p className="font-semibold text-gray-900">{formatCurrency(order.total_amount)}</p>
              </div>
              {order.notes && (
                <div>
                  <p className="text-xs text-gray-400">ملاحظات العميل</p>
                  <p className="text-sm text-gray-700">{order.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 overflow-x-auto bg-gray-50 rounded-2xl p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">تفاصيل المنتجات</h4>
            {order.order_items?.length ? (
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="px-3 py-2">المنتج</th>
                    <th className="px-3 py-2">السعر</th>
                    <th className="px-3 py-2">الكمية</th>
                    <th className="px-3 py-2">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.order_items.map((item: any) => (
                    <tr key={item.id} className="bg-white">
                      <td className="px-3 py-3 text-gray-900">{item.product_name}</td>
                      <td className="px-3 py-3 text-gray-700">{formatCurrency(item.product_price)}</td>
                      <td className="px-3 py-3 text-gray-700">{item.quantity}</td>
                      <td className="px-3 py-3 text-gray-900">{formatCurrency(item.product_price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-500">لا توجد منتجات مضافة لهذا الطلب.</p>
            )}
          </div>

          {order.payments?.[0]?.receipt_url && (
            <div className="mt-6">
              <ReceiptLink receiptUrl={order.payments[0].receipt_url} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
