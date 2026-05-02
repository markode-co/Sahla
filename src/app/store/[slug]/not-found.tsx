import Link from "next/link";
import { Store } from "lucide-react";

export default function StoreNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Store className="w-10 h-10 text-gray-300" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">المتجر غير موجود</h1>
        <p className="text-gray-500 mb-6">
          هذا المتجر غير موجود أو لم يتم تفعيله بعد
        </p>
        <Link href="/" className="btn-primary inline-block">
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
