import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Bell, Home, LogOut, Settings, ShoppingBag, User } from "lucide-react";

interface Props {
  params: { slug: string };
  children: React.ReactNode;
}

export default async function StoreLayout({ params, children }: Props) {
  const { slug } = params;
  const supabase = await createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("name")
    .eq("slug", slug)
    .eq("status", "approved")
    .single();

  if (!store) notFound();

  const navItems = [
    { href: `/store/${slug}`, label: "الرئيسية", icon: Home },
    { href: `/store/${slug}/orders`, label: "الطلبات", icon: ShoppingBag },
    { href: `/store/${slug}/notifications`, label: "الإشعارات", icon: Bell },
    { href: `/store/${slug}/profile`, label: "الملف الشخصي", icon: User },
    { href: `/store/${slug}/settings`, label: "الإعدادات", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between h-20">
            <div>
              <p className="text-xs text-gray-500">متجر إلكتروني كامل</p>
              <h1 className="text-lg font-semibold text-gray-900">{store.name}</h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 text-red-700 border border-red-100 text-sm font-medium hover:bg-red-100"
              >
                <LogOut className="w-4 h-4" />
                تسجيل الخروج
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
    </div>
  );
}
