import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Supabase logout error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get the store slug from the request URL or referer
    const referer = request.headers.get("referer");

    let redirectUrl = "/";

    if (referer) {
      try {
        const refererUrl = new URL(referer);
        const storeMatch = refererUrl.pathname.match(/^\/store\/([^\/]+)/);
        if (storeMatch) {
          redirectUrl = `/store/${storeMatch[1]}`;
        }
      } catch (e) {
        console.error("Error parsing referer:", e);
      }
    }

    // Use the request's own URL to build the redirect
    const requestUrl = new URL(request.url);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin;
    
    return NextResponse.redirect(new URL(redirectUrl, siteUrl));
  } catch (error) {
    console.error("Logout endpoint error:", error);
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    );
  }
}