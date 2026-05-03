import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPER_ADMIN_EMAIL = "ca.markode@gmail.com";

export async function middleware(request: NextRequest) {
  // Next.js Server Actions send POST with this header — pass through without interfering
  if (request.method === "POST" && request.headers.has("next-action")) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // ── Public routes ────────────────────────────────────────────────────────────
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/store/");

  // Not logged in → send to login (preserve intended destination)
  if (!user) {
    if (!isPublicRoute) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // ── Logged in ────────────────────────────────────────────────────────────────

  // Fetch profile — default to "merchant" if trigger hasn't fired yet
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "merchant";
  const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL;

  // Already logged in → redirect away from auth pages
  if (pathname === "/login" || pathname === "/register") {
    return NextResponse.redirect(
      new URL(isSuperAdmin || role === "admin" ? "/dashboard/admin" : "/dashboard/merchant", request.url)
    );
  }

  // Onboarding: always accessible for authenticated users — no extra checks
  if (pathname.startsWith("/onboarding")) {
    return supabaseResponse;
  }

  // ── Role guards ──────────────────────────────────────────────────────────────
  if (pathname.startsWith("/dashboard/admin") && role !== "admin" && !isSuperAdmin) {
    return NextResponse.redirect(new URL("/dashboard/merchant", request.url));
  }

  if (pathname.startsWith("/dashboard/merchant") && role === "admin" && !isSuperAdmin) {
    return NextResponse.redirect(new URL("/dashboard/admin", request.url));
  }

  // ── Merchant dashboard: check store + subscription ───────────────────────────
  if (pathname.startsWith("/dashboard/merchant") && role === "merchant" && !isSuperAdmin) {
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Only redirect if there is definitively no store (not on query error)
    if (!storeError && !store) {
      return NextResponse.redirect(new URL("/onboarding/store-setup", request.url));
    }

    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle();

    // Only redirect if there is definitively no subscription (not on query error)
    if (!subError) {
      if (!subscription) {
        return NextResponse.redirect(new URL("/onboarding/subscription", request.url));
      }
      if (subscription.status === "pending") {
        return NextResponse.redirect(new URL("/onboarding/subscription-pending", request.url));
      }
      if (subscription.status !== "active") {
        return NextResponse.redirect(new URL("/onboarding/subscription", request.url));
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
