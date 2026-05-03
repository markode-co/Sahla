import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllMerchants } from "@/actions/admin";
import { Badge } from "@/components/ui/badge";
import { formatDate, getPlanLabel } from "@/lib/utils";
import { Users, FileText } from "lucide-react";
import { MerchantsExportButton } from "./export-button";

const SUPER_ADMIN_EMAIL = "ca.markode@gmail.com";

export default async function AdminMerchantsPage() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/login");
  if (user.email !== SUPER_ADMIN_EMAIL) {
    const { data: profile } = await authClient.from("users").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") redirect("/dashboard/merchant");
  }

  const merchants = await getAllMerchants();

  const storeStatusVariant: Record<string, "default" | "success" | "warning" | "danger"> = {
    pending: "warning",
    approved: "success",
    rejected: "danger",
  };

  // Build export rows
  const exportRows = merchants.map((m) => {
    const store = m.stores?.[0];
    const subscription = m.subscriptions?.[0];
    return {
      name: m.full_name ?? "",
      email: m.email ?? "",
      phone: m.phone ?? "",
      storeName: store?.name ?? "",
      storeSlug: store?.slug ?? "",
      storeStatus: store?.status ?? "",
      plan: subscription?.plan ?? "",
      docsCount: (m.documents ?? []).length,
      registeredAt: formatDate(m.created_at),
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">التجار</h1>
          <p className="text-gray-500 mt-1">{merchants.length} تاجر مسجل</p>
        </div>
        <MerchantsExportButton rows={exportRows} />
      </div>

      {merchants.length === 0 ? (
        <div className="card p-16 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <p className="text-gray-400">لا يوجد تجار مسجلون بعد</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">التاجر</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">التواصل</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">المتجر</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">حالة المتجر</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">الاشتراك</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">المستندات</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {merchants.map((merchant) => {
                  const store = merchant.stores?.[0];
                  const subscription = merchant.subscriptions?.[0];
                  const docs = merchant.documents ?? [];

                  return (
                    <tr key={merchant.id} className="hover:bg-gray-50 transition-colors">
                      {/* التاجر */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                            style={{ backgroundColor: store?.logo_color ?? "#0ea5e9" }}
                          >
                            {store?.logo_initials ?? merchant.email.slice(0, 2).toUpperCase()}
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            {merchant.full_name ?? "—"}
                          </p>
                        </div>
                      </td>

                      {/* التواصل */}
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-700">{merchant.email}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{merchant.phone ?? "—"}</p>
                      </td>

                      {/* المتجر */}
                      <td className="px-5 py-4">
                        {store ? (
                          <>
                            <p className="text-sm font-medium text-gray-900">{store.name}</p>
                            <p className="text-xs text-primary-600 mt-0.5">/store/{store.slug}</p>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">لا يوجد</span>
                        )}
                      </td>

                      {/* حالة المتجر */}
                      <td className="px-5 py-4">
                        {store ? (
                          <Badge variant={storeStatusVariant[store.status] ?? "default"}>
                            {store.status === "pending" ? "قيد المراجعة" : store.status === "approved" ? "مفعّل" : "مرفوض"}
                          </Badge>
                        ) : (
                          <Badge variant="default">بدون متجر</Badge>
                        )}
                      </td>

                      {/* الاشتراك */}
                      <td className="px-5 py-4">
                        {subscription ? (
                          <Badge variant="info">{getPlanLabel(subscription.plan)}</Badge>
                        ) : (
                          <Badge variant="danger">بدون اشتراك</Badge>
                        )}
                      </td>

                      {/* المستندات */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{docs.length} ملف</span>
                        </div>
                        {docs.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {docs.map((doc: { id: string; file_url: string; type: string }) => (
                              <a
                                key={doc.id}
                                href={doc.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-primary-600 hover:underline bg-primary-50 px-1.5 py-0.5 rounded"
                              >
                                {doc.type === "national_id" ? "هوية" : doc.type === "commercial_register" ? "سجل" : "ضريبي"}
                              </a>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* تاريخ التسجيل */}
                      <td className="px-5 py-4 text-sm text-gray-400 whitespace-nowrap">
                        {formatDate(merchant.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
