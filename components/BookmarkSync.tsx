"use client";

import { useSyncPendingBookmarks } from "@/hooks/useSyncPendingBookmarks";

export default function BookmarkSync() {
  useSyncPendingBookmarks();
  return null;
}

