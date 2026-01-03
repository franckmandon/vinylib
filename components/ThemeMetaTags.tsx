"use client";

import { useEffect } from "react";

export default function ThemeMetaTags() {
  useEffect(() => {
    // Add theme-color meta tags for light and dark mode
    const lightThemeColor = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: light)"]');
    const darkThemeColor = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]');
    
    if (!lightThemeColor) {
      const lightMeta = document.createElement("meta");
      lightMeta.name = "theme-color";
      lightMeta.content = "#f8fafc";
      lightMeta.setAttribute("media", "(prefers-color-scheme: light)");
      document.head.appendChild(lightMeta);
    }
    
    if (!darkThemeColor) {
      const darkMeta = document.createElement("meta");
      darkMeta.name = "theme-color";
      darkMeta.content = "#0f172a";
      darkMeta.setAttribute("media", "(prefers-color-scheme: dark)");
      document.head.appendChild(darkMeta);
    }
    
    // Add mobile-web-app-capable (replaces deprecated apple-mobile-web-app-capable)
    const mobileWebApp = document.querySelector('meta[name="mobile-web-app-capable"]');
    if (!mobileWebApp) {
      const mobileMeta = document.createElement("meta");
      mobileMeta.name = "mobile-web-app-capable";
      mobileMeta.content = "yes";
      document.head.appendChild(mobileMeta);
    }
    
    // Add apple-mobile-web-app-status-bar-style if not present (for iOS compatibility)
    const appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!appleStatusBar) {
      const appleMeta = document.createElement("meta");
      appleMeta.name = "apple-mobile-web-app-status-bar-style";
      appleMeta.content = "black-translucent";
      document.head.appendChild(appleMeta);
    }
  }, []);

  return null;
}

