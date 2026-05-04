"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  LogOut,
  Users,
  Store,
  CreditCard,
  BarChart3,
  ChevronLeft,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

const SUPER_ADMIN_EMAIL = "ca.markode@gmail.com";

interface SidebarProps {
  role: "admin" | "merchant";
  storeName?: string;
  storeSlug?: string;
  storeInitials?: string;
  storeColor?: string;
  userEmail?: string;
  userInitials?: string;
}

const merchantLinks = [
  { href: "/dashboard/merchant", label: "لوحة التحكم", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/merchant/products", label: "المنتجات", icon: Package },
  { href: "/dashboard/merchant/orders", label: "الطلبات", icon: ShoppingCart },
  { href: "/dashboard/merchant/settings", label: "الإعدادات", icon: Settings },
];

const adminLinks = [
  { href: "/dashboard/admin", label: "لوحة التحكم", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/admin/merchants", label: "التجار", icon: Users },
  { href: "/dashboard/admin/orders", label: "الطلبات", icon: ShoppingCart },
  { href: "/dashboard/admin/subscriptions", label: "الاشتراكات", icon: CreditCard },
  { href: "/dashboard/admin/settings", label: "الإعدادات", icon: Settings },
];

export function Sidebar({
  role,
  storeName,
  storeSlug,
  storeInitials,
  storeColor,
  userEmail,
  userInitials,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isSuperAdmin = userEmail === SUPER_ADMIN_EMAIL;
  const isOnAdminPages = pathname.startsWith("/dashboard/admin");

  const links = isSuperAdmin
    ? isOnAdminPages
      ? adminLinks
      : merchantLinks
    : role === "admin"
    ? adminLinks
    : merchantLinks;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("تم تسجيل الخروج");
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  function openMenu() {
    setMobileOpen(true);
  }

  function closeMenu() {
    setMobileOpen(false);
  }

  // Called as a function each time — creates independent JSX instances
  function renderNav() {
    return (
      <div className="flex flex-col h-full">
        {/* Brand */}
        <div className="p-5 border-b border-gray-100">
          <Link href="/" onClick={closeMenu} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">س</span>
            </div>
            <span className="font-bold text-gray-900">سهلة</span>
          </Link>
        </div>

        {/* Info card */}
        {(isSuperAdmin && isOnAdminPages) || role === "admin" ? (
          <div className="p-4 mx-3 mt-3 bg-primary-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {userInitials ?? "A"}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-primary-900 text-sm">مدير النظام</p>
                <p className="text-xs text-primary-500 truncate">{userEmail}</p>
              </div>
            </div>
          </div>
        ) : storeName ? (
          <div className="p-4 mx-3 mt-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0"
                style={{ backgroundColor: storeColor ?? "#0ea5e9" }}
              >
                {storeInitials ?? storeName.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{storeName}</p>
                <p className="text-xs text-gray-400 truncate">{userEmail}</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Navigation */}
        <nav className="flex-1 p-3 mt-2 space-y-1 overflow-y-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeMenu}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive(link.href, link.exact)
                  ? "bg-primary-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <link.icon className="w-5 h-5 flex-shrink-0" />
              {link.label}
            </Link>
          ))}

          {/* Store link — merchant only */}
          {!isOnAdminPages && role === "merchant" && storeSlug && (
            <div className="space-y-1">
              <Link
                href={`/store/${storeSlug}/login?next=/store/${storeSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMenu}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all"
              >
                <Store className="w-5 h-5 flex-shrink-0" />
                المتجر العام
                <ChevronLeft className="w-4 h-4 mr-auto" />
              </Link>
              <p className="text-xs text-gray-400 px-3">https://sahla.app/store/{storeSlug}</p>
            </div>
          )}

          {/* Super admin switcher */}
          {isSuperAdmin && (
            <Link
              href={isOnAdminPages ? "/dashboard/merchant" : "/dashboard/admin"}
              onClick={closeMenu}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isOnAdminPages
                  ? "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  : "text-orange-600 hover:bg-orange-50"
              )}
            >
              {isOnAdminPages ? (
                <>
                  <ArrowRight className="w-5 h-5 flex-shrink-0" />
                  رجوع كتاجر
                </>
              ) : (
                <>
                  <BarChart3 className="w-5 h-5 flex-shrink-0" />
                  إدارة النظام
                </>
              )}
            </Link>
          )}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-l border-gray-100 h-screen sticky top-0 shadow-sm overflow-y-auto">
        {renderNav()}
      </aside>

      {/* Mobile: Top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between shadow-sm">
        <button
          type="button"
          onClick={openMenu}
          aria-label="فتح القائمة"
          className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">س</span>
          </div>
          <span className="font-bold text-gray-900">سهلة</span>
        </Link>
        <div className="w-10" />
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={closeMenu}
          />
          {/* Drawer panel */}
          <aside className="absolute top-0 right-0 h-full w-72 bg-white shadow-2xl flex flex-col overflow-y-auto">
            <button
              type="button"
              onClick={closeMenu}
              aria-label="إغلاق القائمة"
              className="absolute top-4 left-4 p-2 rounded-lg hover:bg-gray-100 z-10"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            {renderNav()}
          </aside>
        </div>
      )}
    </>
  );
}
