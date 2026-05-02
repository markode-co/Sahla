"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Upload, Package } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { createProduct } from "@/actions/products";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  function handleImage(file: File) {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    if (imageFile) formData.set("image", imageFile);

    try {
      await createProduct(formData);
      toast.success("تم إضافة المنتج بنجاح!");
      router.push("/dashboard/merchant/products");
      router.refresh();
    } catch (err) {
      toast.error("حدث خطأ أثناء إضافة المنتج");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/merchant/products" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowRight className="w-5 h-5 text-gray-500" />
        </Link>
        <h1 className="page-title">إضافة منتج جديد</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload */}
        <div className="card p-6">
          <h2 className="section-title mb-4">صورة المنتج</h2>
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0">
              {imagePreview ? (
                <Image src={imagePreview} alt="Preview" width={128} height={128} className="object-cover w-full h-full" />
              ) : (
                <Package className="w-12 h-12 text-gray-300" />
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                id="image"
                accept="image/*"
                className="sr-only"
                onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])}
              />
              <label
                htmlFor="image"
                className="btn-secondary cursor-pointer inline-flex items-center gap-2 text-sm"
              >
                <Upload className="w-4 h-4" />
                {imagePreview ? "تغيير الصورة" : "رفع صورة"}
              </label>
              <p className="text-xs text-gray-400 mt-2">PNG, JPG — حجم أقصى 5MB</p>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="card p-6 space-y-5">
          <h2 className="section-title">معلومات المنتج</h2>

          <div>
            <label className="label">اسم المنتج *</label>
            <input
              name="name"
              type="text"
              required
              placeholder="مثال: قميص قطن للرجال"
              className="input-field"
            />
          </div>

          <div>
            <label className="label">الوصف</label>
            <textarea
              name="description"
              rows={4}
              placeholder="وصف تفصيلي للمنتج..."
              className="input-field resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">السعر (جنيه) *</label>
              <input
                name="price"
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                className="input-field"
              />
            </div>
            <div>
              <label className="label">الكمية المتاحة</label>
              <input
                name="stock"
                type="number"
                min="0"
                defaultValue="0"
                className="input-field"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/dashboard/merchant/products" className="btn-secondary flex-1 text-center">
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {loading ? "جاري الإضافة..." : "إضافة المنتج"}
          </button>
        </div>
      </form>
    </div>
  );
}
