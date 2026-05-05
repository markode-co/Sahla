"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, Search, Plus, Trash2, Edit2 } from "lucide-react";
import toast from "react-hot-toast";

interface StoreHeaderHeroProps {
  storeSlug: string;
  storeName: string;
}

export function StoreHeaderHero({ storeSlug, storeName }: StoreHeaderHeroProps) {
  const [session, setSession] = useState<any>(null);
  const [avatar, setAvatar] = useState<string>("");
  const [userName, setUserName] = useState("زائر");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSession(data.session);
        setUserName(
          data.session.user.user_metadata?.full_name ||
            data.session.user.email?.split("@")[0] ||
            "المستخدم"
        );
        setAvatar(data.session.user.user_metadata?.avatar_url || "");
      }
    });
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session) return;

    try {
      setUploading(true);
      const supabase = createClient();

      // Upload file to storage under the user's own folder
      const ext = file.name.split(".").pop() ?? "png";
      const filePath = `${session.user.id}/${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      // Update user metadata
      const { data: publicUrl } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      await supabase.auth.updateUser({
        data: {
          avatar_url: publicUrl.publicUrl,
        },
      });

      setAvatar(publicUrl.publicUrl);
      toast.success("تم تحديث الصورة بنجاح");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("فشل تحميل الصورة");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!session) return;
    try {
      setUploading(true);
      const supabase = createClient();
      await supabase.auth.updateUser({
        data: { avatar_url: "" },
      });
      setAvatar("");
      toast.success("تم حذف الصورة");
    } catch (error) {
      toast.error("فشل حذف الصورة");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-700 overflow-hidden">
              {avatar ? (
                <img src={avatar} alt={userName} className="h-full w-full object-cover" />
              ) : (
                userName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition">
              <label className="cursor-pointer p-1 hover:bg-black/20 rounded">
                <Plus className="w-5 h-5 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              {avatar && (
                <button
                  onClick={handleDeleteAvatar}
                  disabled={uploading}
                  className="p-1 hover:bg-black/20 rounded"
                >
                  <Trash2 className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm text-slate-500">مرحباً</p>
            <h2 className="text-xl font-semibold text-slate-900">{userName}</h2>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
        >
          <Bell className="w-5 h-5" />
        </button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="ابحث عن منتج..."
          className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-primary-500 focus:bg-white"
        />
      </div>
    </div>
  );
}
