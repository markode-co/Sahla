import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    console.log("API called: /api/admin/store-status");
    const body = await request.json();
    const { storeId, status, rejectionReason } = body;
    console.log("Request body:", { storeId, status, rejectionReason });

    if (!storeId || typeof storeId !== "string") {
      return NextResponse.json({ error: "معرّف المتجر غير صالح" }, { status: 400 });
    }

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "حالة المتجر غير مدعومة" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("stores")
      .update({
        status,
        rejection_reason: rejectionReason || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", storeId);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Store status updated successfully");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
