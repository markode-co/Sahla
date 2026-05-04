"use client";

import { useEffect } from "react";
import { setupPWAPromptListener } from "@/lib/pwa-utils";

export function PWASetup() {
  useEffect(() => {
    setupPWAPromptListener();
  }, []);

  return null;
}
