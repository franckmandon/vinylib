"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import VinylLibrary from "@/components/VinylLibrary";

export default function MyVinylsPage() {
  const { data: session } = useSession();
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="hover:opacity-80 transition-opacity">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Vinyl Report
                </h1>
              </Link>
              <p className="text-slate-600 dark:text-slate-400">
                My Vinyl Collection
              </p>
            </div>
            {session?.user ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  Browse All
                </Link>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {session.user.username}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg text-sm font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </header>
        <VinylLibrary mode="personal" />
      </div>
    </main>
  );
}

