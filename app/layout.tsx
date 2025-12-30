import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Vinylib - Vinyl Library Manager",
  description: "Manage your vinyl collection with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}


