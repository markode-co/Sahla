"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Phone, Smartphone, Building2, Truck, Download, LogOut } from "lucide-react";
import type { Store, PaymentMethod } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { triggerAppInstall, setupPWAPromptListener, isAppInstalled } from "@/lib/pwa-utils";

interface StoreHeaderProps {
  store: Store;
  paymentMethod: PaymentMethod | null;
}

export function StoreHeader({ store, paymentMethod }: StoreHeaderProps) {
  const [session, setSession] = useState<any>(null);
  const [isAppInstalledState, setIsAppInstalledState] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setupPWAPromptListener();

    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    // Check if app is installed
    setIsAppInstalledState(isAppInstalled());

    // Listen for app installation changes
    const handleAppInstalled = () => {
      setIsAppInstalledState(true);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      // Redirect to store page after logout
      window.location.href = `/store/${store.slug}`;
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-5 min-w-0">
            {store.logo_url ? (
              <img
                src={store.logo_url}
                alt={store.name}
                className="w-16 h-16 rounded-2xl object-cover shadow-sm"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-sm flex-shrink-0"
                style={{ backgroundColor: store.logo_color ?? "#0ea5e9" }}
              >
                {store.logo_initials ?? store.name.slice(0, 2)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">{store.name}</h1>
              {store.description && (
                <p className="text-gray-500 mt-1 text-sm line-clamp-2">{store.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-2">
                {paymentMethod?.instapay_username && (
                  <div className="flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                    <Smartphone className="w-3.5 h-3.5" />
                    انستاباي
                  </div>
                )}
                {paymentMethod?.bank_name && (
                  <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    <Building2 className="w-3.5 h-3.5" />
                    تحويل بنكي
                  </div>
                )}
                {paymentMethod?.cash_on_delivery && (
                  <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                    <Truck className="w-3.5 h-3.5" />
                    الدفع عند الاستلام
                  </div>
                )}
                <a
                  href={`/store/${store.slug}/track`}
                  className="text-sm inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50 text-primary-700 px-3 py-1.5 hover:bg-primary-100 transition"
                >
                  <Truck className="w-3.5 h-3.5" />
                  تتبع الطلب
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {!session && (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href={`/store/${store.slug}/login?next=/store/${store.slug}`}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-primary-200 text-primary-700 text-sm font-medium hover:bg-primary-50 transition"
                >
                  تسجيل دخول
                </Link>
                <Link
                  href={`/store/${store.slug}/register?next=/store/${store.slug}`}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary-50 text-primary-700 text-sm font-medium hover:bg-primary-100 transition"
                >
                  أنشئ حسابًا
                </Link>
              </div>
            )}
            {session && (
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 text-red-700 border border-red-100 text-sm font-medium hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="w-4 h-4" />
                {isLoggingOut ? "جاري الخروج..." : "تسجيل الخروج"}
              </button>
            )}
            {!isAppInstalledState && (
              <button
                onClick={async () => {
                  // Ensure manifest is updated before triggering install
                  // This forces the browser to use the correct start_url for this store
                  const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
                  if (manifestLink && !manifestLink.href.includes(`store=${store.slug}`)) {
                    manifestLink.href = `/api/manifest?store=${store.slug}`;
                    // Give the browser a moment to recognize the new manifest
                    await new Promise(resolve => setTimeout(resolve, 500));
                  }
                  triggerAppInstall(store.name, "customer");
                  // Immediately hide the button after click
                  setIsAppInstalledState(true);
                }}
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition active:scale-95"
              >
                <Download className="w-4 h-4" />
                تنزيل التطبيق
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
