"use client";

import { Suspense, useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import VinylLibrary from "@/components/VinylLibrary";
import UserMenu from "@/components/UserMenu";

function HomeContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [ownerFilter, setOwnerFilter] = useState<string | null>(null);

  useEffect(() => {
    const owner = searchParams.get("owner");
    setOwnerFilter(owner);
  }, [searchParams]);

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
                {ownerFilter ? `Vinyls from ${ownerFilter}` : "Latest Vinyls from All Collectors"}
              </p>
            </div>
            {session?.user ? (
              <div className="flex items-center gap-4">
                <UserMenu />
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-1 sm:gap-2">
                <Link
                  href="/login"
                  className="px-2 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-2 py-1.5 sm:px-4 sm:py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </header>
        <VinylLibrary mode="public" />
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-slate-600 dark:text-slate-400">Loading...</div>
        </div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}


