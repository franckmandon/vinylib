"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import UserMenu from "@/components/UserMenu";
import ThemeToggle from "@/components/ThemeToggle";

export default function CookiePolicyPage() {
  const { data: session } = useSession();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          {/* Mobile: Browse All, UserMenu, Sign Out - above title (logged users) */}
          {session?.user && (
            <div className="flex items-center justify-end gap-3 mb-4 md:hidden">
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
              Cookie Policy
            </p>
          </div>
        </header>

        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            Cookie Policy
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-8">
            Last updated: January 2025
          </p>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                1. What Are Cookies
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.
              </p>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                Vinyl Report uses cookies to enhance your experience, analyze site usage, and assist in our marketing efforts.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                2. Types of Cookies We Use
              </h2>
              
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3 mt-4">
                2.1 Essential Cookies
              </h3>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                These cookies are necessary for the website to function properly. They enable core functionality such as:
              </p>
              <ul className="list-disc pl-6 text-slate-700 dark:text-slate-300 mb-4">
                <li>User authentication and session management</li>
                <li>Security and fraud prevention</li>
                <li>Remembering your preferences and settings</li>
              </ul>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                These cookies cannot be disabled as they are essential for the Service to work.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3 mt-4">
                2.2 Functional Cookies
              </h3>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                These cookies allow the website to remember choices you make (such as your username, language, or region) and provide enhanced, personalized features:
              </p>
              <ul className="list-disc pl-6 text-slate-700 dark:text-slate-300 mb-4">
                <li>Remembering your login status</li>
                <li>Storing your display preferences (dark mode, etc.)</li>
                <li>Maintaining your session across page visits</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3 mt-4">
                2.3 Analytics Cookies
              </h3>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously:
              </p>
              <ul className="list-disc pl-6 text-slate-700 dark:text-slate-300 mb-4">
                <li>Page views and navigation patterns</li>
                <li>Time spent on pages</li>
                <li>Error messages and performance issues</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                3. Third-Party Cookies
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                In addition to our own cookies, we may also use various third-party cookies to report usage statistics and deliver content:
              </p>
              <ul className="list-disc pl-6 text-slate-700 dark:text-slate-300 mb-4">
                <li><strong>Authentication Services:</strong> Cookies used by NextAuth.js for secure authentication</li>
                <li><strong>Analytics:</strong> If we use analytics services, they may set cookies to track usage</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                4. Cookie Duration
              </h2>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3 mt-4">
                4.1 Session Cookies
              </h3>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                These cookies are temporary and are deleted when you close your browser. They are used to maintain your session while you navigate the website.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3 mt-4">
                4.2 Persistent Cookies
              </h3>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                These cookies remain on your device for a set period or until you delete them. They help us recognize you when you return to our website.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                5. Managing Cookies
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                You have the right to accept or reject cookies. Most web browsers automatically accept cookies, but you can usually modify your browser settings to decline cookies if you prefer.
              </p>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                However, please note that disabling cookies may impact your experience on our website. Some features may not function properly if cookies are disabled.
              </p>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3 mt-4">
                How to Manage Cookies in Your Browser:
              </h3>
              <ul className="list-disc pl-6 text-slate-700 dark:text-slate-300 mb-4">
                <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
                <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</li>
                <li><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                6. Local Storage
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                In addition to cookies, we may use browser local storage to store information such as:
              </p>
              <ul className="list-disc pl-6 text-slate-700 dark:text-slate-300 mb-4">
                <li>User preferences and settings</li>
                <li>Temporary data for offline functionality</li>
                <li>Pending bookmarks or actions (for non-logged-in users)</li>
              </ul>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                You can clear local storage through your browser settings, similar to clearing cookies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                7. Changes to This Cookie Policy
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new policy on this page.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                8. Contact Us
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                If you have any questions about our use of cookies or this Cookie Policy, please contact us through our platform.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

