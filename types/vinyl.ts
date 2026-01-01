export interface Vinyl {
  id: string;
  artist: string;
  album: string;
  releaseDate?: string; // ISO date string (YYYY-MM-DD)
  genre?: string;
  label?: string;
  condition?: string;
  notes?: string;
  artistBio?: string;
  albumArt?: string;
  ean?: string;
  rating?: number; // 1-5 stars (deprecated, use ratings array instead)
  ratings?: Array<{ userId: string; username?: string; rating: number; createdAt: string }>; // Ratings from all users
  spotifyLink?: string;
  trackList?: Array<{ title: string; duration?: string; spotifyLink?: string }>; // Track list from Discogs
  country?: string; // Country of origin from Discogs
  credits?: string; // Album credits from Wikipedia
  pressingType?: "original" | "reissue"; // Original pressing or reissue
  userId: string; // ID of the primary user who owns this vinyl (for backward compatibility)
  username?: string; // Username of the primary user (for display on public pages)
  owners?: Array<{ userId: string; username: string; addedAt: string; condition?: string; notes?: string; purchasePrice?: number }>; // All users who own this vinyl, each with their own condition, notes, and purchase price
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
  artistBio?: string;
  purchasePrice?: number;
  addedAt?: string;
  albumArt?: string;
  ean?: string;
  rating?: number;
  spotifyLink?: string;
  trackList?: Array<{ title: string; duration?: string; spotifyLink?: string }>;
  country?: string;
  credits?: string;
  pressingType?: "original" | "reissue";
}


