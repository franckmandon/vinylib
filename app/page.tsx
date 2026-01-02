"use client";

import { Suspense, useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import VinylLibrary from "@/components/VinylLibrary";
import UserMenu from "@/components/UserMenu";
import FAQAccordion, { faqs } from "@/components/FAQAccordion";

function HomeContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [ownerFilter, setOwnerFilter] = useState<string | null>(null);
  const isHomePage = pathname === "/";

  useEffect(() => {
    const owner = searchParams.get("owner");
    const ownerId = searchParams.get("ownerId");
    const vinylId = searchParams.get("vinylId");
    
    // If there's a shared vinyl link (vinylId) and user is not logged in
    if (vinylId && status === "unauthenticated") {
      // Redirect to login with the vinylId parameter to preserve it
      const loginUrl = `/login?vinylId=${encodeURIComponent(vinylId)}`;
      router.push(loginUrl);
      return;
    }
    
    // If there's a shared collection link (owner params) and user is not logged in
    if (owner && ownerId && status === "unauthenticated") {
      // Redirect to login with the share parameters to preserve them
      const loginUrl = `/login?owner=${encodeURIComponent(owner)}&ownerId=${encodeURIComponent(ownerId)}`;
      router.push(loginUrl);
      return;
    }
    
    setOwnerFilter(owner);
  }, [searchParams, status, router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12">
          {/* Mobile: UserMenu, Sign Out - above title (logged users) */}
          {session?.user && (
            <div className="flex items-center justify-end gap-3 mb-4 md:hidden">
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg text-sm font-medium transition-colors"
              >
                Create an account
              </Link>
            </div>
          )}
          {/* Title section */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <Link href="/" className="hover:opacity-80 transition-opacity">
                <h1 className="font-bold text-slate-900 dark:text-slate-100 mb-1" style={{ fontSize: '3rem' }}>
                  Vinyl Report
                </h1>
              </Link>
              <p className="text-slate-600 dark:text-slate-400 text-[1.4rem]">
                {ownerFilter ? `Vinyls from ${ownerFilter}` : "Mind the wax"}
              </p>
            </div>
            {/* Desktop: UserMenu, Sign Out on the right, aligned top (logged users) */}
            {session?.user && (
              <div className="hidden md:flex items-center gap-3">
                <UserMenu />
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
            {/* Desktop: Sign In/Create account on the right for non-logged users */}
            {!session?.user && (
              <div className="hidden md:flex gap-2">
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
                  Create an account
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Features Section */}
        {!session?.user && (
          <section className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-6">
              <div className="flex flex-col justify-center lg:pr-8">
                <p className="font-bold text-slate-900 dark:text-slate-100 mb-4 text-[1.875rem] leading-tight">
                  Every record tells a story.<br />
                  The day you found it, the first time it moved you, the memories pressed into its grooves.
                </p>
                <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                  Vinyl Report helps you honor that connection by turning your collection into a living archive where every album has a voice, every artist has a history, and every shelf holds rediscovery. One scan at a time, build the collection you&apos;ve always imagined, organized, celebrated, and ready to surprise you all over again.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
                <div className="mb-3">
                  <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2" style={{ lineHeight: '1.5rem' }}>
                  Fast & smart collection building
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Simply scan the barcode of your vinyl and watch as Vinyl Report instantly retrieves comprehensive album information from Discogs and Wikipedia. Whether you&apos;re at home or browsing in a record store, add records directly to your collection or bookmark them for later. No manual typing, no guesswork, just intelligent data retrieval that builds your digital archive one scan at a time.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
                <div className="mb-3">
                  <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2" style={{ lineHeight: '1.5rem' }}>
                  Social sharing & discovery
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Share your collection with friends through AirDrop, email, or messaging to spark conversations about your favorite albums. Export your library as a CSV file for backups or analysis. Use the Shuffle Playlist feature to rediscover forgotten gems, letting Vinyl Report randomly select albums you haven&apos;t spun in a while.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
                <div className="mb-3">
                  <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2" style={{ lineHeight: '1.5rem' }}>
                  Detailed analytics & insights
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Track your collection&apos;s evolution with rich statistics and filtering options that reveal your collecting patterns. Browse by genre or decade, filter by rating, monitor total value through purchase prices, and use condition tracking to identify records needing care. Your collection transforms from a static inventory into a dynamic dashboard.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Separator */}
        {!session?.user && (
          <div className="border-t border-slate-300 dark:border-slate-600 mb-16"></div>
        )}

        {/* Latest Vinyls Section */}
        {!session?.user ? (
          <section className="mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 text-left mb-2">
              Latest vinyl records added
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-left mb-6">
              Discover what the community is adding to their collections
            </p>
            <VinylLibrary mode="public" hideSearch={true} limit={8} />
          </section>
        ) : (
          <VinylLibrary mode="public" />
        )}

        {/* Separator */}
        {!session?.user && (
          <div className="border-t border-slate-300 dark:border-slate-600 mb-16"></div>
        )}

        {/* FAQ Section */}
        {!session?.user && (
          <section className="mb-16">
            <div className="w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 sm:p-8">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 text-center mb-8">
                Frequently Asked Questions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  {faqs.slice(0, 3).map((faq, index) => (
                    <FAQAccordion key={index} faq={faq} index={index} />
                  ))}
                </div>
                <div className="space-y-4">
                  {faqs.slice(3, 6).map((faq, index) => (
                    <FAQAccordion key={index + 3} faq={faq} index={index + 3} />
                  ))}
                </div>
              </div>
              <div className="text-center">
                <Link
                  href="/faq"
                  className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                >
                  View all FAQs
                </Link>
              </div>
            </div>
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


