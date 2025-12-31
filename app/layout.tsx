import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Vinyl Report - Vinyl Library Manager",
  description: "Manage your vinyl collection with ease",
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
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}


