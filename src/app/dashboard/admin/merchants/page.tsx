import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { formatDate, getPlanLabel } from "@/lib/utils";
import { MerchantActions } from "./merchant-actions";
import { Users, FileText } from "lucide-react";

export default async function AdminMerchantsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: merchants } = await supabase
    .from("users")
    .select(`
      *,
      stores(*),
      subscriptions(*),
      documents(*)
    `)
    .eq("role", "merchant")
    .order("created_at", { ascending: false });

  const storeStatusVariant: Record<string, "default" | "success" | "warning" | "danger"> = {
    pending: "warning",
    approved: "success",
    rejected: "danger",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">التجار</h1>
        <p className="text-gray-500 mt-1">{merchants?.length ?? 0} تاجر مسجل</p>
      </div>

      {!merchants || merchants.length === 0 ? (
        <div className="card p-16 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <p className="text-gray-400">لا يوجد تجار مسجلون بعد</p>
        </div>
      ) : (
        <div className="space-y-4">
          {merchants.map((merchant) => {
            const store = merchant.stores?.[0];
            const subscription = merchant.subscriptions?.[0];
            const docs = merchant.documents ?? [];

            return (
              <div key={merchant.id} className="card p-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ backgroundColor: store?.logo_color ?? "#0ea5e9" }}
                    >
                      {store?.logo_initials ?? merchant.email.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{merchant.full_name ?? merchant.email}</p>
                      <p className="text-sm text-gray-500">{merchant.email}</p>
                      {merchant.phone && (
                        <p className="text-sm text-gray-400">{merchant.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {store && (
                      <Badge variant={storeStatusVariant[store.status] ?? "default"}>
                        المتجر: {store.status === "pending" ? "قيد المراجعة" : store.status === "approved" ? "مفعل" : "مرفوض"}
                      </Badge>
                    )}
                    {subscription && (
                      <Badge variant="info">
                        {getPlanLabel(subscription.plan)}
                      </Badge>
                    )}
                    {!subscription && (
                      <Badge variant="danger">بدون اشتراك</Badge>
                    )}
                  </div>
                </div>

                {store && (
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">اسم المتجر</p>
                      <p className="text-sm font-medium text-gray-700">{store.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">رابط المتجر</p>
                      <p className="text-sm font-medium text-primary-600">/store/{store.slug}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">المستندات</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <FileText className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">{docs.length} ملف</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">تاريخ التسجيل</p>
                      <p className="text-sm font-medium text-gray-700">{formatDate(merchant.created_at)}</p>
                    </div>
                  </div>
                )}

                {/* Documents */}
                {docs.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {docs.map((doc: { id: string; type: string; file_url: string; status: string }) => (
                      <a
                        key={doc.id}
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {doc.type === "national_id" ? "بطاقة الهوية" : doc.type === "commercial_register" ? "السجل التجاري" : "البطاقة الضريبية"}
                      </a>
                    ))}
                  </div>
                )}

                {/* Actions */}
                {store && store.status === "pending" && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <MerchantActions storeId={store.id} merchantName={store.name} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
