import dns from "dns/promises";
import { NextResponse } from "next/server";

const normalizeDomain = (domain: string) =>
  domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*/, "");

export async function GET(request: Request) {
  const url = new URL(request.url);
  const domain = url.searchParams.get("domain")?.trim() ?? "";
  const normalizedDomain = normalizeDomain(domain);

  if (!normalizedDomain) {
    return NextResponse.json({ error: "يرجى إدخال الدومين" }, { status: 400 });
  }

  try {
    await dns.lookup(normalizedDomain);
    return NextResponse.json({ valid: true });
  } catch (error) {
    return NextResponse.json(
      { error: "لم يتم العثور على هذا الدومين. تأكد من ضبط سجل DNS بشكل صحيح." },
      { status: 400 }
    );
  }
}
