"use client";

import { Clock, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useOnboardingCheck } from "@/hooks/use-onboarding-check";

export default function SubscriptionPendingPage() {
  useOnboardingCheck(); // Check onboarding state and redirect if needed

  return (
    <div className="max-w-lg mx-auto">
      <div className="card p-10 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <Clock className="w-8 h-8 text-yellow-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">في انتظار مراجعة الدفع</h1>
        <p className="text-gray-500 mb-6">
          تم استلام طلب اشتراكك وإيصال التحويل. سيقوم فريقنا بمراجعته وتفعيل حسابك خلال فترة قصيرة.
        </p>

        <div className="space-y-3 text-right bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">تم استلام إيصال التحويل</p>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">الإدارة تراجع إيصالك</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-400">يتم تفعيل الاشتراك وفتح لوحة التحكم</p>
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-6">
          للاستفسار، تواصل معنا عبر انستاباي على{" "}
          <span className="font-mono font-medium text-gray-600" dir="ltr">+201090886364</span>
        </p>

        <Link
          href="/onboarding/subscription"
          className="text-sm text-primary-600 hover:underline"
        >
          رفع إيصال مختلف؟
        </Link>
      </div>
    </div>
  );
}
