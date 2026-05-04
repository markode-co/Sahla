export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export function generateLogoInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const LOGO_COLORS = [
  "#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#06b6d4", "#84cc16",
];

export function generateLogoColor(): string {
  return LOGO_COLORS[Math.floor(Math.random() * LOGO_COLORS.length)];
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function formatCurrency(amount: number, currency = "EGP"): string {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function stripMissingPostgrestColumns<T extends Record<string, unknown>>(payload: T, error: unknown): T {
  const message = typeof error === "object" && error && "message" in error ? (error as any).message : undefined;
  if (typeof message !== "string") return payload;

  const matches = Array.from(message.matchAll(/Could not find the '([^']+)' column/g));
  if (matches.length === 0) return payload;

  let nextPayload = { ...payload };
  for (const match of matches) {
    const missingColumn = match[1];
    if (missingColumn in nextPayload) {
      const { [missingColumn]: _, ...rest } = nextPayload;
      nextPayload = rest as T;
    }
  }

  return nextPayload;
}

export function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "تحت المعالجة",
    approved: "تم الاستلام",
    received: "تم الاستلام",
    preparing: "قيد التجهيز",
    on_the_way: "في الطريق",
    rejected: "مرفوض",
    cancelled: "ملغي",
    delivered: "تم التسليم",
  };
  return labels[status] ?? status;
}

export function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-emerald-100 text-emerald-800",
    received: "bg-emerald-100 text-emerald-800",
    preparing: "bg-sky-100 text-sky-800",
    on_the_way: "bg-blue-100 text-blue-800",
    rejected: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
    delivered: "bg-green-100 text-green-800",
  };
  return colors[status] ?? "bg-gray-100 text-gray-800";
}

export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    instapay: "انستاباي",
    bank_transfer: "تحويل بنكي",
    cash_on_delivery: "الدفع عند الاستلام",
  };
  return labels[method] ?? method;
}

export function getPlanLabel(plan: string): string {
  const labels: Record<string, string> = {
    basic: "أساسي",
    pro: "احترافي",
    premium: "مميز",
  };
  return labels[plan] ?? plan;
}
