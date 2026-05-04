import { ShoppingBag, Zap, Shield, BarChart3, ArrowLeft, Check, LayoutDashboard, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const features = [
  {
    icon: ShoppingBag,
    title: "متجرك في دقائق",
    desc: "أنشئ متجرك الإلكتروني الاحترافي في خطوات بسيطة بدون أي خبرة تقنية",
  },
  {
    icon: Zap,
    title: "إدارة سهلة",
    desc: "أضف منتجاتك وتابع طلباتك ومدفوعاتك من لوحة تحكم واحدة بسيطة",
  },
  {
    icon: Shield,
    title: "آمن وموثوق",
    desc: "بياناتك ومدفوعاتك محمية بأعلى معايير الأمان",
  },
  {
    icon: BarChart3,
    title: "تقارير وتحليلات",
    desc: "تابع أداء متجرك وفهم عملاءك من خلال تقارير تفصيلية شاملة",
  },
];

const plans = [
  {
    name: "أساسي",
    nameEn: "basic",
    price: 99,
    features: ["حتى 20 منتج", "صفحة متجر احترافية", "إدارة الطلبات", "دعم فني"],
  },
  {
    name: "احترافي",
    nameEn: "pro",
    price: 199,
    popular: true,
    features: ["منتجات غير محدودة", "صفحة متجر احترافية", "إدارة الطلبات", "دعم فني أولوية"],
  },
  {
    name: "مميز",
    nameEn: "premium",
    price: 399,
    features: ["منتجات غير محدودة", "تحليلات متقدمة", "تخصيص المتجر", "دعم فني مخصص"],
  },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let dashboardHref = "/dashboard/merchant";
  let isLoggedIn = false;

  if (user) {
    isLoggedIn = true;
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    dashboardHref = profile?.role === "admin" ? "/dashboard/admin" : "/dashboard/merchant";
  }

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">س</span>
            </div>
            <span className="text-xl font-bold text-gray-900">سهلة</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 justify-end">
            {isLoggedIn ? (
              <>
                <a
                  href={dashboardHref}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  لوحة التحكم
                </a>
                <form action="/api/auth/logout" method="post">
                  <button
                    type="submit"
                    className="text-red-600 hover:text-red-700 font-medium transition-colors text-sm flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    تسجيل الخروج
                  </button>
                </form>
              </>
            ) : (
              <>
                <a
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  تسجيل الدخول
                </a>
                <a href="/register" className="btn-primary text-sm">
                  ابدأ مجاناً
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary-50/50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            منصة التجارة الإلكترونية الأسهل في مصر
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            أنشئ متجرك الإلكتروني
            <span className="text-primary-600"> بسهولة </span>
            وابدأ البيع
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
            منصة سهلة تتيح للتجار إنشاء متاجر إلكترونية احترافية في دقائق، مع إدارة كاملة للمنتجات والطلبات والمدفوعات
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isLoggedIn ? (
              <>
                <a
                  href={dashboardHref}
                  className="btn-primary flex items-center justify-center gap-2 text-base px-8 py-3"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  اذهب إلى لوحة التحكم
                </a>
                <form action="/api/auth/logout" method="post">
                  <button
                    type="submit"
                    className="btn-secondary flex items-center justify-center gap-2 text-base px-8 py-3"
                  >
                    <LogOut className="w-5 h-5" />
                    تسجيل الخروج
                  </button>
                </form>
              </>
            ) : (
              <>
                <a
                  href="/register"
                  className="btn-primary flex items-center justify-center gap-2 text-base px-8 py-3"
                >
                  ابدأ مجاناً الآن
                  <ArrowLeft className="w-5 h-5" />
                </a>
                <a
                  href="/login"
                  className="btn-secondary flex items-center justify-center gap-2 text-base px-8 py-3"
                >
                  تسجيل الدخول
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">كل ما تحتاجه لتنجح</h2>
            <p className="text-gray-500 text-lg">أدوات قوية وسهلة الاستخدام لإدارة متجرك</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f) => (
              <div key={f.title} className="card p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">خطط الاشتراك</h2>
            <p className="text-gray-500 text-lg">اختر الخطة المناسبة لحجم أعمالك</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.nameEn}
                className={`card p-8 relative ${plan.popular ? "border-2 border-primary-500 shadow-lg" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    الأكثر شيوعاً
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 mr-1">جنيه / شهر</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={isLoggedIn ? dashboardHref : "/register"}
                  className={`block text-center py-2.5 px-5 rounded-xl font-semibold transition-all ${
                    plan.popular
                      ? "bg-primary-600 text-white hover:bg-primary-700"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  {isLoggedIn ? "لوحة التحكم" : "ابدأ الآن"}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t border-gray-100 text-center text-gray-400 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 bg-primary-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xs">س</span>
          </div>
          <span className="font-semibold text-gray-700">سهلة</span>
        </div>
        <p>© {new Date().getFullYear()} سهلة. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
}
