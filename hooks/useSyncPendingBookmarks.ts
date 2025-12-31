"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export function useSyncPendingBookmarks() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      const pendingBookmarks = JSON.parse(localStorage.getItem("pendingBookmarks") || "[]");
      
      if (pendingBookmarks.length > 0) {
        // Sync all pending bookmarks
        const syncBookmarks = async () => {
          const synced: string[] = [];
          
          for (const vinylId of pendingBookmarks) {
            try {
              const response = await fetch("/api/bookmarks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vinylId }),
              });
              
              if (response.ok) {
                synced.push(vinylId);
              }
            } catch (error) {
              console.error(`Error syncing bookmark for vinyl ${vinylId}:`, error);
            }
          }
          
          // Remove synced bookmarks from localStorage
          const remaining = pendingBookmarks.filter((id: string) => !synced.includes(id));
          if (remaining.length > 0) {
            localStorage.setItem("pendingBookmarks", JSON.stringify(remaining));
          } else {
            localStorage.removeItem("pendingBookmarks");
          }
        };
        
        syncBookmarks();
      }
    }
  }, [status, session?.user?.id]);
}

