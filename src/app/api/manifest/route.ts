import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get store slug from query params or referrer
    const url = new URL(request.url);
    const storeSlug = url.searchParams.get("store");

    let store = null;
    let role = "customer";

    if (user) {
      // Get user role
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      role = profile?.role === "merchant" || profile?.role === "admin" ? "merchant" : "customer";

      // If merchant, get their store
      if (role === "merchant") {
        const { data: userStore } = await supabase
          .from("stores")
          .select("*")
          .eq("user_id", user.id)
          .single();
        store = userStore;
      }
    }

    // If we have a store slug, get that store (for customer view)
    if (storeSlug && !store) {
      const { data: slugStore } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", storeSlug)
        .eq("status", "approved")
        .single();
      store = slugStore;
    }

    // Generate manifest based on store data
    const manifest = generateManifest(store, role);

    return new NextResponse(JSON.stringify(manifest, null, 2), {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Manifest generation error:", error);
    // Fallback manifest
    const fallbackManifest = generateManifest(null, "customer");
    return new NextResponse(JSON.stringify(fallbackManifest, null, 2), {
      headers: {
        "Content-Type": "application/manifest+json",
      },
    });
  }
}

function generateManifest(store: any, role: string) {
  const isMerchant = role === "merchant";

  // Default values
  let name = isMerchant ? "سهلة - لوحة تحكم التاجر" : "سهلة - متجر إلكتروني";
  let shortName = "سهلة";
  let description = isMerchant ? "إدارة متجرك الإلكتروني" : "تسوق من متاجرك المفضلة";
  let startUrl = isMerchant ? "/dashboard" : "/";
  let themeColor = "#0ea5e9";
  let backgroundColor = "#ffffff";
  let icons = [
    {
      src: "/icons/icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any maskable"
    },
    {
      src: "/icons/icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable"
    }
  ];

  // If we have store data, customize the manifest
  if (store) {
    name = isMerchant ? `${store.name} - لوحة التحكم` : store.name;
    shortName = store.name.length > 12 ? store.name.substring(0, 12) : store.name;
    description = store.description || (isMerchant ? `إدارة ${store.name}` : `تسوق من ${store.name}`);
    startUrl = isMerchant ? "/dashboard" : `/store/${store.slug}`;

    // Use store colors if available
    if (store.logo_color) {
      themeColor = store.logo_color;
    }

    // Use store logo if available
    if (store.logo_url) {
      icons = [
        {
          src: store.logo_url,
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: store.logo_url,
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ];
    } else if (store.logo_initials) {
      // Generate initials-based icon URL
      icons = [
        {
          src: `/api/store-icon?store=${store.id}&size=192`,
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: `/api/store-icon?store=${store.id}&size=512`,
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ];
    }
  }

  return {
    name,
    short_name: shortName,
    description,
    start_url: startUrl,
    display: "standalone",
    background_color: backgroundColor,
    theme_color: themeColor,
    orientation: "portrait",
    icons,
    categories: isMerchant ? ["business"] : ["shopping"],
    lang: "ar",
    dir: "rtl"
  };
}