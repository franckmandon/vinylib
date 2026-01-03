import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import Footer from "@/components/Footer";
import BookmarkSync from "@/components/BookmarkSync";
import ThemeMetaTags from "@/components/ThemeMetaTags";
import ReCaptchaWrapper from "@/components/ReCaptchaWrapper";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Vinyl Report - Your Vinyl Collection Manager",
  description: "Manage your vinyl collection with ease",
  applicationName: "Vinyl Report",
  icons: {
    icon: [
      { url: "/Icon_VinylReport_512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/Icon_VinylReport_512x512.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/Icon_VinylReport_512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    statusBarStyle: "black-translucent",
    title: "Vinyl Report",
  },
  openGraph: {
    title: "Vinyl Report",
    description: "Manage your vinyl collection with ease",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased flex flex-col min-h-screen">
        <ThemeProvider>
          <ThemeMetaTags />
          <ReCaptchaWrapper>
            <SessionProvider>
              <BookmarkSync />
              <div className="flex-1">
                {children}
              </div>
              <Footer />
            </SessionProvider>
          </ReCaptchaWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}


