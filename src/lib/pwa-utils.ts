export function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/i.test(navigator.userAgent);
}

export function isMobile(): boolean {
  return isAndroid() || isIOS();
}

/**
 * Trigger PWA install prompt based on platform
 * @param appTitle - Title of the application
 * @param role - User role: 'customer' or 'merchant/admin'
 */
export async function triggerAppInstall(appTitle: string, role: "customer" | "merchant" = "customer") {
  const isAndroidDevice = isAndroid();
  const isIOSDevice = isIOS();

  // For Android devices
  if (isAndroidDevice) {
    try {
      // Try to use the Web App Install Prompt (if available)
      const deferredPrompt = (window as any).deferredPrompt;
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        (window as any).deferredPrompt = null;
        return;
      }
    } catch (error) {
      console.warn("Install prompt error:", error);
    }

    // Fallback to Chrome intent on Android
    const manifestPath = role === "customer" ? "/manifest-customer.json" : "/manifest-merchant.json";
    const url = new URL(window.location.href);
    const title = appTitle || "سهلة";

    try {
      window.location.href = `intent://addshortcut?url=${encodeURIComponent(url.toString())}&title=${encodeURIComponent(title)}&manifest=${encodeURIComponent(manifestPath)}#Intent;scheme=https;package=com.android.chrome;end;`;
    } catch {
      showInstallInstructions("android");
    }
  }
  // For iOS devices
  else if (isIOSDevice) {
    showInstallInstructions("ios");
  }
  // For desktop
  else {
    showInstallInstructions("desktop");
  }
}

function showInstallInstructions(platform: "android" | "ios" | "desktop") {
  if (platform === "android") {
    alert(
      "لتنزيل التطبيق على Android:\n\n" +
      "1. اضغط على القائمة (ثلاث نقاط) في المتصفح\n" +
      "2. اختر 'إضافة إلى الشاشة الرئيسية'\n" +
      "3. اختر الاسم وانقر 'إضافة'"
    );
  } else if (platform === "ios") {
    alert(
      "لتنزيل التطبيق على iOS:\n\n" +
      "1. اضغط على زر المشاركة (مربع بسهم)\n" +
      "2. مرر لليسار واختر 'إضافة إلى الشاشة الرئيسية'\n" +
      "3. اختر الاسم وانقر 'إضافة'"
    );
  } else {
    alert(
      "لتنزيل التطبيق:\n\n" +
      "استخدم جهاز Android أو iOS لتنزيل التطبيق بسهولة،\n" +
      "أو جرّب خاصية 'إضافة إلى الشاشة الرئيسية' في متصفحك."
    );
  }
}

/**
 * Listen for the beforeinstallprompt event on Android
 */
export function setupPWAPromptListener() {
  if (typeof window === "undefined") return;

  (window as any).addEventListener("beforeinstallprompt", (e: any) => {
    e.preventDefault();
    (window as any).deferredPrompt = e;
  });

  (window as any).addEventListener("appinstalled", () => {
    console.log("PWA app installed successfully");
  });
}
