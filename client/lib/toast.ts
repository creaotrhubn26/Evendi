import { Platform, ToastAndroid } from "react-native";

type ToastHandler = (message: string, durationMs?: number) => void;

let toastHandler: ToastHandler | null = null;

function showWebToastFallback(message: string, durationMs: number) {
  const doc = globalThis.document;
  if (!doc) return;

  const existing = doc.getElementById("evendi-toast-fallback");
  const el = existing ?? doc.createElement("div");
  el.id = "evendi-toast-fallback";
  el.textContent = message;
  el.style.position = "fixed";
  el.style.left = "50%";
  el.style.bottom = "24px";
  el.style.transform = "translateX(-50%)";
  el.style.padding = "10px 14px";
  el.style.background = "rgba(20, 20, 20, 0.9)";
  el.style.color = "#fff";
  el.style.borderRadius = "8px";
  el.style.fontSize = "14px";
  el.style.fontFamily = "sans-serif";
  el.style.zIndex = "9999";
  el.style.maxWidth = "80vw";
  el.style.textAlign = "center";
  if (!existing) {
    doc.body.appendChild(el);
  }

  const timeoutMs = durationMs || 2500;
  globalThis.clearTimeout((el as any)._toastTimeoutId);
  (el as any)._toastTimeoutId = globalThis.setTimeout(() => {
    try {
      el.remove();
    } catch {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }
  }, timeoutMs);
}

export function registerToastHandler(handler: ToastHandler | null) {
  toastHandler = handler;
}

export function showToast(message: string, durationMs?: number) {
  if (!message) return;

  if (toastHandler) {
    toastHandler(message, durationMs);
    return;
  }

  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }

  if (Platform.OS === "web") {
    showWebToastFallback(message, durationMs ?? 2500);
  }
}
