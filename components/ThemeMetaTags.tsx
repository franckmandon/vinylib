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
    
    // Add apple-mobile-web-app-status-bar-style if not present
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

