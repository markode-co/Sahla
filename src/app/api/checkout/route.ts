import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createOrder } from "@/actions/orders";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const storeId = formData.get("storeId")?.toString();
    const customerName = formData.get("customerName")?.toString();
    const customerPhone = formData.get("customerPhone")?.toString();
    const customerAddress = formData.get("customerAddress")?.toString();
    const customerEmail = formData.get("customerEmail")?.toString() || undefined;
    const paymentMethod = formData.get("paymentMethod")?.toString();
    const notes = formData.get("notes")?.toString() || undefined;
    const itemsString = formData.get("items")?.toString();

    if (!storeId || !customerName || !customerPhone || !customerAddress || !paymentMethod) {
      return NextResponse.json({ error: "بيانات الطلب غير كاملة" }, { status: 400 });
    }

    let items;
    try {
      items = itemsString ? JSON.parse(itemsString) : [];
    } catch {
      return NextResponse.json({ error: "بيانات السلة غير صحيحة" }, { status: 400 });
    }

    let receiptUrl: string | null = null;
    const receiptFile = formData.get("receipt");

    if (receiptFile && receiptFile instanceof File && receiptFile.size > 0) {
      const supabase = createAdminClient();
      const ext = receiptFile.name.split(".").pop() || "jpg";
      const filePath = `receipts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(filePath, receiptFile, {
          contentType: receiptFile.type || undefined,
        });

      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }

      const { data: publicData } = supabase.storage
        .from("receipts")
        .getPublicUrl(filePath);

      if (!publicData?.publicUrl) {
        return NextResponse.json({ error: "فشل الحصول على رابط الإيصال" }, { status: 500 });
      }

      receiptUrl = publicData.publicUrl;
    }

    const order = await createOrder({
      storeId,
      customerName,
      customerPhone,
      customerAddress,
      customerEmail,
      paymentMethod,
      notes,
      items,
      receiptUrl,
    });

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
