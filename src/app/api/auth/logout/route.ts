import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get the store slug from the request URL or referer
  const url = new URL(request.url);
  const referer = request.headers.get('referer');

  let redirectUrl = "/";

  if (referer) {
    const refererUrl = new URL(referer);
    const storeMatch = refererUrl.pathname.match(/^\/store\/([^\/]+)/);
    if (storeMatch) {
      redirectUrl = `/store/${storeMatch[1]}`;
    }
  }

  return NextResponse.redirect(new URL(redirectUrl, process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
}