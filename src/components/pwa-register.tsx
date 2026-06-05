import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (import.meta.env.DEV) return;

    void import("virtual:pwa-register").then(({ registerSW }) => {
      registerSW({ immediate: true });
    });
  }, []);

  return null;
}
