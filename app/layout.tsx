import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import Footer from "@/components/Footer";
import BookmarkSync from "@/components/BookmarkSync";

export const metadata: Metadata = {
  title: "Vinyl Report - Vinyl Library Manager",
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
    capable: true,
    statusBarStyle: "default",
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
    <html lang="en">
      <body className="antialiased flex flex-col min-h-screen">
        <SessionProvider>
          <BookmarkSync />
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}


