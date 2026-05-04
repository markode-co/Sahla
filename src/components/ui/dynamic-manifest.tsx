"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function DynamicManifest() {
  useEffect(() => {
    const updateManifest = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Get current store from URL if on store page
        const currentPath = window.location.pathname;
        // Extract store slug from paths like /store/my-store or /store/my-store/checkout
        const storeSlugMatch = currentPath.match(/^\/store\/([a-zA-Z0-9-]+)/);
        const storeSlug = storeSlugMatch ? storeSlugMatch[1] : null;

        let manifestUrl = "/api/manifest";

        if (storeSlug) {
          manifestUrl += `?store=${storeSlug}`;
        }

        const link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
        if (link) {
          link.href = manifestUrl;
          // Force manifest reload by dispatching a custom event
          window.dispatchEvent(new CustomEvent('manifest-updated', { detail: { manifestUrl, storeSlug } }));
        }

        // Also update favicon if we have store data
        if (storeSlug) {
          updateFavicon(storeSlug);
        } else if (user) {
          // For authenticated users, try to get their store
          const { data: profile } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

          if (profile?.role === "merchant" || profile?.role === "admin") {
            const { data: store } = await supabase
              .from("stores")
              .select("id, slug")
              .eq("user_id", user.id)
              .single();

            if (store) {
              updateFavicon(store.id);
            }
          }
        }
      } catch (error) {
        console.error("Manifest update error:", error);
        // Fallback to default manifest
        const link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
        if (link) {
          link.href = "/api/manifest";
        }
      }
    };

    const updateFavicon = async (storeIdentifier: string) => {
      try {
        const supabase = createClient();
        let store;

        // Check if storeIdentifier is an ID or slug
        if (storeIdentifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
          // It's a UUID (store ID)
          store = await supabase
            .from("stores")
            .select("logo_url, logo_initials, logo_color, id")
            .eq("id", storeIdentifier)
            .single();
        } else {
          // It's a slug
          store = await supabase
            .from("stores")
            .select("logo_url, logo_initials, logo_color, id")
            .eq("slug", storeIdentifier)
            .single();
        }

        if (store.data) {
          const faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
          if (faviconLink) {
            if (store.data.logo_url) {
              faviconLink.href = store.data.logo_url;
            } else {
              // Use generated icon
              faviconLink.href = `/api/store-icon?store=${store.data.id}&size=32`;
            }
          }
        }
      } catch (error) {
        console.error("Favicon update error:", error);
      }
    };

    // Only run on client side
    if (typeof window !== 'undefined') {
      updateManifest();
    }
  }, []);

  return null;
}