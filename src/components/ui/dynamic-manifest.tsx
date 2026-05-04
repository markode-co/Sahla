"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function DynamicManifest() {
  useEffect(() => {
    const updateManifest = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          // Customer manifest
          const link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
          if (link) {
            link.href = "/manifest-customer.json";
          }
          return;
        }

        // Get user role
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        const link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
        if (link) {
          if (profile?.role === "merchant" || profile?.role === "admin") {
            link.href = "/manifest-merchant.json";
          } else {
            link.href = "/manifest-customer.json";
          }
        }
      } catch (error) {
        // Fallback to customer manifest on error
        const link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
        if (link) {
          link.href = "/manifest-customer.json";
        }
      }
    };

    // Only run on client side
    if (typeof window !== 'undefined') {
      updateManifest();
    }
  }, []);

  return null;
}