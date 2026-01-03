"use client";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: "artist" | "album" | "releaseDate" | "rating" | "dateAdded" | "ownerCount";
  onSortChange: (sort: "artist" | "album" | "releaseDate" | "rating" | "dateAdded" | "ownerCount") => void;
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  availableGenres: string[];
  viewMode?: "grid" | "list";
  onViewModeChange?: (mode: "grid" | "list") => void;
  showAddButton?: boolean;
  onAddClick?: () => void;
  showViewToggle?: boolean;
}

export default function SearchBar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  selectedGenre,
  onGenreChange,
  availableGenres,
  viewMode,
  onViewModeChange,
  showAddButton = false,
  onAddClick,
  showViewToggle = false,
}: SearchBarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 flex-1 w-full items-start md:items-center">
      {/* Search bar - full width on mobile, flex-1 on desktop */}
      <div className="relative flex-1 w-full md:w-auto">
        <input
          type="text"
          placeholder="Search by artist, album, genre, or label..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-[42px] px-4 pl-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
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
      {/* Mobile: Sort by, Genres, and View Toggle on same line */}
      <div className="flex flex-row gap-3 w-full md:w-auto md:flex-shrink-0">
        <div className="relative flex-1 md:flex-initial md:min-w-[180px]">
          <select
            name="sort by"
            value={sortBy}
            onChange={(e) =>
              onSortChange(e.target.value as "artist" | "album" | "releaseDate" | "rating" | "dateAdded" | "ownerCount")
            }
            className="w-full h-[42px] px-4 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none appearance-none text-sm"
          >
            <option value="dateAdded">Sort by Date Added</option>
            <option value="artist">Sort by Artist</option>
            <option value="album">Sort by Album</option>
            <option value="releaseDate">Sort by Release Date</option>
            <option value="rating">Sort by Rating</option>
            <option value="ownerCount">Sort by Number of Owners</option>
          </select>
          <svg
            className="absolute right-3 top-2.5 w-5 h-5 text-slate-400 pointer-events-none"
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
        <div className="relative flex-1 md:flex-initial md:min-w-[140px]">
          <select
            name="genres"
            value={selectedGenre}
            onChange={(e) => onGenreChange(e.target.value)}
            className="w-full h-[42px] px-4 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none appearance-none text-sm"
          >
            <option value="">All Genres</option>
            {availableGenres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-3 top-2.5 w-5 h-5 text-slate-400 pointer-events-none"
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
        {/* View Mode Toggle - Mobile: on same line, Desktop: on same line */}
        {showViewToggle && viewMode && onViewModeChange && (
          <div className="flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 md:ml-2 h-[42px]">
            <button
              onClick={() => onViewModeChange("grid")}
              className={`h-full px-2 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-slate-100 dark:bg-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
              aria-label="Grid view"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={viewMode === "grid" ? { color: 'rgb(165, 161, 232)' } : undefined}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={`h-full px-2 rounded transition-colors ${
                viewMode === "list"
                  ? "bg-slate-100 dark:bg-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
              aria-label="List view"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={viewMode === "list" ? { color: 'rgb(165, 161, 232)' } : undefined}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        )}
      </div>
      {/* Desktop: Add button on same line */}
      {showAddButton && onAddClick && (
        <button
          onClick={onAddClick}
          className="hidden md:block px-6 py-2 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg whitespace-nowrap"
          style={{ backgroundColor: '#534AD3' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4338A8'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#534AD3'}
        >
          <strong>+ Add Vinyl</strong>
        </button>
      )}
      {/* Mobile: Add button centered, full width, below filters */}
      {showAddButton && onAddClick && (
        <button
          onClick={onAddClick}
          className="w-full md:hidden px-6 py-2 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
          style={{ backgroundColor: '#534AD3' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4338A8'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#534AD3'}
        >
          <strong>+ Add Vinyl</strong>
        </button>
      )}
    </div>
  );
}


