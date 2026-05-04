import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const storeId = url.searchParams.get("store");
    const size = parseInt(url.searchParams.get("size") || "192");

    if (!storeId) {
      return new NextResponse("Store ID required", { status: 400 });
    }

    const supabase = await createClient();
    const { data: store } = await supabase
      .from("stores")
      .select("logo_initials, logo_color")
      .eq("id", storeId)
      .single();

    if (!store) {
      return new NextResponse("Store not found", { status: 404 });
    }

    // Generate SVG icon
    const svg = generateStoreIconSVG(store.logo_initials || "S", store.logo_color || "#0ea5e9", size);

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error("Store icon generation error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

function generateStoreIconSVG(initials: string, color: string, size: number) {
  const fontSize = Math.floor(size * 0.4);
  const centerX = size / 2;
  const centerY = size / 2;

  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="${color}" rx="${size * 0.2}" ry="${size * 0.2}"/>
    <text x="${centerX}" y="${centerY + fontSize * 0.35}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle">${initials}</text>
  </svg>`;
}