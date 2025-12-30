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
  rating?: number; // 1-5 stars
  youtubeLink?: string;
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
  youtubeLink?: string;
}


