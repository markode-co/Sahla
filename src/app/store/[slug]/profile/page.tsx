import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { StoreProfilePage } from "@/components/store/store-profile-page";
import type { Store } from "@/types";

interface Props {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;
  const supabase = await createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("name")
    .eq("slug", slug)
    .eq("status", "approved")
    .single();

  return {
    title: store?.name ? `${store.name} - الملف الشخصي` : "الملف الشخصي",
  };
}

export default async function ProfilePage({ params }: Props) {
  const { slug } = params;
  const supabase = await createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .eq("status", "approved")
    .single();

  if (!store) notFound();

  return <StoreProfilePage storeSlug={slug} store={store as Store} />;
}
