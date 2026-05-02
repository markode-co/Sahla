import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/sidebar";
import { generateLogoInitials } from "@/lib/utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const userInitials = generateLogoInitials(profile.full_name ?? profile.email);

  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      <Sidebar
        role={profile.role}
        storeName={store?.name}
        storeInitials={store?.logo_initials}
        storeColor={store?.logo_color}
        userEmail={profile.email}
        userInitials={userInitials}
      />
      <main className="flex-1 lg:p-8 p-4 pt-20 lg:pt-8 min-w-0">
        {children}
      </main>
    </div>
  );
}
