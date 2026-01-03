"use client";

import ReCaptchaProvider from "./ReCaptchaProvider";

export default function ReCaptchaWrapper({ children }: { children: React.ReactNode }) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
  
  if (!siteKey) {
    console.warn("[reCAPTCHA] NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set. reCAPTCHA will not work.");
    return <>{children}</>;
  }

  return (
    <ReCaptchaProvider siteKey={siteKey}>
      {children}
    </ReCaptchaProvider>
  );
}

