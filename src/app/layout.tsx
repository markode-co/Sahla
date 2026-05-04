import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ServiceWorkerRegister } from "@/components/ui/sw-register";
import { PWASetup } from "@/components/ui/pwa-setup";
import { DynamicManifest } from "@/components/ui/dynamic-manifest";

export const metadata: Metadata = {
  title: "سهلة - منصة التجارة الإلكترونية",
  description: "أنشئ متجرك الإلكتروني بسهولة وابدأ البيع في دقائق",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0ea5e9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body suppressHydrationWarning>
        <PWASetup />
        <DynamicManifest />
        {children}
        <ServiceWorkerRegister />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: "Cairo, sans-serif",
              borderRadius: "12px",
              padding: "12px 16px",
            },
          }}
        />
      </body>
    </html>
  );
}
