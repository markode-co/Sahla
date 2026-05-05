import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const safeNext = next && next.startsWith("/") ? next : "/";

  const getLoginRedirectUrl = () => {
    if (!safeNext.startsWith("/store/")) {
      return `${origin}/login`;
    }

    const segments = safeNext.split("/").filter(Boolean);
    if (segments.length < 2) {
      return `${origin}/login`;
    }

    return `${origin}/store/${segments[1]}/login`;
  };

  const loginRedirectUrl = `${getLoginRedirectUrl()}?error=`;

  if (!code) {
    return NextResponse.redirect(`${loginRedirectUrl}missing_code&next=${encodeURIComponent(safeNext)}`);
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
    return NextResponse.redirect(`${loginRedirectUrl}oauth_failed&next=${encodeURIComponent(safeNext)}`);
  }

  const user = data.user;

  // Ensure user profile exists (Google users bypass the DB trigger if it already fired)
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const insertRole = safeNext.startsWith("/store/") ? "customer" : "merchant";

  if (!profile) {
    await supabase.from("users").insert({
      id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      phone: user.user_metadata?.phone ?? null,
      role: insertRole,
    });
  }

  const role = profile?.role ?? insertRole;
  let redirectPath = safeNext;

  if (role === "admin") {
    redirectPath = "/dashboard/admin";
  } else if (role === "merchant") {
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!store) {
      redirectPath = "/onboarding/store-setup";
    } else {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .single();

      if (!subscription || subscription.status !== "active") {
        redirectPath = "/onboarding/subscription";
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`);
}
