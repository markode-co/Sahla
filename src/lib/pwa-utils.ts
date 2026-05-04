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

  // For Android and Desktop - use the install prompt
  if (isAndroidDevice || (!isAndroidDevice && !isIOSDevice)) {
    try {
      // Check if the install prompt is available
      const deferredPrompt = (window as any).deferredPrompt;
      if (deferredPrompt) {
        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const choiceResult = await deferredPrompt.userChoice;

        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
          localStorage.setItem("appInstalled", "true");
          // Dispatch custom event to notify components
          window.dispatchEvent(new CustomEvent('appinstalled'));
        } else {
          console.log('User dismissed the install prompt');
        }

        // Clear the deferred prompt
        (window as any).deferredPrompt = null;
        return;
      }
    } catch (error) {
      console.warn("Install prompt error:", error);
    }

    // Fallback: Show instructions for manual installation
    showInstallInstructions(isAndroidDevice ? "android" : "desktop", role);
  }
  // For iOS devices - show instructions for "Add to Home Screen"
  else if (isIOSDevice) {
    showInstallInstructions("ios", role);
  }
}

function showInstallInstructions(platform: "android" | "ios" | "desktop", role: "customer" | "merchant" = "customer") {
  const appName = role === "merchant" ? "سهلة - لوحة التحكم" : "سهلة - متجر إلكتروني";

  if (platform === "android") {
    alert(
      `لإضافة ${appName} إلى شاشتك الرئيسية على Android:\n\n` +
      "1. اضغط على النقاط الثلاث (...) في أعلى المتصفح\n" +
      "2. اختر 'إضافة إلى الشاشة الرئيسية'\n" +
      "3. اختر الاسم واضغط 'إضافة'\n\n" +
      "سيتم إضافة أيقونة التطبيق إلى شاشتك الرئيسية!"
    );
  } else if (platform === "ios") {
    const instructions = role === "merchant"
      ? "لإضافة لوحة تحكم سهلة إلى شاشتك الرئيسية على iOS:\n\n" +
        "1. اضغط على أيقونة المشاركة (مربع بسهم) في أسفل المتصفح\n" +
        "2. مرر للأسفل واختر 'إضافة إلى الشاشة الرئيسية'\n" +
        "3. اختر الاسم 'سهلة' واضغط 'إضافة'\n\n" +
        "سيتم إضافة أيقونة لوحة التحكم إلى شاشتك الرئيسية!"
      : "لإضافة متجر سهلة إلى شاشتك الرئيسية على iOS:\n\n" +
        "1. اضغط على أيقونة المشاركة (مربع بسهم) في أسفل المتصفح\n" +
        "2. مرر للأسفل واختر 'إضافة إلى الشاشة الرئيسية'\n" +
        "3. اختر الاسم 'سهلة' واضغط 'إضافة'\n\n" +
        "سيتم إضافة أيقونة المتجر إلى شاشتك الرئيسية!";

    alert(instructions);
  } else {
    alert(
      `لإضافة ${appName} إلى سطح المكتب:\n\n` +
      "في متصفح Chrome أو Edge:\n" +
      "1. اضغط على النقاط الثلاث (...) في أعلى المتصفح\n" +
      "2. اختر 'تثبيت سهلة' أو 'Install'\n\n" +
      "أو يمكنك استخدام 'إضافة إلى الشاشة الرئيسية' في المتصفحات الأخرى."
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
    // Store installation status
    localStorage.setItem("appInstalled", "true");
  });
}

/**
 * Check if the app is installed as PWA
 */
export function isAppInstalled(): boolean {
  if (typeof window === "undefined") return false;

  // Check if running in standalone mode (iOS)
  if ((window.navigator as any).standalone === true) {
    return true;
  }

  // Check if running in standalone mode (Android)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  // Check localStorage flag
  return localStorage.getItem("appInstalled") === "true";
}
