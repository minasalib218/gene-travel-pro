"use client";

declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      Url?: {
        Open?: (url: string) => void;
      };
    };
  }
}

let lemonLoaderPromise: Promise<void> | null = null;

export function loadLemonJs() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Lemon.js can only load in the browser."));
  }

  if (window.LemonSqueezy?.Url?.Open) {
    return Promise.resolve();
  }

  if (lemonLoaderPromise) {
    return lemonLoaderPromise;
  }

  lemonLoaderPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-lemonsqueezy="overlay"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        window.createLemonSqueezy?.();
        resolve();
      });
      existingScript.addEventListener("error", () => {
        reject(new Error("Failed to load Lemon.js."));
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://app.lemonsqueezy.com/js/lemon.js";
    script.async = true;
    script.defer = true;
    script.dataset.lemonsqueezy = "overlay";
    script.onload = () => {
      window.createLemonSqueezy?.();
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load Lemon.js."));

    document.body.appendChild(script);
  });

  return lemonLoaderPromise;
}

export async function openLemonOverlayCheckout(checkoutUrl: string) {
  await loadLemonJs();

  if (!window.LemonSqueezy?.Url?.Open) {
    throw new Error("Lemon checkout overlay is not available.");
  }

  window.LemonSqueezy.Url.Open(checkoutUrl);
}
