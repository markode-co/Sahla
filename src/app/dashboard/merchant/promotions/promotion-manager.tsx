"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Promotion } from "@/types";
import { createPromotion, updatePromotion, deletePromotion } from "@/actions/promotions";
import { Modal } from "@/components/ui/modal";

interface PromotionManagerProps {
  initialPromotions: Promotion[];
}

const emptyForm = {
  title: "",
  description: "",
  discount_percent: 0,
  is_active: true,
  starts_at: "",
  ends_at: "",
};

export function PromotionManager({ initialPromotions }: PromotionManagerProps) {
  const router = useRouter();
  const [promotions, setPromotions] = useState(initialPromotions);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  function formatDateValue(value: string | null) {
    if (!value) return "بدون تاريخ";
    return new Date(value).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function openNewPromotion() {
    setEditingPromotion(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  }

  function openEditPromotion(promotion: Promotion) {
    setEditingPromotion(promotion);
    setForm({
      title: promotion.title,
      description: promotion.description ?? "",
      discount_percent: promotion.discount_percent,
      is_active: promotion.is_active,
      starts_at: promotion.starts_at ?? "",
      ends_at: promotion.ends_at ?? "",
    });
    setModalOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      const data = new FormData(event.currentTarget);
      if (editingPromotion) {
        await updatePromotion(editingPromotion.id, {
          title: (data.get("title") as string).trim(),
          description: (data.get("description") as string).trim(),
          discount_percent: parseInt((data.get("discount_percent") as string) || "0", 10),
          is_active: data.get("is_active") === "on",
          starts_at: (data.get("starts_at") as string)?.trim() || null,
          ends_at: (data.get("ends_at") as string)?.trim() || null,
        });
        toast.success("تم تحديث العرض");
      } else {
        await createPromotion(data);
        toast.success("تم إضافة العرض");
      }

      setModalOpen(false);
      setForm({ ...emptyForm });
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء حفظ العرض");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(promotionId: string) {
    if (!confirm("هل أنت متأكد من حذف هذا العرض؟")) return;
    try {
      await deletePromotion(promotionId);
      toast.success("تم حذف العرض");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء الحذف");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="section-title">قائمة العروض</h2>
          <p className="text-gray-500 mt-1">يمكنك إنشاء عروض جديدة أو تعديل العروض الحالية.</p>
        </div>
        <button
          type="button"
          onClick={openNewPromotion}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> إضافة عرض جديد
        </button>
      </div>

      {promotions.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500">لا توجد عروض حتى الآن. ابدأ بإضافة عرض جديد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {promotions.map((promotion) => (
            <div key={promotion.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{promotion.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {promotion.description || "بدون وصف"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditPromotion(promotion)}
                    className="rounded-full border border-gray-200 p-2 text-gray-500 hover:bg-gray-100"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(promotion.id)}
                    className="rounded-full border border-red-100 p-2 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
                <div className="rounded-2xl bg-gray-50 p-3">
                  <span className="block text-xs text-gray-500">الخصم</span>
                  <span className="font-semibold text-gray-900">{promotion.discount_percent}%</span>
                </div>
                <div className="rounded-2xl bg-gray-50 p-3">
                  <span className="block text-xs text-gray-500">الحالة</span>
                  <span className="font-semibold text-gray-900">{promotion.is_active ? "نشط" : "متوقف"}</span>
                </div>
                <div className="rounded-2xl bg-gray-50 p-3">
                  <span className="block text-xs text-gray-500">يبداً</span>
                  <span className="font-semibold text-gray-900">{formatDateValue(promotion.starts_at)}</span>
                </div>
                <div className="rounded-2xl bg-gray-50 p-3">
                  <span className="block text-xs text-gray-500">ينتهي</span>
                  <span className="font-semibold text-gray-900">{formatDateValue(promotion.ends_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingPromotion ? "تعديل العرض" : "إضافة عرض جديد"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">عنوان العرض</label>
            <input
              name="title"
              type="text"
              className="input-field"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">الوصف</label>
            <textarea
              name="description"
              rows={4}
              className="input-field resize-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">نسبة الخصم (%)</label>
              <input
                name="discount_percent"
                type="number"
                min="0"
                max="100"
                className="input-field"
                value={form.discount_percent}
                onChange={(e) => setForm({ ...form, discount_percent: parseInt(e.target.value, 10) || 0 })}
                required
              />
            </div>
            <div className="flex flex-col gap-3">
              <label className="label">الحالة</label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-primary-600"
                />
                <span className="text-sm text-gray-700">نشط</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">تاريخ بدء العرض</label>
              <input
                name="starts_at"
                type="datetime-local"
                className="input-field"
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
              />
            </div>
            <div>
              <label className="label">تاريخ نهاية العرض</label>
              <input
                name="ends_at"
                type="datetime-local"
                className="input-field"
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">
              إلغاء
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "جاري الحفظ..." : editingPromotion ? "تحديث العرض" : "إضافة العرض"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
