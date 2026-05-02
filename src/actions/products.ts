"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getProducts(storeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function createProduct(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("غير مصرح");

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!store) throw new Error("لم يتم العثور على المتجر");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string);
  const stock = parseInt(formData.get("stock") as string) || 0;
  const imageFile = formData.get("image") as File | null;

  let imageUrl: string | null = null;

  if (imageFile && imageFile.size > 0) {
    const ext = imageFile.name.split(".").pop();
    const filePath = `${store.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("products")
      .upload(filePath, imageFile);

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from("products")
        .getPublicUrl(filePath);
      imageUrl = publicUrl;
    }
  }

  const { error } = await supabase.from("products").insert({
    store_id: store.id,
    name,
    description: description || null,
    price,
    stock,
    image_url: imageUrl,
    is_active: true,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/merchant/products");
}

export async function updateProduct(
  productId: string,
  data: {
    name: string;
    description: string;
    price: number;
    stock: number;
    is_active: boolean;
  }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", productId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/merchant/products");
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/merchant/products");
}

export async function getPublicProducts(storeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}
