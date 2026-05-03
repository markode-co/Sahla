import { Suspense } from "react";

import AuthCallbackClient from "./auth-callback-client";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center px-4" dir="rtl">
          <div className="card p-8 text-center">
            <h1 className="text-xl font-bold mb-2">جارٍ إتمام تسجيل الدخول...</h1>
            <p className="text-sm text-gray-500">انتظر لحظة بينما يتم تهيئة جلستك ثم سيتم تحويلك تلقائياً.</p>
          </div>
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
