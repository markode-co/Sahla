"use client";

import { useEffect, useState } from "react";
import { Store, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Store as StoreType, User } from "@/types";
import { generateLogoInitials } from "@/lib/utils";

export function StoreSettingsForm({
  store,
  profile,
}: {
  store: StoreType;
  profile: User | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [slugError, setSlugError] = useState<string>("");
  const [domainError, setDomainError] = useState<string>("");
  const [form, setForm] = useState({
    name: store.name,
    slug: store.slug,
    customDomain: store.custom_domain ?? "",
    description: store.description ?? "",
    fullName: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(store.logo_url ?? null);

  useEffect(() => {
    return () => {
      if (logoPreview && logoFile) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview, logoFile]);

  const validateSlug = async (slug: string): Promise<boolean> => {
    if (!slug.trim()) {
      setSlugError("الرابط مطلوب");
      return false;
    }

    // Check if slug contains only valid characters (letters, numbers, hyphens)
    const slugRegex = /^[a-zA-Z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      setSlugError("الرابط يجب أن يحتوي على أحرف إنجليزية وأرقام وشرطة فقط");
      return false;
    }

    // Check if slug is unique (excluding current store)
    const supabase = createClient();
    const { data, error } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", slug)
      .neq("id", store.id);

    if (error) {
      setSlugError("حدث خطأ في التحقق من الرابط");
      return false;
    }

    if (data && data.length > 0) {
      setSlugError("هذا الرابط مستخدم بالفعل");
      return false;
    }

    setSlugError("");
    return true;
  };

  const normalizeDomain = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*/, "");

  const validateDomain = async (domain: string): Promise<boolean> => {
    const normalizedDomain = normalizeDomain(domain);
    setForm((prev) => ({ ...prev, customDomain: normalizedDomain }));

    if (!normalizedDomain) {
      setDomainError("");
      return true;
    }

    const domainRegex = /^(?!-)(?!.*--)(?!.*\.$)(?!.*\.\.)[a-z0-9]+(?:[.-][a-z0-9]+)*\.[a-z]{2,63}$/;
    if (!domainRegex.test(normalizedDomain)) {
      setDomainError("أدخل دومين صالح بدون https:// أو مسارات");
      return false;
    }

    if (normalizedDomain === store.custom_domain) {
      setDomainError("");
      return true;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("stores")
      .select("id")
      .eq("custom_domain", normalizedDomain)
      .neq("id", store.id);

    if (error) {
      setDomainError("حدث خطأ في التحقق من الدومين");
      return false;
    }

    if (data && data.length > 0) {
      setDomainError("هذا الدومين مستخدم بالفعل");
      return false;
    }

    try {
      const response = await fetch(`/api/validate-domain?domain=${encodeURIComponent(normalizedDomain)}`);
      const result = await response.json();
      if (!response.ok || !result.valid) {
        setDomainError(result.error || "هذا الدومين غير متاح حالياً");
        return false;
      }
    } catch (err) {
      setDomainError("لم نتمكن من التحقق من الدومين الآن، حاول لاحقاً");
      return false;
    }

    setDomainError("");
    return true;
  };

  const handleSlugChange = async (value: string) => {
    setForm(prev => ({ ...prev, slug: value }));
    if (value !== store.slug) {
      await validateSlug(value);
    } else {
      setSlugError("");
    }
  };

  const handleDomainChange = (value: string) => {
    setForm(prev => ({ ...prev, customDomain: value }));
    setDomainError("");
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    // Validate slug and custom domain before saving
    const isSlugValid = await validateSlug(form.slug);
    const isDomainValid = await validateDomain(form.customDomain);
    if (!isSlugValid || !isDomainValid) {
      return;
    }

    setSaving(true);
    const supabase = createClient();

    let logoUrl = store.logo_url;
    if (logoFile && logoFile.size > 0) {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const ext = logoFile.name.split(".").pop() ?? "png";
      const filePath = `${currentUser?.id ?? store.user_id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("store-logos")
        .upload(filePath, logoFile, { upsert: true });

      if (uploadError) {
        toast.error("فشل تحميل الشعار، يرجى المحاولة لاحقاً");
        setSaving(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("store-logos")
        .getPublicUrl(filePath);
      logoUrl = publicUrl;
    }

    const [storeUpdate, profileUpdate] = await Promise.all([
      supabase.from("stores").update({
        name: form.name,
        slug: form.slug,
        custom_domain: form.customDomain || null,
        description: form.description || null,
        logo_initials: generateLogoInitials(form.name),
        logo_url: logoUrl,
      }).eq("id", store.id),
      supabase.from("users").update({
        full_name: form.fullName,
        phone: form.phone,
      }).eq("id", profile?.id ?? ""),
    ]);

    if (storeUpdate.error || profileUpdate.error) {
      toast.error("حدث خطأ أثناء الحفظ");
    } else {
      toast.success("تم حفظ الإعدادات");
      router.refresh();
    }
    setSaving(false);
  }

  async function handleDeleteStore() {
    if (!confirm("هل أنت متأكد من حذف المتجر؟ هذا الإجراء لا يمكن التراجع عنه وسيحذف جميع المنتجات والطلبات.")) return;

    setDeleting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("يرجى تسجيل الدخول مرة أخرى");
        return;
      }

      // Delete store and related data
      await supabase.from("stores").delete().eq("owner_id", user.id);

      toast.success("تم حذف المتجر بنجاح");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ في حذف المتجر");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
          <Store className="w-5 h-5 text-primary-600" />
        </div>
        <h2 className="section-title">معلومات المتجر</h2>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">اسم المتجر</label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">رابط المتجر</label>
            <div className="flex items-center">
              <span className="inline-flex items-center px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-sm text-gray-600">
                https://sahla.app/store/
              </span>
              <input
                className={`input-field rounded-l-none border-l-0 ${slugError ? 'border-red-300 focus:border-red-500' : ''}`}
                value={form.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="اسم-المتجر"
                required
              />
            </div>
            {slugError && (
              <p className="text-xs text-red-600 mt-1">{slugError}</p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              رابط متجرك سيكون: https://sahla.app/store/{form.slug}
            </p>
          </div>
        </div>

        <div>
          <label className="label">دومين المتجر (اختياري)</label>
          <input
            className={`input-field ${domainError ? 'border-red-300 focus:border-red-500' : ''}`}
            value={form.customDomain}
            onChange={(e) => handleDomainChange(e.target.value)}
            onBlur={async () => { await validateDomain(form.customDomain); }}
            placeholder="example.com"
          />
          {domainError && (
            <p className="text-xs text-red-600 mt-1">{domainError}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            إذا أدخلت دومين صالحاً وتم توجيهه إلى التطبيق عبر DNS، سيكون هذا الدومين هو الرابط المباشر لمتجرك.
          </p>
        </div>

        <div>
          <label className="label">شعار المتجر (اختياري)</label>
          <div className="flex flex-wrap items-center gap-4">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="شعار المتجر"
                className="w-16 h-16 rounded-2xl object-cover shadow-sm"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-sm"
                style={{ backgroundColor: store.logo_color ?? "#0ea5e9" }}
              >
                {store.logo_initials ?? store.name.slice(0, 2)}
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="file-input w-full max-w-xs"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                if (!file) {
                  setLogoFile(null);
                  setLogoPreview(store.logo_url ?? null);
                  return;
                }
                setLogoFile(file);
                setLogoPreview(URL.createObjectURL(file));
              }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            يمكنك رفع صورة لشعار متجرك ليظهر في صفحات المتجر ولوحة التحكم.
          </p>
        </div>

        <div>
          <label className="label">وصف المتجر</label>
          <textarea
            className="input-field resize-none"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="border-t border-gray-100 pt-4 mt-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">معلومات الحساب</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">الاسم الكامل</label>
              <input
                className="input-field"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>
            <div>
              <label className="label">رقم الهاتف</label>
              <input
                className="input-field"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>
      </form>

      <div className="border-t border-gray-100 pt-4 mt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-red-900">حذف المتجر</h2>
            <p className="text-red-600 mt-1">هذا الإجراء لا يمكن التراجع عنه وسيحذف جميع المنتجات والطلبات.</p>
          </div>
        </div>

        <button
          onClick={handleDeleteStore}
          disabled={deleting}
          className="btn-secondary bg-red-600 hover:bg-red-700 text-white border-red-600"
        >
          {deleting ? "جاري الحذف..." : "حذف المتجر"}
        </button>
      </div>
    </div>
  );
}
