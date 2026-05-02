import Link from "next/link";

const STEPS = [
  { num: 1, label: "إعداد المتجر", path: "/onboarding/store-setup" },
  { num: 2, label: "طرق الدفع", path: "/onboarding/payment" },
  { num: 3, label: "المستندات", path: "/onboarding/documents" },
  { num: 4, label: "الاشتراك", path: "/onboarding/subscription" },
];

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/50 to-white" dir="rtl">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">س</span>
            </div>
            <span className="font-bold text-gray-900">سهلة</span>
          </Link>
          <span className="text-sm text-gray-500">إعداد حسابك</span>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((step, idx) => (
            <div key={step.num} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                  {step.num}
                </div>
                <span className="text-xs text-gray-500 hidden sm:block">{step.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className="w-8 h-px bg-gray-200" />
              )}
            </div>
          ))}
        </div>

        {children}
      </div>
    </div>
  );
}
