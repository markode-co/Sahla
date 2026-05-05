"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface LogoutButtonProps {
  storeSlug: string;
  storeCustomDomain?: string | null;
}

export function LogoutButton({ storeSlug, storeCustomDomain }: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      // Redirect to the store page after logout.
      const redirectUrl = storeCustomDomain ? "/" : `/store/${storeSlug}`;
      router.push(redirectUrl);
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 text-red-700 border border-red-100 text-sm font-medium hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <LogOut className="w-4 h-4" />
      {isLoggingOut ? "جاري الخروج..." : "تسجيل الخروج"}
    </button>
  );
}
