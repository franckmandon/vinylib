"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

interface ReCaptchaProviderProps {
  children: React.ReactNode;
  siteKey: string;
}

export default function ReCaptchaProvider({ children, siteKey }: ReCaptchaProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  // Effect to continuously hide reCAPTCHA badge
  useEffect(() => {
    const hideBadge = () => {
      // Hide badge elements
      const badges = document.querySelectorAll('.grecaptcha-badge, .g-recaptcha-badge, .g-recaptcha-bubble-impl');
      badges.forEach((badge) => {
        (badge as HTMLElement).style.visibility = 'hidden';
        (badge as HTMLElement).style.opacity = '0';
        (badge as HTMLElement).style.display = 'none';
      });
      
      // Hide iframes containing recaptcha badge (small size, bottom-right)
      const iframes = document.querySelectorAll('iframe[src*="recaptcha"]');
      iframes.forEach((iframe) => {
        const rect = (iframe as HTMLElement).getBoundingClientRect();
        // Badge is typically small and positioned at bottom-right
        if (rect.width < 300 && rect.height < 100 && rect.bottom > window.innerHeight - 100) {
          (iframe as HTMLElement).style.visibility = 'hidden';
          (iframe as HTMLElement).style.opacity = '0';
          (iframe as HTMLElement).style.display = 'none';
        }
      });
    };

    // Hide immediately and set up observer
    hideBadge();
    const interval = setInterval(hideBadge, 500);

    // Also observe DOM changes
    const observer = new MutationObserver(hideBadge);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!siteKey) {
      console.warn("[reCAPTCHA] Site key is not provided. reCAPTCHA will not work.");
      return;
    }

    // Check if already loaded
    if (typeof window !== "undefined" && window.grecaptcha) {
      console.log("[reCAPTCHA] reCAPTCHA already loaded");
      setIsLoaded(true);
      return;
    }

    // Check if script is already in the DOM with the correct site key
    const existingScript = document.querySelector(`script[src*="recaptcha/api.js"]`) as HTMLScriptElement | null;
    if (existingScript) {
      const scriptSrc = existingScript.src;
      const expectedSrc = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      
      // Check if the existing script uses the same site key
      if (scriptSrc.includes(`render=${siteKey}`)) {
        console.log("[reCAPTCHA] Script already in DOM with correct site key, waiting for load...");
        // Wait for script to load if not already loaded
        if (window.grecaptcha) {
          setIsLoaded(true);
        } else {
          existingScript.addEventListener("load", () => {
            console.log("[reCAPTCHA] Script loaded from existing element");
            const checkInterval = setInterval(() => {
              if (window.grecaptcha) {
                console.log("[reCAPTCHA] grecaptcha object is ready (from existing script)");
                setIsLoaded(true);
                clearInterval(checkInterval);
              }
            }, 100);
            setTimeout(() => clearInterval(checkInterval), 5000);
          });
        }
        return;
      } else {
        // Script exists but with different key - remove it and reload
        console.warn("[reCAPTCHA] Existing script has different site key, removing and reloading...");
        existingScript.remove();
      }
    }

    // Load reCAPTCHA script
    console.log("[reCAPTCHA] Loading reCAPTCHA script with site key:", siteKey);
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log("[reCAPTCHA] Script loaded successfully");
      // Wait a bit for grecaptcha to be available
      const checkInterval = setInterval(() => {
        if (window.grecaptcha) {
          console.log("[reCAPTCHA] grecaptcha object is ready");
          setIsLoaded(true);
          clearInterval(checkInterval);
          
          // Hide reCAPTCHA badge after script loads
          const hideBadge = () => {
            const badges = document.querySelectorAll('.grecaptcha-badge, .g-recaptcha-badge, .g-recaptcha-bubble-impl');
            badges.forEach((badge) => {
              (badge as HTMLElement).style.visibility = 'hidden';
              (badge as HTMLElement).style.opacity = '0';
              (badge as HTMLElement).style.display = 'none';
            });
            
            // Also hide iframes containing recaptcha
            const iframes = document.querySelectorAll('iframe[src*="recaptcha"]');
            iframes.forEach((iframe) => {
              const rect = (iframe as HTMLElement).getBoundingClientRect();
              // Only hide if it's the badge (small size, bottom-right position)
              if (rect.width < 300 && rect.height < 100) {
                (iframe as HTMLElement).style.visibility = 'hidden';
                (iframe as HTMLElement).style.opacity = '0';
                (iframe as HTMLElement).style.display = 'none';
              }
            });
          };
          
          // Hide badge immediately and periodically check
          hideBadge();
          setInterval(hideBadge, 1000);
        }
      }, 100);

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.grecaptcha) {
          console.error("[reCAPTCHA] grecaptcha object not available after script load");
        }
      }, 5000);
    };

    script.onerror = () => {
      console.error("[reCAPTCHA] Failed to load reCAPTCHA script");
    };

    document.head.appendChild(script);
  }, [siteKey]);

  return <>{children}</>;
}

