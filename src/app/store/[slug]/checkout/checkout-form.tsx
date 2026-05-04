"use client";

import { useState } from "react";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag, Upload, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/cart";
import { formatCurrency, getPaymentMethodLabel } from "@/lib/utils";
import type { PaymentMethod } from "@/types";

interface CheckoutFormProps {
  storeId: string;
  storeSlug: string;
  storeName: string;
  paymentMethod: PaymentMethod | null;
}

export function CheckoutForm({ storeId, storeSlug, storeName, paymentMethod }: CheckoutFormProps) {
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>(
    paymentMethod?.cash_on_delivery ? "cash_on_delivery" :
    paymentMethod?.instapay_username ? "instapay" : "bank_transfer"
  );
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    email: "",
    notes: "",
  });

  const storeItems = items.filter((item) => item.product.store_id === storeId || true);
  const total = getTotalPrice();

  const availablePayments = [];
  if (paymentMethod?.instapay_username) availablePayments.push({ id: "instapay", label: "انستاباي", needsReceipt: true });
  if (paymentMethod?.bank_name) availablePayments.push({ id: "bank_transfer", label: "تحويل بنكي", needsReceipt: true });
  if (paymentMethod?.cash_on_delivery) availablePayments.push({ id: "cash_on_delivery", label: "الدفع عند الاستلام", needsReceipt: false });

  const currentPayment = availablePayments.find((p) => p.id === selectedPayment);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("السلة فارغة");
      return;
    }
    if (currentPayment?.needsReceipt && !receiptFile) {
      toast.error("يرجى رفع إيصال الدفع");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("storeId", storeId);
      formData.append("customerName", form.name);
      formData.append("customerPhone", form.phone);
      formData.append("customerAddress", form.address);
      formData.append("customerEmail", form.email || "");
      formData.append("paymentMethod", selectedPayment);
      formData.append("notes", form.notes || "");
      formData.append("items", JSON.stringify(items));

      if (receiptFile) {
        formData.append("receipt", receiptFile);
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "فشل إرسال الطلب");
      }

      clearCart();
      setOrderDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ أثناء إرسال الطلب");
    }
    setLoading(false);
  }

  if (orderDone) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">تم إرسال طلبك بنجاح!</h2>
        <p className="text-gray-500 mb-6">
          سيتواصل معك صاحب المتجر قريباً لتأكيد طلبك
        </p>
        <a
          href={`/store/${storeSlug}`}
          className="btn-primary inline-flex items-center gap-2"
        >
          <ShoppingBag className="w-5 h-5" />
          متابعة التسوق
        </a>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-200" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">سلتك فارغة</h2>
        <a href={`/store/${storeSlug}`} className="btn-primary inline-block mt-2">
          تسوق الآن
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Form */}
      <div className="lg:col-span-2 space-y-5">
        {/* Contact info */}
        <div className="card p-6 space-y-4">
          <h2 className="section-title">معلومات التواصل</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">الاسم الكامل *</label>
              <input
                required
                className="input-field"
                placeholder="محمد أحمد"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">رقم الهاتف *</label>
              <input
                required
                className="input-field"
                placeholder="01XXXXXXXXX"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">العنوان التفصيلي *</label>
            <input
              required
              className="input-field"
              placeholder="الشارع، المدينة، المحافظة"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div>
            <label className="label">البريد الإلكتروني (اختياري)</label>
            <input
              type="email"
              className="input-field"
              placeholder="example@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">ملاحظات إضافية</label>
            <textarea
              rows={2}
              className="input-field resize-none"
              placeholder="أي تعليمات خاصة..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        {/* Payment method */}
        {availablePayments.length > 0 && (
          <div className="card p-6 space-y-4">
            <h2 className="section-title">طريقة الدفع</h2>
            <div className="space-y-2">
              {availablePayments.map((pm) => (
                <label
                  key={pm.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    selectedPayment === pm.id
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={pm.id}
                    checked={selectedPayment === pm.id}
                    onChange={() => setSelectedPayment(pm.id)}
                    className="text-primary-600"
                  />
                  <span className="font-medium text-gray-800">{pm.label}</span>
                </label>
              ))}
            </div>

            {/* Payment details */}
            {selectedPayment === "instapay" && paymentMethod?.instapay_username && (
              <div className="bg-purple-50 rounded-xl p-4">
                <p className="text-sm font-medium text-purple-800 mb-1">حول على انستاباي:</p>
                <p className="text-lg font-bold text-purple-900">{paymentMethod.instapay_username}</p>
              </div>
            )}

            {selectedPayment === "bank_transfer" && paymentMethod?.bank_name && (
              <div className="bg-blue-50 rounded-xl p-4 space-y-1">
                <p className="text-sm font-medium text-blue-800 mb-2">بيانات التحويل:</p>
                <p className="text-sm text-blue-700">البنك: <span className="font-semibold">{paymentMethod.bank_name}</span></p>
                <p className="text-sm text-blue-700">رقم الحساب: <span className="font-semibold">{paymentMethod.bank_account_number}</span></p>
                <p className="text-sm text-blue-700">الاسم: <span className="font-semibold">{paymentMethod.bank_account_name}</span></p>
              </div>
            )}

            {currentPayment?.needsReceipt && (
              <div>
                <label className="label">إيصال الدفع *</label>
                <div className="relative">
                  <input
                    type="file"
                    id="receipt"
                    accept="image/*,.pdf"
                    className="sr-only"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                  />
                  <label
                    htmlFor="receipt"
                    className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {receiptFile ? receiptFile.name : "ارفع صورة الإيصال"}
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Cart summary */}
      <div className="space-y-4">
        <div className="card p-5 sticky top-20">
          <h2 className="section-title mb-4">ملخص الطلب</h2>

          <div className="space-y-3 mb-4">
            {items.map((item) => (
              <div key={item.product.id} className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                  {item.product.image_url ? (
                    <Image
                      src={item.product.image_url}
                      alt={item.product.name}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                      صورة
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.product.name}</p>
                  <p className="text-xs text-gray-400">{formatCurrency(item.product.price)}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.product.id)}
                      className="mr-auto text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>المجموع الفرعي</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900">
              <span>الإجمالي</span>
              <span className="text-primary-600">{formatCurrency(total)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || items.length === 0}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {loading ? "جاري الإرسال..." : "تأكيد الطلب"}
          </button>
        </div>
      </div>
    </form>
  );
}
