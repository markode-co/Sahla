import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const storeSlug = body?.storeSlug?.toString();
    const orderId = body?.orderId?.toString();
    const customerPhone = body?.customerPhone?.toString();

    if (!storeSlug || !orderId || !customerPhone) {
      return NextResponse.json(
        { error: "بيانات البحث غير كاملة" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", storeSlug)
      .single();

    if (storeError || !store) {
      return NextResponse.json(
        { error: "المتجر غير موجود" },
        { status: 404 }
      );
    }

    const { data: order, error } = await supabase
      .from("orders")
      .select("*, order_items(*), payments(*)")
      .eq("id", orderId)
      .eq("store_id", store.id)
      .eq("customer_phone", customerPhone)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: "لم يتم العثور على الطلب" },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
