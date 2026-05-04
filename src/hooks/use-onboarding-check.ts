"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function useOnboardingCheck() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const user = session.user;

      // Check if user has profile
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile) {
        // No profile yet, stay on current page
        return;
      }

      // Check if user has store
      const { data: store } = await supabase
        .from("stores")
        .select("id, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!store) {
        // No store, redirect to store setup
        router.replace("/onboarding/store-setup");
        return;
      }

      // Check if store is rejected
      if (store.status === "rejected") {
        // Store rejected, redirect to store setup to try again
        router.replace("/onboarding/store-setup");
        return;
      }

      // Check if user has payment methods
      const { data: paymentMethods } = await supabase
        .from("payment_methods")
        .select("id")
        .eq("store_id", store.id)
        .maybeSingle();

      if (!paymentMethods) {
        // No payment methods, redirect to payment setup
        router.replace("/onboarding/payment");
        return;
      }

      // Check if user has documents
      const { data: documents } = await supabase
        .from("documents")
        .select("id, type")
        .eq("user_id", user.id);

      const hasRequiredDocuments = documents && documents.length >= 2; // national_id and commercial_register

      if (!hasRequiredDocuments) {
        // Missing required documents, redirect to documents
        router.replace("/onboarding/documents");
        return;
      }

      // Check subscription status
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!subscription) {
        // No subscription, redirect to subscription
        router.replace("/onboarding/subscription");
        return;
      }

      if (subscription.status === "pending") {
        // Subscription pending, redirect to pending page
        router.replace("/onboarding/subscription-pending");
        return;
      }

      if (subscription.status === "active") {
        // Subscription active, redirect to dashboard
        router.replace("/dashboard/merchant");
        return;
      }

      // Subscription rejected or other status, redirect to subscription
      router.replace("/onboarding/subscription");
    })();
  }, [router]);
}