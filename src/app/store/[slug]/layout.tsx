import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthModal } from "@/components/store/auth-modal";
import { StoreHeader } from "@/components/store/store-header";
import { StoreNavigation } from "@/components/store/store-navigation";
import type { Store, PaymentMethod } from "@/types";

interface Props {
  params: { slug: string };
  children: React.ReactNode;
}

export default async function StoreLayout({ params, children }: Props) {
  const { slug } = params;
  const supabase = await createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .eq("status", "approved")
    .single();

  if (!store) notFound();

  const { data: paymentMethod } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("store_id", store.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <StoreHeader store={store} paymentMethod={paymentMethod} />

      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:h-20 py-4">
            <div>
              <p className="text-xs text-gray-500">متجر إلكتروني كامل</p>
              <h1 className="text-lg font-semibold text-gray-900">{store.name}</h1>
            </div>

            <StoreNavigation storeSlug={slug} storeCustomDomain={store.custom_domain} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">{children}</main>
    </div>
  );
}
