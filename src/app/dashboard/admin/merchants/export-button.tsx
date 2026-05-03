"use client";

import { Download } from "lucide-react";

interface MerchantRow {
  name: string;
  email: string;
  phone: string;
  storeName: string;
  storeSlug: string;
  storeStatus: string;
  plan: string;
  docsCount: number;
  registeredAt: string;
}

export function MerchantsExportButton({ rows }: { rows: MerchantRow[] }) {
  function download() {
    const headers = [
      "الاسم",
      "البريد الإلكتروني",
      "رقم الهاتف",
      "اسم المتجر",
      "رابط المتجر",
      "حالة المتجر",
      "خطة الاشتراك",
      "عدد المستندات",
      "تاريخ التسجيل",
    ];

    const statusLabel: Record<string, string> = {
      pending: "قيد المراجعة",
      approved: "مفعّل",
      rejected: "مرفوض",
    };
    const planLabel: Record<string, string> = {
      basic: "أساسي",
      pro: "احترافي",
      premium: "مميز",
    };

    const escape = (v: string | number) => {
      const s = String(v ?? "");
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const lines = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.name,
          r.email,
          r.phone,
          r.storeName,
          r.storeSlug ? `/store/${r.storeSlug}` : "",
          statusLabel[r.storeStatus] ?? r.storeStatus,
          planLabel[r.plan] ?? (r.plan || "بدون اشتراك"),
          r.docsCount,
          r.registeredAt,
        ]
          .map(escape)
          .join(",")
      ),
    ];

    const bom = "﻿"; // UTF-8 BOM for Excel Arabic support
    const blob = new Blob([bom + lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `التجار_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={download}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors"
    >
      <Download className="w-4 h-4" />
      تنزيل Excel
    </button>
  );
}
