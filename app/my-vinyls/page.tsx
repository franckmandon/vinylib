"use client";

import { Suspense, useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import VinylLibrary from "@/components/VinylLibrary";
import UserMenu from "@/components/UserMenu";
import { Vinyl } from "@/types/vinyl";

export default function MyVinylsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [totalCount, setTotalCount] = useState<number>(0);
  const [userVinyls, setUserVinyls] = useState<Vinyl[]>([]);
  
  useEffect(() => {
    if (session?.user) {
      fetchTotalCount();
    }
  }, [session]);
  
  const fetchTotalCount = async () => {
    try {
      const response = await fetch("/api/vinyls?mode=personal");
      if (response.ok) {
        const data = await response.json();
        setTotalCount(data.length);
        setUserVinyls(data);
      }
    } catch (error) {
      console.error("Error fetching vinyl count:", error);
    }
  };

  const handleShare = () => {
    if (!session?.user?.id || !session?.user?.username) return;
    
    const shareUrl = `${window.location.origin}/?owner=${encodeURIComponent(session.user.username)}&ownerId=${encodeURIComponent(session.user.id)}`;
    
    if (navigator.share) {
      navigator.share({
        title: `${session.user.username}'s Vinyl Collection`,
        text: `Check out ${session.user.username}'s vinyl collection on Vinyl Report!`,
        url: shareUrl,
      }).catch((error) => {
        console.error("Error sharing:", error);
        copyToClipboard(shareUrl);
      });
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Link copied to clipboard!");
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("Link copied to clipboard!");
    });
  };

  const handleExport = () => {
    if (userVinyls.length === 0) {
      alert("No vinyls to export");
      return;
    }

    // Convert to CSV format
    const headers = ["Artist", "Album", "Release Date", "Genre", "Label", "EAN", "Rating", "Description", "Condition"];
    const rows = userVinyls.map(vinyl => {
      const rating = vinyl.ratings && vinyl.ratings.length > 0
        ? (vinyl.ratings.reduce((acc, r) => acc + r.rating, 0) / vinyl.ratings.length).toFixed(1)
        : vinyl.rating || "";
      
      return [
        vinyl.artist || "",
        vinyl.album || "",
        vinyl.releaseDate || "",
        vinyl.genre || "",
        vinyl.label || "",
        vinyl.ean || "",
        rating,
        vinyl.notes || "",
        vinyl.condition || "",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `my-vinyl-collection-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
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
              <h1 className="font-bold text-slate-900 dark:text-slate-100 mb-1" style={{ fontSize: '3rem' }}>
                Vinyl Report
              </h1>
            </Link>
            {/* Ligne 2: My Vinyl Collection + icônes partage/export */}
            <div className="flex items-center gap-3 mb-1">
              <p className="text-slate-600 dark:text-slate-400 text-[1.4rem]">
                My Vinyl Collection
              </p>
              {session?.user && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleShare}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Share collection"
                    aria-label="Share collection"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: 'rgb(37 99 235)' }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={handleExport}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Export collection"
                    aria-label="Export collection"
                  >
                    <svg
                      height="24"
                      width="24"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: 'rgb(37 99 235)' }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            {/* Ligne 3: You have xxx vinyls */}
            {session?.user && (
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                You have {totalCount} {totalCount === 1 ? 'vinyl' : 'vinyls'}
              </p>
            )}
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
        <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
          <VinylLibrary mode="personal" />
        </Suspense>
      </div>
    </main>
  );
}

