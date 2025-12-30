"use client";

import { useState, useEffect } from "react";
import { Vinyl } from "@/types/vinyl";
import VinylCard from "./VinylCard";
import VinylForm from "./VinylForm";
import SearchBar from "./SearchBar";

export default function VinylLibrary() {
  const [vinyls, setVinyls] = useState<Vinyl[]>([]);
  const [filteredVinyls, setFilteredVinyls] = useState<Vinyl[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVinyl, setEditingVinyl] = useState<Vinyl | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"artist" | "album" | "releaseDate" | "rating">("artist");
  const [selectedGenre, setSelectedGenre] = useState("");

  useEffect(() => {
    fetchVinyls();
  }, []);

  useEffect(() => {
    filterAndSortVinyls();
  }, [vinyls, searchQuery, sortBy, selectedGenre]);

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
      const response = await fetch("/api/vinyls");
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

  const filterAndSortVinyls = () => {
    let filtered = [...vinyls];

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
          return (b.rating || 0) - (a.rating || 0); // Highest first
        default:
          return 0;
      }
    });

    setFilteredVinyls(filtered);
  };

  const handleAddVinyl = () => {
    setEditingVinyl(null);
    setShowForm(true);
  };

  const handleEditVinyl = (vinyl: Vinyl) => {
    setEditingVinyl(vinyl);
    setShowForm(true);
  };

  const handleDeleteVinyl = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vinyl?")) {
      return;
    }

    try {
      const response = await fetch(`/api/vinyls?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setVinyls(vinyls.filter((v) => v.id !== id));
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
        <button
          onClick={handleAddVinyl}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg whitespace-nowrap"
        >
          + Add Vinyl
        </button>
      </div>

      {showForm && (
        <VinylForm
          vinyl={editingVinyl}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}

      {filteredVinyls.length === 0 ? (
        <div className="text-center py-12 text-slate-600 dark:text-slate-400">
          {vinyls.length === 0
            ? "Your vinyl library is empty. Add your first record!"
            : "No vinyls match your search."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVinyls.map((vinyl) => (
            <VinylCard
              key={vinyl.id}
              vinyl={vinyl}
              onEdit={handleEditVinyl}
              onDelete={handleDeleteVinyl}
            />
          ))}
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


