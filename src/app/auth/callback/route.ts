import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const safeNext = next && next.startsWith("/") ? next : "/dashboard/merchant";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  const user = data.user;

  // Ensure user profile exists (Google users bypass the DB trigger if it already fired)
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  // If profile doesn't exist yet (race condition), insert it
  if (!profile) {
    await supabase.from("users").insert({
      id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      phone: user.user_metadata?.phone ?? null,
      role: "merchant",
    });
  }

  const role = profile?.role ?? "merchant";

  if (role === "admin") {
    return NextResponse.redirect(`${origin}/dashboard/admin`);
  }

  // Check if merchant already has a store
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!store) {
    return NextResponse.redirect(`${origin}/onboarding/store-setup`);
  }

  // Check subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .single();

  if (!subscription || subscription.status !== "active") {
    return NextResponse.redirect(`${origin}/onboarding/subscription`);
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
