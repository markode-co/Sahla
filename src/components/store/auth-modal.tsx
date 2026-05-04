"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Mail, Lock, User, Phone } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSlug: string;
  nextUrl?: string;
}

export function AuthModal({ isOpen, onClose, storeSlug, nextUrl }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);

  if (!isOpen) return null;

  const loginUrl = `/store/${storeSlug}/login${nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : ''}`;
  const registerUrl = `/store/${storeSlug}/register${nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : ''}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {isLogin ? "تسجيل الدخول" : "إنشاء حساب جديد"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="text-center mb-6">
              <p className="text-gray-600 text-sm">
                {isLogin
                  ? "سجل دخولك للمتابعة في طلباتك وإعداداتك"
                  : "أنشئ حساباً جديداً للاستمتاع بجميع الميزات"
                }
              </p>
            </div>

            <div className="space-y-3">
              {!isLogin && (
                <div className="relative">
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="الاسم الكامل"
                    className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  placeholder="البريد الإلكتروني"
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {!isLogin && (
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    placeholder="رقم الهاتف"
                    className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              )}

              <div className="relative">
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  placeholder="كلمة المرور"
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <Link
              href={isLogin ? loginUrl : registerUrl}
              onClick={onClose}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 px-4 rounded-xl font-medium transition flex items-center justify-center"
            >
              {isLogin ? "تسجيل الدخول" : "إنشاء الحساب"}
            </Link>

            <div className="text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                {isLogin
                  ? "ليس لديك حساب؟ أنشئ حساباً جديداً"
                  : "لديك حساب بالفعل؟ سجل دخولك"
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}