"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import UserMenu from "@/components/UserMenu";
import { Vinyl } from "@/types/vinyl";
import VinylCard from "@/components/VinylCard";

// Helper function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function ShufflePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [shuffledVinyls, setShuffledVinyls] = useState<Vinyl[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch user's vinyls and shuffle them
  const fetchAndShuffle = async () => {
    try {
      const response = await fetch("/api/vinyls?mode=personal");
      if (response.ok) {
        const userVinyls: Vinyl[] = await response.json();
        // Shuffle and take 8 random albums (or all if less than 8)
        const shuffled = shuffleArray(userVinyls);
        setShuffledVinyls(shuffled.slice(0, 8));
      }
    } catch (error) {
      console.error("Error fetching vinyls:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchAndShuffle();
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAndShuffle();
  };

  const handleViewDetails = (vinyl: Vinyl) => {
    router.push(`/?vinylId=${vinyl.id}`);
  };

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading your shuffle playlist...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12">
          {/* Mobile: Browse All, UserMenu, Sign Out - above title */}
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
          {/* Title section */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Ligne 1: Vinyl Report */}
              <Link href="/" className="hover:opacity-80 transition-opacity">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Vinyl Report
                </h1>
              </Link>
              {/* Ligne 2: Shuffle Playlist */}
              <p className="text-slate-600 dark:text-slate-400 text-[1.4rem]">
                Shuffle Playlist
              </p>
            </div>
            {/* Desktop: Browse All, UserMenu, Sign Out on the right, aligned top */}
            {session?.user && (
              <div className="hidden md:flex items-center gap-3">
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
          </div>
        </header>

        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Wonder what to Spin? Let us choose for you.
          </h2>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed md:w-auto w-full"
          >
            {refreshing ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Shuffle Again
              </>
            )}
          </button>
        </div>

        {shuffledVinyls.length === 0 ? (
          <div className="text-center py-12 text-slate-600 dark:text-slate-400">
            Your collection is empty. Add some vinyls to create a shuffle playlist!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {shuffledVinyls.map((vinyl) => (
              <VinylCard
                key={vinyl.id}
                vinyl={vinyl}
                onEdit={handleViewDetails}
                isLoggedIn={!!session?.user}
                isOwner={false}
                showOwners={true}
                onOwnerClick={(username, userId) => {
                  router.push(`/?owner=${encodeURIComponent(username)}&ownerId=${encodeURIComponent(userId)}`);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

