"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, ArrowLeft, Upload, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

interface DocField {
  key: "national_id" | "commercial_register" | "tax_card";
  label: string;
  required: boolean;
}

const DOC_FIELDS: DocField[] = [
  { key: "national_id", label: "بطاقة الرقم القومي", required: true },
  { key: "commercial_register", label: "السجل التجاري", required: true },
  { key: "tax_card", label: "البطاقة الضريبية", required: false },
];

export default function DocumentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<Record<string, File | null>>({
    national_id: null,
    commercial_register: null,
    tax_card: null,
  });
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({});

  function handleFileChange(key: string, file: File | null) {
    setFiles((prev) => ({ ...prev, [key]: file }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!files.national_id || !files.commercial_register) {
      toast.error("يرجى رفع بطاقة الرقم القومي والسجل التجاري");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const uploadedDocs: { type: string; file_url: string }[] = [];

    for (const doc of DOC_FIELDS) {
      const file = files[doc.key];
      if (!file) continue;

      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${doc.key}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file, {
          contentType: file.type || undefined,
          upsert: true,
        });

      if (uploadError) {
        toast.error(`فشل رفع ${doc.label}`);
        setLoading(false);
        return;
      }

      // Generate a long-lived signed URL (10 years) for admin viewing
      const { data: signedData } = await supabase.storage
        .from("documents")
        .createSignedUrl(filePath, 315360000);

      uploadedDocs.push({ type: doc.key, file_url: signedData?.signedUrl ?? filePath });
      setUploaded((prev) => ({ ...prev, [doc.key]: true }));
    }

    // Save to DB
    for (const doc of uploadedDocs) {
      await supabase.from("documents").upsert({
        user_id: user.id,
        type: doc.type,
        file_url: doc.file_url,
        status: "pending",
      }, { onConflict: "user_id,type" });
    }

    toast.success("تم رفع المستندات بنجاح!");
    router.push("/onboarding/subscription");
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">رفع المستندات</h1>
            <p className="text-sm text-gray-500">الخطوة 3 من 4</p>
          </div>
        </div>

        <p className="text-sm text-gray-500 bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-6">
          يتم مراجعة مستنداتك من قِبَل فريقنا للتحقق من هويتك. هذه العملية تستغرق 24-48 ساعة.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {DOC_FIELDS.map((doc) => (
            <div key={doc.key} className="p-4 border border-gray-200 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <label className="font-medium text-gray-800 text-sm">
                  {doc.label}
                  {doc.required && <span className="text-red-500 mr-1">*</span>}
                </label>
                {uploaded[doc.key] && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*,.heic,.heif,.pdf,.jpg,.jpeg,.png,.webp,.bmp,.tiff,.tif"
                  id={doc.key}
                  className="sr-only"
                  onChange={(e) => handleFileChange(doc.key, e.target.files?.[0] ?? null)}
                />
                <label
                  htmlFor={doc.key}
                  className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
                >
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {files[doc.key]
                      ? files[doc.key]!.name
                      : "اضغط لاختيار الملف (صورة أو PDF)"}
                  </span>
                </label>
              </div>
            </div>
          ))}

          <div className="flex gap-3 mt-6">
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
              {loading ? "جاري الرفع..." : "التالي: الاشتراك"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
