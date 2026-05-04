"use client";

import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, Clock, CheckCircle, AlertCircle, ShoppingBag, Truck } from "lucide-react";
import { AuthModal } from "@/components/store/auth-modal";

interface Props {
  params: {
    slug: string;
  };
}

interface Notification {
  id: string;
  type: 'order_update' | 'promotion' | 'system';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  order_id?: string;
}

function StoreNotificationsPage({ params }: Props) {
  const { slug } = params;
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
        // Load mock notifications for demo
        setNotifications([
          {
            id: '1',
            type: 'order_update',
            title: 'تم تأكيد طلبك',
            message: 'طلبك رقم #12345 تم تأكيده وسيتم شحنه قريباً',
            read: false,
            created_at: new Date().toISOString(),
            order_id: '12345'
          },
          {
            id: '2',
            type: 'promotion',
            title: 'عرض خاص',
            message: 'خصم 20% على جميع المنتجات الجديدة',
            read: true,
            created_at: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: '3',
            type: 'system',
            title: 'تحديث التطبيق',
            message: 'تم تحديث التطبيق بميزات جديدة',
            read: true,
            created_at: new Date(Date.now() - 172800000).toISOString()
          }
        ]);
      }
      setLoading(false);
    });
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_update':
        return <ShoppingBag className="w-5 h-5 text-blue-600" />;
      case 'promotion':
        return <AlertCircle className="w-5 h-5 text-green-600" />;
      case 'system':
        return <CheckCircle className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
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
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">يرجى تسجيل الدخول</h2>
            <p className="text-gray-500 mb-4">يجب تسجيل الدخول لعرض الإشعارات.</p>
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
          nextUrl={`/store/${slug}/notifications`}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">الإشعارات</h1>
            <p className="text-gray-500 mt-1">كل التنبيهات والتحديثات المهمة.</p>
          </div>
          <div className="text-sm text-gray-500">
            {notifications.filter(n => !n.read).length} غير مقروءة
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="card p-6 border-dashed border-2 border-gray-200 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">لا توجد إشعارات جديدة في الوقت الحالي.</p>
            <p className="text-sm text-gray-400 mt-3">
              ستظهر هنا تنبيهات الطلبات، العروض، والتحديثات فور وصولها.
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`card p-4 cursor-pointer transition-all ${
                !notification.read ? 'border-l-4 border-l-primary-500 bg-primary-50' : ''
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`font-semibold ${!notification.read ? 'text-primary-900' : 'text-gray-900'}`}>
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0"></div>
                    )}
                  </div>
                  <p className="text-gray-600 mt-1">{notification.message}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {new Date(notification.created_at).toLocaleDateString('ar-SA')}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function StoreNotificationsPageWrapper({ params }: Props) {
  return <StoreNotificationsPage params={params} />;
}
