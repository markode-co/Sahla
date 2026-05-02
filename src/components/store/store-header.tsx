import { MapPin, Phone, Smartphone, Building2, Truck } from "lucide-react";
import type { Store, PaymentMethod } from "@/types";

interface StoreHeaderProps {
  store: Store;
  paymentMethod: PaymentMethod | null;
}

export function StoreHeader({ store, paymentMethod }: StoreHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-5">
          {store.logo_url ? (
            <img
              src={store.logo_url}
              alt={store.name}
              className="w-16 h-16 rounded-2xl object-cover shadow-sm"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-sm flex-shrink-0"
              style={{ backgroundColor: store.logo_color ?? "#0ea5e9" }}
            >
              {store.logo_initials ?? store.name.slice(0, 2)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">{store.name}</h1>
            {store.description && (
              <p className="text-gray-500 mt-1 text-sm line-clamp-2">{store.description}</p>
            )}

            {paymentMethod && (
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {paymentMethod.instapay_username && (
                  <div className="flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                    <Smartphone className="w-3.5 h-3.5" />
                    انستاباي
                  </div>
                )}
                {paymentMethod.bank_name && (
                  <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    <Building2 className="w-3.5 h-3.5" />
                    تحويل بنكي
                  </div>
                )}
                {paymentMethod.cash_on_delivery && (
                  <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                    <Truck className="w-3.5 h-3.5" />
                    الدفع عند الاستلام
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
