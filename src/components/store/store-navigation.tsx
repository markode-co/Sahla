"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Heart, Home, Search, ShoppingBag, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "@/components/store/logout-button";

interface StoreNavigationProps {
  storeSlug: string;
  storeCustomDomain?: string | null;
}

const topNavItems = [
  { href: "home", label: "الرئيسية", icon: Home },
  { href: "favorites", label: "المفضلة", icon: Heart },
  { href: "orders", label: "الطلبات", icon: ShoppingBag },
  { href: "track", label: "بحث", icon: Search },
  { href: "profile", label: "الملف الشخصي", icon: User },
];

const bottomNavItems = [
  { href: "home", label: "الرئيسية", icon: Home },
  { href: "track", label: "بحث", icon: Search },
  { href: "orders", label: "الطلبات", icon: ShoppingBag },
  { href: "profile", label: "الملف الشخصي", icon: User },
];

export function StoreNavigation({ storeSlug, storeCustomDomain }: StoreNavigationProps) {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(Boolean(data.session));
    });
  }, []);

  if (!isLoggedIn) {
    return null;
  }

  const buildUrl = (route: string) => {
    switch (route) {
      case "home":
        return storeCustomDomain ? "/" : `/store/${storeSlug}`;
      default:
        return `/store/${storeSlug}/${route}`;
    }
  };

  return (
    <>
      <div className="hidden md:flex items-center flex-wrap justify-center gap-2 md:justify-end">
        {topNavItems.map((item) => {
          const Icon = item.icon;
          const href = buildUrl(item.href);
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={item.href}
              href={href}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition ${
                active
                  ? "bg-primary-600 text-white"
                  : "text-gray-700 bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
        <LogoutButton storeSlug={storeSlug} storeCustomDomain={storeCustomDomain} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 md:hidden bg-white border-t border-gray-200 shadow-[0_-1px_10px_rgba(15,23,42,0.08)]">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="grid grid-cols-4 gap-2">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const href = buildUrl(item.href);
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={item.href}
                  href={href}
                  className={`inline-flex flex-col items-center justify-center gap-1 rounded-3xl py-2 text-xs transition ${
                    active ? "text-primary-600 bg-primary-50" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
