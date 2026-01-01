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
        <header className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="hover:opacity-80 transition-opacity">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Vinyl Report
                </h1>
              </Link>
              <p className="text-slate-600 dark:text-slate-400 text-[1.4rem]">
                {ownerFilter ? `Vinyls from ${ownerFilter}` : "Mind the wax"}
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
                  Create an account
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Features Section */}
        {!session?.user && (
          <section className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="mb-4">
                  <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  Vinyl collection management
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Add custom description, personnal ratings and comments for each album.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="mb-4">
                  <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  Fast & smart collectible creation
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Simply scan the barcode of your vinyl and automatically retrieve all the album information.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="mb-4">
                  <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  Social sharing & discovery
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Share your collection with your friends and discover their favorite albums.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="mb-4">
                  <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  Detailed analytics dashboard
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Track your stats and the evolution of your vinyl collection over time.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Latest Vinyls Section */}
        {!session?.user ? (
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 text-center mb-2">
              Latest vinyl records added
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-center mb-6">
              Discover what the community is adding to their collections
            </p>
            <VinylLibrary mode="public" hideSearch={true} limit={8} />
          </section>
        ) : (
          <VinylLibrary mode="public" />
        )}

        {/* CTA Section */}
        {!session?.user && (
          <section className="mb-16 text-center bg-white dark:bg-slate-800 rounded-lg p-12 shadow-md">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Your vinyl deserves better than a shelf.
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg">
              Start for free today and join a community of vinyl lovers.
            </p>
            <Link
              href="/register"
              className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
            >
              Create a free account now
            </Link>
          </section>
        )}
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


