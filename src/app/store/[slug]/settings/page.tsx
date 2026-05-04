"use client";

import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, Shield, Moon, Sun, Save, Settings as SettingsIcon } from "lucide-react";
import toast from "react-hot-toast";
import { AuthModal } from "@/components/store/auth-modal";

interface Props {
  params: {
    slug: string;
  };
}

function StoreSettingsPage({ params }: Props) {
  const { slug } = params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [settings, setSettings] = useState({
    notifications: {
      orderUpdates: true,
      promotions: false,
      newProducts: true,
    },
    privacy: {
      profileVisible: true,
      orderHistoryVisible: false,
    },
    appearance: {
      darkMode: false,
    },
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
        // Load user settings from localStorage or user metadata
        const savedSettings = localStorage.getItem('store_settings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      }
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      // Save to localStorage for now (could be extended to save to database)
      localStorage.setItem('store_settings', JSON.stringify(settings));
      toast.success("تم حفظ الإعدادات بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء حفظ الإعدادات");
    }
    setSaving(false);
  }

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
            <SettingsIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">يرجى تسجيل الدخول</h2>
            <p className="text-gray-500 mb-4">يجب تسجيل الدخول للوصول إلى الإعدادات.</p>
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
          nextUrl={`/store/${slug}/settings`}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">الإعدادات</h1>
            <p className="text-gray-500 mt-1">تخصيص تجربتك في المتجر وإدارة تفضيلاتك.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            حفظ التغييرات
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            الإشعارات
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">تحديثات الطلبات</label>
                <p className="text-xs text-gray-500">إشعارات عند تغيير حالة الطلب</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.notifications.orderUpdates}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, orderUpdates: e.target.checked }
                  })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">العروض والخصومات</label>
                <p className="text-xs text-gray-500">إشعارات العروض الجديدة</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.notifications.promotions}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, promotions: e.target.checked }
                  })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">المنتجات الجديدة</label>
                <p className="text-xs text-gray-500">إشعارات المنتجات المضافة حديثاً</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.notifications.newProducts}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, newProducts: e.target.checked }
                  })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            الخصوصية والأمان
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">الصفحة الشخصية مرئية</label>
                <p className="text-xs text-gray-500">إظهار معلوماتك للتجار</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.privacy.profileVisible}
                  onChange={(e) => setSettings({
                    ...settings,
                    privacy: { ...settings.privacy, profileVisible: e.target.checked }
                  })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">تاريخ الطلبات مرئي</label>
                <p className="text-xs text-gray-500">إظهار تاريخ طلباتك للتجار</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.privacy.orderHistoryVisible}
                  onChange={(e) => setSettings({
                    ...settings,
                    privacy: { ...settings.privacy, orderHistoryVisible: e.target.checked }
                  })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          {settings.appearance.darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          المظهر
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-900">الوضع المظلم</label>
            <p className="text-xs text-gray-500">تفعيل الوضع المظلم للتطبيق</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.appearance.darkMode}
              onChange={(e) => setSettings({
                ...settings,
                appearance: { ...settings.appearance, darkMode: e.target.checked }
              })}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </div>

      <div className="card p-6 border-l-4 border-blue-500 bg-blue-50">
        <p className="text-sm text-blue-800">
          <strong>نصيحة:</strong> يمكنك تغيير هذه الإعدادات في أي وقت. التغييرات تُحفظ محلياً في متصفحك.
        </p>
      </div>
    </div>
  );
}

export default function SettingsPage({ params }: Props) {
  return <StoreSettingsPage params={params} />;
}
