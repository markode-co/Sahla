import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

function createServerSupabase(request: NextRequest) {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );
}

export async function GET(request: NextRequest) {
  const supabase = createServerSupabase(request);
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ session: data.session ?? null });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const session = body?.session;

  if (!session) {
    return NextResponse.json({ error: "Missing session payload" }, { status: 400 });
  }

  const supabase = createServerSupabase(request);
  const { error } = await supabase.auth.setSession(session);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
