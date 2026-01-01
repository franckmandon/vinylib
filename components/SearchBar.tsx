"use client";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: "artist" | "album" | "releaseDate" | "rating";
  onSortChange: (sort: "artist" | "album" | "releaseDate" | "rating") => void;
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  availableGenres: string[];
}

export default function SearchBar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  selectedGenre,
  onGenreChange,
  availableGenres,
}: SearchBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
      <div className="relative flex-1">
        <input
          type="text"
          placeholder="Search by artist, album, genre, or label..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-4 py-2 pl-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <svg
          className="absolute left-3 top-2.5 w-5 h-5 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <div className="relative">
        <select
          value={sortBy}
          onChange={(e) =>
            onSortChange(e.target.value as "artist" | "album" | "releaseDate" | "rating")
          }
          className="px-4 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
        >
          <option value="artist">Sort by Artist</option>
          <option value="album">Sort by Album</option>
          <option value="releaseDate">Sort by Release Date</option>
          <option value="rating">Sort by Rating</option>
        </select>
        <svg
          className="absolute right-4 top-2.5 w-5 h-5 text-slate-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
      <div className="relative">
        <select
          value={selectedGenre}
          onChange={(e) => onGenreChange(e.target.value)}
          className="px-4 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
        >
          <option value="">All Genres</option>
          {availableGenres.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
        <svg
          className="absolute right-4 top-2.5 w-5 h-5 text-slate-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}


