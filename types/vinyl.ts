export interface Vinyl {
  id: string;
  artist: string;
  album: string;
  releaseDate?: string; // ISO date string (YYYY-MM-DD)
  genre?: string;
  label?: string;
  condition?: string;
  notes?: string;
  albumArt?: string;
  ean?: string;
  rating?: number; // 1-5 stars (deprecated, use ratings array instead)
  ratings?: Array<{ userId: string; username?: string; rating: number; createdAt: string }>; // Ratings from all users
  spotifyLink?: string;
  trackList?: Array<{ position: string; title: string; duration?: string }>; // Track list from Discogs
  userId: string; // ID of the primary user who owns this vinyl (for backward compatibility)
  username?: string; // Username of the primary user (for display on public pages)
  owners?: Array<{ userId: string; username: string; addedAt: string; condition?: string }>; // All users who own this vinyl, each with their own condition
  createdAt: string;
  updatedAt: string;
}

export interface VinylFormData {
  artist: string;
  album: string;
  releaseDate?: string;
  genre?: string;
  label?: string;
  condition?: string;
  notes?: string;
  albumArt?: string;
  ean?: string;
  rating?: number;
  spotifyLink?: string;
  trackList?: Array<{ position: string; title: string; duration?: string }>;
}


