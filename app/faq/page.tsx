"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import UserMenu from "@/components/UserMenu";
import FAQAccordion, { faqs } from "@/components/FAQAccordion";

export default function FAQPage() {
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

          {/* Desktop: Browse All, UserMenu, Sign Out - top right (logged users) */}
          {session?.user && (
            <div className="hidden md:flex items-center justify-end gap-3 mb-4">
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

          {/* Desktop: Sign In/Create account above title for non-logged users */}
          {!session?.user && (
            <div className="hidden md:flex items-center justify-end gap-2 mb-4">
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
              Frequently Asked Questions
            </p>
          </div>
        </header>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 sm:p-8">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <FAQAccordion key={index} faq={faq} index={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

