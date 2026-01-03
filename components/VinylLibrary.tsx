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
  hideSearch?: boolean; // Hide search bar, filters, and add button
  limit?: number; // Limit the number of vinyls displayed
}

export default function VinylLibrary({ mode = "public", hideSearch = false, limit }: VinylLibraryProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [vinyls, setVinyls] = useState<Vinyl[]>([]);
  const [filteredVinyls, setFilteredVinyls] = useState<Vinyl[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVinyl, setEditingVinyl] = useState<Vinyl | null>(null);
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"artist" | "album" | "releaseDate" | "rating" | "dateAdded" | "ownerCount">("dateAdded");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [filterByOwner, setFilterByOwner] = useState<{ username: string; userId: string } | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  const isLoggedIn = !!(status === "authenticated" && session?.user);
  const isPersonalMode = mode === "personal";

  // Read owner filter and vinylId from URL params
  useEffect(() => {
    const ownerUsername = searchParams.get("owner");
    const ownerUserId = searchParams.get("ownerId");
    if (ownerUsername && ownerUserId) {
      setFilterByOwner({ username: ownerUsername, userId: ownerUserId });
    } else {
      setFilterByOwner(null);
    }
    
    // Check for vinylId parameter to open vinyl detail
    const vinylId = searchParams.get("vinylId");
    if (vinylId && isLoggedIn) {
      handleSelectVinyl(vinylId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isLoggedIn]);

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
    if (limit) {
      // When limit is set, always sort by most recent first
      filtered.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime();
        const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime();
        return dateB - dateA; // Newest first
      });
    } else {
      filtered.sort((a, b) => {
        switch (sortBy) {
          case "dateAdded":
            // Sort by creation date, most recent first
            const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime();
            const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime();
            return dateB - dateA; // Newest first
          case "artist":
            return a.artist.localeCompare(b.artist);
          case "album":
            return a.album.localeCompare(b.album);
          case "releaseDate":
            const releaseDateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
            const releaseDateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
            return releaseDateB - releaseDateA; // Newest first
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
          case "ownerCount":
            // Count total owners: 1 if userId exists + owners array length
            const getOwnerCount = (v: Vinyl) => {
              let count = 0;
              if (v.userId) count = 1;
              if (v.owners && v.owners.length > 0) {
                count += v.owners.length;
              }
              return count;
            };
            return getOwnerCount(b) - getOwnerCount(a); // Most owners first
          default:
            return 0;
        }
      });
    }

    // Apply limit if specified (for homepage)
    if (limit) {
      const limitedVinyls = filtered.slice(0, limit);
      setFilteredVinyls(limitedVinyls);
    } else {
      // For pagination, we'll slice in the render
      setFilteredVinyls(filtered);
    }
  }, [vinyls, searchQuery, sortBy, selectedGenre, filterByOwner, limit]);

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

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, selectedGenre, filterByOwner]);

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

  const handleSelectVinyl = async (vinylId: string) => {
    // Fetch the vinyl and open it
    try {
      const response = await fetch(`/api/vinyls?mode=public`);
      if (response.ok) {
        const allVinyls: Vinyl[] = await response.json();
        const selectedVinyl = allVinyls.find(v => v.id === vinylId);
        if (selectedVinyl) {
          setEditingVinyl(selectedVinyl);
          setShowForm(true);
        }
      }
    } catch (error) {
      console.error("Error fetching vinyl:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  // Pagination logic
  const shouldPaginate = isLoggedIn && !hideSearch && !limit;
  const totalPages = shouldPaginate ? Math.ceil(filteredVinyls.length / itemsPerPage) : 1;
  const startIndex = shouldPaginate ? (currentPage - 1) * itemsPerPage : 0;
  const endIndex = shouldPaginate ? startIndex + itemsPerPage : filteredVinyls.length;
  const paginatedVinyls = filteredVinyls.slice(startIndex, endIndex);

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
            className="text-sm hover:underline"
            style={{ color: 'rgb(83 74 211)' }}
          >
            Clear filter
          </button>
        </div>
      )}
      {!hideSearch && (
        <div className="mb-6">
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            selectedGenre={selectedGenre}
            onGenreChange={setSelectedGenre}
            availableGenres={getAvailableGenres()}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            showAddButton={!filterByOwner}
            onAddClick={handleAddVinyl}
            showViewToggle={true}
          />
        </div>
      )}

      {showForm && (
        <VinylForm
          vinyl={editingVinyl}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          readOnly={editingVinyl !== null}
          onSelectVinyl={handleSelectVinyl}
        />
      )}

      {paginatedVinyls.length === 0 ? (
        <div className="text-center py-12 text-slate-600 dark:text-slate-400">
          {vinyls.length === 0
            ? "Your vinyl library is empty. Add your first record!"
            : "No vinyls match your search."}
        </div>
      ) : (hideSearch || viewMode === "grid") ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedVinyls.map((vinyl) => {
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
              {paginatedVinyls.map((vinyl) => {
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

      {filteredVinyls.length > 0 && !hideSearch && (
        <div className="mt-8">
          <div className="text-center text-sm text-slate-600 dark:text-slate-400 mb-4">
            Showing {shouldPaginate ? `${startIndex + 1}-${Math.min(endIndex, filteredVinyls.length)}` : filteredVinyls.length} of {filteredVinyls.length} vinyls
            {filteredVinyls.length !== vinyls.length && ` (${vinyls.length} total)`}
          </div>
          
          {/* Pagination controls */}
          {shouldPaginate && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {(() => {
                  const pages: (number | string)[] = [];
                  
                  if (totalPages <= 7) {
                    // Show all pages if 7 or fewer
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(i);
                    }
                  } else {
                    // Always show first page
                    pages.push(1);
                    
                    // Add ellipsis if current page is far from start
                    if (currentPage > 3) {
                      pages.push('...');
                    }
                    
                    // Add pages around current
                    const start = Math.max(2, currentPage - 1);
                    const end = Math.min(totalPages - 1, currentPage + 1);
                    for (let i = start; i <= end; i++) {
                      if (i !== 1 && i !== totalPages) {
                        pages.push(i);
                      }
                    }
                    
                    // Add ellipsis if current page is far from end
                    if (currentPage < totalPages - 2) {
                      pages.push('...');
                    }
                    
                    // Always show last page
                    pages.push(totalPages);
                  }
                  
                  return pages.map((page, index) => {
                    if (typeof page === 'string') {
                      return (
                        <span key={`ellipsis-${index}`} className="px-2 text-slate-500 dark:text-slate-400">
                          ...
                        </span>
                      );
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          currentPage === page
                            ? "text-white"
                            : "bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"
                        }`}
                        style={currentPage === page ? { backgroundColor: 'rgb(83 74 211)' } : undefined}
                      >
                        {page}
                      </button>
                    );
                  });
                })()}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


