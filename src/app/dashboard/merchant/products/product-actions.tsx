"use client";

import { useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { deleteProduct, updateProduct } from "@/actions/products";
import { Modal } from "@/components/ui/modal";
import type { Product } from "@/types";

export function ProductActions({ product }: { product: Product }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: product.name,
    description: product.description ?? "",
    price: product.price,
    stock: product.stock,
    is_active: product.is_active,
  });

  async function handleDelete() {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    setDeleting(true);
    try {
      await deleteProduct(product.id);
      toast.success("تم حذف المنتج");
    } catch {
      toast.error("حدث خطأ");
    }
    setDeleting(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProduct(product.id, form);
      toast.success("تم تحديث المنتج");
      setEditOpen(false);
    } catch {
      toast.error("حدث خطأ");
    }
    setSaving(false);
  }

  return (
    <>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => setEditOpen(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium transition-colors"
        >
          <Edit className="w-3.5 h-3.5" />
          تعديل
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center justify-center p-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="تعديل المنتج">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">اسم المنتج</label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">الوصف</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">السعر (جنيه)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input-field"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="label">المخزون</label>
              <input
                type="number"
                min="0"
                className="input-field"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4 rounded text-primary-600"
            />
            <span className="text-sm text-gray-700">المنتج مرئي في المتجر</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setEditOpen(false)} className="btn-secondary flex-1">
              إلغاء
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
