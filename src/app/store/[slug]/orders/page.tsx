"use client";

import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import OrderTrackingForm from "../track/order-tracking-form";
import { ShoppingBag, Clock, CheckCircle, Truck, XCircle, Eye } from "lucide-react";
import { AuthModal } from "@/components/store/auth-modal";

interface Props {
  params: {
    slug: string;
  };
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  order_items: any[];
}

function StoreOrdersPage({ params }: Props) {
  const { slug } = params;
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showTracking, setShowTracking] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUser(data.user);
        // Load mock orders for demo
        setOrders([
          {
            id: 'ORD-001',
            status: 'received',
            total_amount: 150.0,
            created_at: new Date().toISOString(),
            customer_name: data.user.user_metadata?.full_name || 'العميل',
            customer_phone: data.user.user_metadata?.phone || '01XXXXXXXXX',
            order_items: [
              { product_name: 'منتج تجريبي 1', quantity: 2, product_price: 50 },
              { product_name: 'منتج تجريبي 2', quantity: 1, product_price: 50 }
            ]
          },
          {
            id: 'ORD-002',
            status: 'on_the_way',
            total_amount: 75.0,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            customer_name: data.user.user_metadata?.full_name || 'العميل',
            customer_phone: data.user.user_metadata?.phone || '01XXXXXXXXX',
            order_items: [
              { product_name: 'منتج تجريبي 3', quantity: 1, product_price: 75 }
            ]
          }
        ]);
      } else {
        // Show auth modal if not logged in
        setShowAuthModal(true);
      }
      setLoading(false);
    });
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'received':
      case 'preparing':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'on_the_way':
        return <Truck className="w-5 h-5 text-blue-600" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'تحت المعالجة';
      case 'received':
        return 'تم الاستلام';
      case 'preparing':
        return 'قيد التجهيز';
      case 'on_the_way':
        return 'في الطريق';
      case 'delivered':
        return 'تم التسليم';
      case 'cancelled':
        return 'ملغي';
      default:
        return 'قيد المعالجة';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="space-y-6">
          <div className="card p-6 text-center">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">يرجى تسجيل الدخول</h2>
            <p className="text-gray-500 mb-4">يجب تسجيل الدخول لعرض طلباتك.</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="btn-primary inline-block"
            >
              تسجيل الدخول
            </button>
          </div>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          storeSlug={slug}
          nextUrl={`/store/${slug}/orders`}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="card p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">الطلبات</h1>
              <p className="text-gray-500 mt-1">تابع طلباتك وحالة التسليم.</p>
            </div>
            <button
              onClick={() => setShowTracking(!showTracking)}
              className="btn-secondary"
            >
              <Eye className="w-4 h-4 mr-2" />
              تتبع طلب
            </button>
          </div>
        </div>

        {showTracking && (
          <div className="card p-6">
            <OrderTrackingForm storeSlug={slug} />
          </div>
        )}

        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="card p-6 border-dashed border-2 border-gray-200 text-center">
              <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">لا توجد طلبات سابقة.</p>
              <p className="text-sm text-gray-400 mt-3">
                ستظهر هنا جميع طلباتك بعد إتمام عملية الشراء.
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(order.status)}
                    <div>
                      <h3 className="font-semibold text-gray-900">طلب #{order.id}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">
                      {order.total_amount.toFixed(2)} ريال
                    </p>
                    <p className="text-sm text-gray-500">{getStatusLabel(order.status)}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">تفاصيل المنتجات</h4>
                  <div className="space-y-2">
                    {order.order_items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.product_name} × {item.quantity}</span>
                        <span className="font-medium">{(item.product_price * item.quantity).toFixed(2)} ريال</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default function StoreOrdersPageWrapper({ params }: Props) {
  return <StoreOrdersPage params={params} />;
}
