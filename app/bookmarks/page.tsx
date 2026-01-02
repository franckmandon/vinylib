"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookmarkWithVinyl } from "@/types/bookmark";
import VinylCard from "@/components/VinylCard";
import VinylForm from "@/components/VinylForm";
import SearchBar from "@/components/SearchBar";
import UserMenu from "@/components/UserMenu";
import { Vinyl } from "@/types/vinyl";

export default function BookmarksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<BookmarkWithVinyl[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<BookmarkWithVinyl[]>([]);
  const [userVinyls, setUserVinyls] = useState<Vinyl[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedVinyl, setSelectedVinyl] = useState<Vinyl | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"artist" | "album" | "releaseDate" | "rating" | "dateAdded" | "ownerCount">("dateAdded");
  const [selectedGenre, setSelectedGenre] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchBookmarks();
      fetchUserVinyls();
    }
  }, [status, router]);

  const fetchBookmarks = async () => {
    try {
      const response = await fetch("/api/bookmarks");
      if (response.ok) {
        const data = await response.json();
        setBookmarks(data);
      }
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserVinyls = async () => {
    try {
      const response = await fetch("/api/vinyls?mode=personal");
      if (response.ok) {
        const data = await response.json();
        setUserVinyls(data);
      }
    } catch (error) {
      console.error("Error fetching user vinyls:", error);
    }
  };

  const getAvailableGenres = (): string[] => {
    const genres = new Set<string>();
    bookmarks.forEach((bookmark) => {
      if (bookmark.vinyl.genre) {
        genres.add(bookmark.vinyl.genre);
      }
    });
    return Array.from(genres).sort();
  };

  const filterAndSortBookmarks = useCallback(() => {
    let filtered = [...bookmarks];

    // Filter by genre
    if (selectedGenre) {
      filtered = filtered.filter((bookmark) => bookmark.vinyl.genre === selectedGenre);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (bookmark) =>
          bookmark.vinyl.artist.toLowerCase().includes(query) ||
          bookmark.vinyl.album.toLowerCase().includes(query) ||
          bookmark.vinyl.genre?.toLowerCase().includes(query) ||
          bookmark.vinyl.label?.toLowerCase().includes(query) ||
          bookmark.vinyl.ean?.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "dateAdded":
          // Sort by bookmark creation date, most recent first
          const dateA = new Date(a.createdAt || a.vinyl.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || b.vinyl.createdAt || 0).getTime();
          return dateB - dateA; // Newest first
        case "artist":
          return a.vinyl.artist.localeCompare(b.vinyl.artist);
        case "album":
          return a.vinyl.album.localeCompare(b.vinyl.album);
        case "releaseDate":
          const releaseDateA = a.vinyl.releaseDate ? new Date(a.vinyl.releaseDate).getTime() : 0;
          const releaseDateB = b.vinyl.releaseDate ? new Date(b.vinyl.releaseDate).getTime() : 0;
          return releaseDateB - releaseDateA; // Newest first
        case "rating":
          return (b.vinyl.rating || 0) - (a.vinyl.rating || 0); // Highest first
        case "ownerCount":
          const getOwnerCount = (v: Vinyl) => {
            let count = 0;
            if (v.userId) count++; // Original owner
            if (v.owners) count += v.owners.length; // Additional owners
            return count;
          };
          return getOwnerCount(b.vinyl) - getOwnerCount(a.vinyl); // Highest first
        default:
          return 0;
      }
    });

    setFilteredBookmarks(filtered);
  }, [bookmarks, searchQuery, sortBy, selectedGenre]);

  useEffect(() => {
    filterAndSortBookmarks();
  }, [filterAndSortBookmarks]);

  const isVinylInCollection = (vinylId: string): boolean => {
    if (!session?.user?.id) return false;
    return userVinyls.some(
      v => v.id === vinylId && 
      (v.userId === session.user.id || v.owners?.some(o => o.userId === session.user.id))
    );
  };

  const handleDeleteBookmark = async (vinylId: string) => {
    try {
      const response = await fetch(`/api/bookmarks?vinylId=${vinylId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setBookmarks(bookmarks.filter(b => b.vinylId !== vinylId));
      }
    } catch (error) {
      console.error("Error deleting bookmark:", error);
    }
  };

  const handleAddToCollection = async (vinyl: Vinyl) => {
    try {
      // Add vinyl to collection using existing data
      const response = await fetch("/api/vinyls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artist: vinyl.artist,
          album: vinyl.album,
          releaseDate: vinyl.releaseDate,
          genre: vinyl.genre,
          label: vinyl.label,
          condition: vinyl.condition,
          notes: vinyl.notes,
          albumArt: vinyl.albumArt,
          ean: vinyl.ean,
          rating: vinyl.rating,
          spotifyLink: vinyl.spotifyLink,
        }),
      });

      if (response.ok) {
        // Remove from bookmarks after adding to collection
        await handleDeleteBookmark(vinyl.id);
        // Refresh user vinyls
        await fetchUserVinyls();
        // Optionally redirect to collection
        // router.push("/my-vinyls");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add vinyl to collection");
      }
    } catch (error) {
      console.error("Error adding vinyl to collection:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleViewDetails = (vinyl: Vinyl) => {
    setSelectedVinyl(vinyl);
    setShowForm(true);
  };

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-slate-600 dark:text-slate-400">Loading...</div>
        </div>
      </main>
    );
  }

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
              {/* Ligne 2: My Bookmarks */}
              <p className="text-slate-600 dark:text-slate-400 text-[1.4rem] mb-1">
                My Bookmarks
              </p>
              {/* Ligne 3: You have xxx bookmarks */}
              {session?.user && (
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  You have {bookmarks.length} {bookmarks.length === 1 ? 'bookmark' : 'bookmarks'}
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

        <div className="mb-6">
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            selectedGenre={selectedGenre}
            onGenreChange={setSelectedGenre}
            availableGenres={getAvailableGenres()}
          />
        </div>

        {bookmarks.length === 0 ? (
          <div className="text-center py-12 text-slate-600 dark:text-slate-400">
            <p className="text-lg mb-2">No bookmarks yet</p>
            <p className="text-sm">Start bookmarking vinyls you want to add to your collection!</p>
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <div className="text-center py-12 text-slate-600 dark:text-slate-400">
            <p className="text-lg mb-2">No bookmarks match your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBookmarks.map((bookmark) => {
              const isInCollection = isVinylInCollection(bookmark.vinyl.id);
              return (
                <VinylCard
                  key={bookmark.id}
                  vinyl={bookmark.vinyl}
                  onEdit={handleViewDetails}
                  isLoggedIn={true}
                  isOwner={isInCollection}
                  showOwners={false}
                  hideBookmark={true}
                  customButtons={
                    <>
                      <button
                        onClick={() => handleViewDetails(bookmark.vinyl)}
                        className="flex-1 px-2 py-2 sm:px-3 sm:py-2 bg-slate-600 hover:bg-slate-700 text-white text-xs sm:text-sm rounded transition-colors"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleAddToCollection(bookmark.vinyl)}
                        className="flex-1 px-2 py-2 sm:px-3 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm rounded transition-colors"
                      >
                        Add vinyl
                      </button>
                      <button
                        onClick={() => handleDeleteBookmark(bookmark.vinylId)}
                        className="px-2 py-2 sm:px-3 sm:py-2 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm rounded transition-colors"
                      >
                        Remove
                      </button>
                    </>
                  }
                />
              );
            })}
          </div>
        )}

        {showForm && selectedVinyl && (
          <VinylForm
            vinyl={selectedVinyl}
            onSubmit={async () => {
              // VinylForm already handles the API call, this callback runs after successful submission
              // Remove from bookmarks after adding to collection
              await handleDeleteBookmark(selectedVinyl.id);
              await fetchBookmarks();
              await fetchUserVinyls();
              setShowForm(false);
              setSelectedVinyl(null);
            }}
            onCancel={() => {
              setShowForm(false);
              setSelectedVinyl(null);
            }}
            readOnly={!isVinylInCollection(selectedVinyl.id)}
          />
        )}
      </div>
    </main>
  );
}

