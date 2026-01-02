"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export default function Footer() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const hideCTASection = pathname === "/register" || pathname === "/login" || pathname === "/forgot-password" || session?.user;

  return (
    <footer className="bg-slate-200 dark:bg-slate-900 border-t border-slate-300 dark:border-slate-700 mt-auto">
      {/* CTA Section */}
      {!hideCTASection && (
        <div className="border-b border-slate-300 dark:border-slate-700" style={{ backgroundColor: 'rgb(30 80 200)' }}>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Your vinyl deserves better than a shelf.
            </h2>
            <p className="text-blue-50 mb-8 text-lg">
              Start for free today and join a community of vinyl lovers.
            </p>
            <Link
              href="/register"
              className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
            >
              Create a free account now
            </Link>
          </div>
        </div>
      </div>
      )}
      
      {/* Footer Links */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-slate-600 dark:text-slate-400">
          <p>© 2025 Vinyl Report, Mind the wax.</p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy-policy"
              className="transition-colors"
              style={{ color: 'rgb(37 99 235)' }}
            >
              Privacy Policy
            </Link>
            <span className="text-slate-400 dark:text-slate-600">|</span>
            <Link
              href="/terms-of-service"
              className="transition-colors"
              style={{ color: 'rgb(37 99 235)' }}
            >
              Terms of Service
            </Link>
            <span className="text-slate-400 dark:text-slate-600">|</span>
            <Link
              href="/cookie-policy"
              className="transition-colors"
              style={{ color: 'rgb(37 99 235)' }}
            >
              Cookie Policy
            </Link>
            <span className="text-slate-400 dark:text-slate-600">|</span>
            <Link
              href="/contact"
              className="transition-colors"
              style={{ color: 'rgb(37 99 235)' }}
            >
              Contact
            </Link>
            <span className="text-slate-400 dark:text-slate-600">|</span>
            <Link
              href="/faq"
              className="transition-colors"
              style={{ color: 'rgb(37 99 235)' }}
            >
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

