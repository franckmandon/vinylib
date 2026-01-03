"use client";

import { useCallback } from "react";

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export function useReCaptcha(siteKey: string) {
  const executeRecaptcha = useCallback(
    async (action: string): Promise<string | null> => {
      if (typeof window === "undefined") {
        console.error("[reCAPTCHA] Window is not available");
        return null;
      }

      if (!siteKey) {
        console.warn("[reCAPTCHA] Site key is not provided");
        return null;
      }

      // Wait for grecaptcha to be available (with timeout)
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait
      
      while (!window.grecaptcha && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!window.grecaptcha) {
        console.error("[reCAPTCHA] reCAPTCHA not loaded after waiting");
        return null;
      }

      try {
        console.log(`[reCAPTCHA] Executing reCAPTCHA for action: ${action} with site key: ${siteKey.substring(0, 10)}...`);
        
        // Verify the site key matches the one used to load the script
        const scripts = document.querySelectorAll('script[src*="recaptcha/api.js"]');
        if (scripts.length > 0) {
          const scriptSrc = (scripts[0] as HTMLScriptElement).src;
          if (!scriptSrc.includes(`render=${siteKey}`)) {
            console.error(`[reCAPTCHA] Site key mismatch! Script loaded with different key. Expected: ${siteKey.substring(0, 10)}...`);
            console.error(`[reCAPTCHA] Script URL: ${scriptSrc}`);
          }
        }
        
        return new Promise((resolve, reject) => {
          window.grecaptcha.ready(() => {
            console.log(`[reCAPTCHA] grecaptcha.ready() called for action: ${action}`);
            window.grecaptcha
              .execute(siteKey, { action })
              .then((token) => {
                console.log(`[reCAPTCHA] Token obtained successfully for action: ${action}`);
                resolve(token);
              })
              .catch((error) => {
                console.error(`[reCAPTCHA] Error executing reCAPTCHA for action ${action}:`, error);
                console.error(`[reCAPTCHA] Site key used: ${siteKey}`);
                console.error(`[reCAPTCHA] Make sure the site key is valid and the domain (localhost) is added in Google reCAPTCHA admin`);
                reject(error);
              });
          });
        });
      } catch (error) {
        console.error("[reCAPTCHA] Error in executeRecaptcha:", error);
        return null;
      }
    },
    [siteKey]
  );

  return { executeRecaptcha };
}

