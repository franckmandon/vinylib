"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import UserMenu from "@/components/UserMenu";
import ThemeToggle from "@/components/ThemeToggle";

export default function PrivacyPolicyPage() {
  const { data: session } = useSession();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          {/* Mobile: Browse All, UserMenu, Sign Out - above title (logged users) */}
          {session?.user && (
            <div className="flex items-center justify-end gap-3 mb-4 md:hidden">
              <ThemeToggle />
              <Link
                href="/"
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                Browse All
              </Link>
              <UserMenu />
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
          {/* Mobile: Sign In/Create account above title for non-logged users */}
          {!session?.user && (
            <div className="flex items-center justify-end gap-2 mb-4 md:hidden">
              <ThemeToggle />
              <Link
                href="/login"
                className="px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: '#534AD3' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4338A8'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#534AD3'}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg text-sm font-bold transition-colors"
              >
                Create an account
              </Link>
            </div>
          )}

          {/* Desktop: Browse All, UserMenu, Sign Out - top right (logged users) */}
          {session?.user && (
            <div className="hidden md:flex items-center justify-end gap-3 mb-4">
              <ThemeToggle />
              <Link
                href="/"
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                Browse All
              </Link>
              <UserMenu />
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}

          {/* Desktop: Sign In/Create account above title for non-logged users */}
          {!session?.user && (
            <div className="hidden md:flex items-center justify-end gap-2 mb-4">
              <ThemeToggle />
              <Link
                href="/login"
                className="px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: '#534AD3' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4338A8'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#534AD3'}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg text-sm font-bold transition-colors"
              >
                Create an account
              </Link>
            </div>
          )}

          {/* Title section - centered */}
          <div className="text-center">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <h1 className="font-bold text-slate-900 dark:text-slate-100 mb-1" style={{ fontSize: '3rem' }}>
                Vinyl Report
              </h1>
            </Link>
            <p className="text-slate-600 dark:text-slate-400 text-[1.4rem]">
              Privacy Policy
            </p>
          </div>
        </header>

        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-8">
            Last updated: January 2025
          </p>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                1. Introduction
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                Vinyl Report (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our vinyl collection management platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                2. Information We Collect
              </h2>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3 mt-4">
                2.1 Personal Information
              </h3>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                When you create an account, we collect:
              </p>
              <ul className="list-disc pl-6 text-slate-700 dark:text-slate-300 mb-4">
                <li>Username</li>
                <li>Email address</li>
                <li>Password (encrypted)</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3 mt-4">
                2.2 Collection Data
              </h3>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                You may voluntarily provide information about your vinyl collection, including:
              </p>
              <ul className="list-disc pl-6 text-slate-700 dark:text-slate-300 mb-4">
                <li>Album titles, artists, and release information</li>
                <li>Personal notes and ratings</li>
                <li>Purchase prices and dates</li>
                <li>Album artwork and metadata</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                3. How We Use Your Information
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-slate-700 dark:text-slate-300 mb-4">
                <li>Provide and maintain our service</li>
                <li>Process your account registration and authentication</li>
                <li>Enable you to manage and share your vinyl collection</li>
                <li>Improve our platform and develop new features</li>
                <li>Send you service-related communications</li>
                <li>Respond to your inquiries and provide support</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                4. Data Sharing and Disclosure
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                We do not sell your personal information. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-slate-700 dark:text-slate-300 mb-4">
                <li><strong>Public Collection Data:</strong> Album information you add to your collection may be visible to other users as part of the public catalog</li>
                <li><strong>Service Providers:</strong> We may share data with third-party service providers who assist in operating our platform</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                5. Data Security
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                6. Your Rights
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-slate-700 dark:text-slate-300 mb-4">
                <li>Access and update your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Export your collection data</li>
                <li>Opt-out of certain communications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                7. Cookies and Tracking
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                We use cookies and similar technologies to enhance your experience. For more information, please see our <Link href="/cookie-policy" className="hover:underline" style={{ color: 'rgb(83 74 211)' }}>Cookie Policy</Link>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                8. Children&apos;s Privacy
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                Our service is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                9. Changes to This Policy
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                10. Contact Us
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                If you have questions about this Privacy Policy, please contact us through our platform or email.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

