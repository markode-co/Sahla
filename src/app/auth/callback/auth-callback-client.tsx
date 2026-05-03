"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function hydrateSession() {
      const next = searchParams.get("next");
      const safeNext = next && next.startsWith("/") ? next : "/dashboard/merchant";

      const response = await fetch("/api/auth/session");
      if (!response.ok) {
        toast.error("فشل استرجاع جلسة تسجيل الدخول");
        router.replace("/login");
        return;
      }

      const { session } = await response.json();
      if (!session?.access_token) {
        toast.error("فشل تسجيل الدخول عبر جوجل، يرجى المحاولة مجدداً");
        router.replace("/login");
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.setSession(session);
      if (error) {
        console.error(error);
        toast.error("فشل تسجيل الدخول عبر جوجل، يرجى المحاولة مجدداً");
        router.replace("/login");
        return;
      }

      router.replace(safeNext);
    }

    hydrateSession();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center px-4" dir="rtl">
      <div className="card p-8 text-center">
        <h1 className="text-xl font-bold mb-2">جارٍ إتمام تسجيل الدخول...</h1>
        <p className="text-sm text-gray-500">انتظر لحظة بينما يتم تهيئة جلستك ثم سيتم تحويلك تلقائياً.</p>
      </div>
    </div>
  );
}
