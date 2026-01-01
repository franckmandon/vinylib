"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Vinyl } from "@/types/vinyl";
import VinylCard from "./VinylCard";
import VinylListItem from "./VinylListItem";
import VinylForm from "./VinylForm";
import SearchBar from "./SearchBar";
import Link from "next/link";

interface VinylLibraryProps {
  mode?: "public" | "personal"; // "public" shows all vinyls, "personal" shows user's vinyls
}

export default function VinylLibrary({ mode = "public" }: VinylLibraryProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [vinyls, setVinyls] = useState<Vinyl[]>([]);
  const [filteredVinyls, setFilteredVinyls] = useState<Vinyl[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVinyl, setEditingVinyl] = useState<Vinyl | null>(null);
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"artist" | "album" | "releaseDate" | "rating">("artist");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [filterByOwner, setFilterByOwner] = useState<{ username: string; userId: string } | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const isLoggedIn = !!(status === "authenticated" && session?.user);
  const isPersonalMode = mode === "personal";

  // Read owner filter from URL params
  useEffect(() => {
    const ownerUsername = searchParams.get("owner");
    const ownerUserId = searchParams.get("ownerId");
    if (ownerUsername && ownerUserId) {
      setFilterByOwner({ username: ownerUsername, userId: ownerUserId });
    } else {
      setFilterByOwner(null);
    }
  }, [searchParams]);

  const filterAndSortVinyls = useCallback(() => {
    let filtered = [...vinyls];

    // Filter by owner
    if (filterByOwner) {
      filtered = filtered.filter((vinyl) => {
        return vinyl.userId === filterByOwner.userId ||
          vinyl.owners?.some(o => o.userId === filterByOwner.userId);
      });
    }

    // Filter by genre
    if (selectedGenre) {
      filtered = filtered.filter((vinyl) => vinyl.genre === selectedGenre);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (vinyl) =>
          vinyl.artist.toLowerCase().includes(query) ||
          vinyl.album.toLowerCase().includes(query) ||
          vinyl.genre?.toLowerCase().includes(query) ||
          vinyl.label?.toLowerCase().includes(query) ||
          vinyl.ean?.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "artist":
          return a.artist.localeCompare(b.artist);
        case "album":
          return a.album.localeCompare(b.album);
        case "releaseDate":
          const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
          const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
          return dateB - dateA; // Newest first
        case "rating":
          // Calculate average rating for comparison
          const getAvgRating = (v: Vinyl) => {
            if (v.ratings && v.ratings.length > 0) {
              const sum = v.ratings.reduce((acc, r) => acc + r.rating, 0);
              return sum / v.ratings.length;
            }
            return v.rating || 0;
          };
          return getAvgRating(b) - getAvgRating(a); // Highest first
        default:
          return 0;
      }
    });

    setFilteredVinyls(filtered);
  }, [vinyls, searchQuery, sortBy, selectedGenre, filterByOwner]);

  useEffect(() => {
    fetchVinyls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, isPersonalMode]);

  // Reload vinyls when session changes (user logs in/out)
  useEffect(() => {
    if (status !== "loading") {
      fetchVinyls();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    filterAndSortVinyls();
  }, [filterAndSortVinyls]);

  const getAvailableGenres = (): string[] => {
    const genres = new Set<string>();
    vinyls.forEach((vinyl) => {
      if (vinyl.genre) {
        genres.add(vinyl.genre);
      }
    });
    return Array.from(genres).sort();
  };

  const fetchVinyls = async () => {
    try {
      // If personal mode and not logged in, redirect to login
      if (isPersonalMode && !isLoggedIn) {
        router.push("/login");
        return;
      }
      
      // Build URL with mode parameter
      const url = isPersonalMode ? "/api/vinyls?mode=personal" : "/api/vinyls?mode=public";
      
      const response = await fetch(url, {
        cache: "no-store", // Ensure fresh data on each request
      });
      if (response.ok) {
        const data = await response.json();
        setVinyls(data);
      }
    } catch (error) {
      console.error("Error fetching vinyls:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVinyl = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setEditingVinyl(null);
    setShowForm(true);
  };

  const handleViewDetails = (vinyl: Vinyl) => {
    setEditingVinyl(vinyl);
    setShowForm(true);
  };

  const handleDeleteVinyl = async (id: string) => {
    if (!isLoggedIn) {
      return;
    }
    
    if (!confirm("Are you sure you want to delete this vinyl?")) {
      return;
    }

    try {
      const response = await fetch(`/api/vinyls?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setVinyls(vinyls.filter((v) => v.id !== id));
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete vinyl");
      }
    } catch (error) {
      console.error("Error deleting vinyl:", error);
      alert("Failed to delete vinyl");
    }
  };

  const handleFormSubmit = async () => {
    await fetchVinyls();
    setShowForm(false);
    setEditingVinyl(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingVinyl(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      {filterByOwner && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Showing vinyls from:
          </span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {filterByOwner.username}
          </span>
          <button
            onClick={() => {
              setFilterByOwner(null);
              router.push("/");
            }}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Clear filter
          </button>
        </div>
      )}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          selectedGenre={selectedGenre}
          onGenreChange={setSelectedGenre}
          availableGenres={getAvailableGenres()}
        />
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
              aria-label="Grid view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded transition-colors ${
                viewMode === "list"
                  ? "bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
              aria-label="List view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          {!filterByOwner && (
            <button
              onClick={handleAddVinyl}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg whitespace-nowrap"
            >
              + Add Vinyl
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <VinylForm
          vinyl={editingVinyl}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          readOnly={editingVinyl !== null}
        />
      )}

      {filteredVinyls.length === 0 ? (
        <div className="text-center py-12 text-slate-600 dark:text-slate-400">
          {vinyls.length === 0
            ? "Your vinyl library is empty. Add your first record!"
            : "No vinyls match your search."}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVinyls.map((vinyl) => {
            const ownsVinyl = isLoggedIn && session?.user?.id && (
              vinyl.userId === session.user.id || 
              vinyl.owners?.some(o => o.userId === session.user.id)
            );
            return (
              <VinylCard
                key={vinyl.id}
                vinyl={vinyl}
                onEdit={handleViewDetails}
                isLoggedIn={isLoggedIn}
                isOwner={!!ownsVinyl}
                showOwners={!isPersonalMode} // Show owners on public page
                onOwnerClick={(username, userId) => {
                  router.push(`/?owner=${encodeURIComponent(username)}&ownerId=${encodeURIComponent(userId)}`);
                }}
              />
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300 dark:border-slate-600">
                <th className="p-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Cover</th>
                <th className="p-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Artist</th>
                <th className="p-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Album</th>
                <th className="p-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Genre</th>
                <th className="p-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Rating</th>
                <th className="p-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Owners</th>
                <th className="p-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVinyls.map((vinyl) => {
                const ownsVinyl = isLoggedIn && session?.user?.id && (
                  vinyl.userId === session.user.id || 
                  vinyl.owners?.some(o => o.userId === session.user.id)
                );
                return (
                  <VinylListItem
                    key={vinyl.id}
                    vinyl={vinyl}
                    onEdit={handleViewDetails}
                    onDelete={ownsVinyl ? handleDeleteVinyl : undefined}
                    isLoggedIn={isLoggedIn}
                    isOwner={!!ownsVinyl}
                    showOwners={!isPersonalMode} // Show owners on public page
                    onOwnerClick={(username, userId) => {
                      router.push(`/?owner=${encodeURIComponent(username)}&ownerId=${encodeURIComponent(userId)}`);
                    }}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filteredVinyls.length > 0 && (
        <div className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          Showing {filteredVinyls.length} of {vinyls.length} vinyls
        </div>
      )}
    </div>
  );
}


