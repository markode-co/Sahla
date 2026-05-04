"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { generateLogoInitials } from "@/lib/utils";

interface DashboardLayoutClientProps {
  profile: any;
  store: any;
  user: any;
  children: React.ReactNode;
}

export function DashboardLayoutClient({ profile, store, user, children }: DashboardLayoutClientProps) {
  const userInitials = generateLogoInitials(profile.full_name ?? profile.email);

  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      <Sidebar
        role={profile.role}
        storeName={store?.name}
        storeSlug={store?.slug}
        storeInitials={store?.logo_initials}
        storeColor={store?.logo_color}
        userEmail={user.email ?? profile.email}
        userInitials={userInitials}
      />
      <main className="flex-1 lg:p-8 p-4 pt-20 lg:pt-8 min-w-0">
        {children}
      </main>
    </div>
  );
}