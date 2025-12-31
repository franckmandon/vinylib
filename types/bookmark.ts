import { Vinyl } from "./vinyl";

export interface Bookmark {
  id: string;
  userId: string;
  vinylId: string;
  createdAt: string;
}

export interface BookmarkWithVinyl extends Bookmark {
  vinyl: Vinyl;
}

