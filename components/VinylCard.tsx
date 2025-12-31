"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Vinyl } from "@/types/vinyl";
import StarRating from "./StarRating";

interface VinylCardProps {
  vinyl: Vinyl;
  onEdit: (vinyl: Vinyl) => void;
  onDelete?: (id: string) => void;
  isLoggedIn?: boolean;
  isOwner?: boolean;
  showOwners?: boolean;
  hideBookmark?: boolean;
  customButtons?: React.ReactNode;
  onOwnerClick?: (username: string, userId: string) => void;
}

// Helper function to calculate average rating and review count
function getRatingInfo(vinyl: Vinyl) {
  if (vinyl.ratings && vinyl.ratings.length > 0) {
    const sum = vinyl.ratings.reduce((acc, r) => acc + r.rating, 0);
    const average = Math.round((sum / vinyl.ratings.length) * 10) / 10;
    return { average, count: vinyl.ratings.length };
  }
  // Fallback to old rating field for backward compatibility
  if (vinyl.rating && vinyl.rating > 0) {
    return { average: vinyl.rating, count: 1 };
  }
  return { average: 0, count: 0 };
}

export default function VinylCard({ vinyl, onEdit, onDelete, isLoggedIn = false, isOwner = false, showOwners = false, hideBookmark = false, customButtons, onOwnerClick }: VinylCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [userRating, setUserRating] = useState<number | undefined>(undefined);
  const [ratingInfo, setRatingInfo] = useState(getRatingInfo(vinyl));

  // Get user's rating and update rating info
  useEffect(() => {
    if (vinyl.ratings && session?.user?.id) {
      const userRatingEntry = vinyl.ratings.find(r => r.userId === session.user.id);
      setUserRating(userRatingEntry?.rating);
    } else if (vinyl.rating && session?.user?.id && vinyl.userId === session.user.id) {
      // Fallback to old rating field
      setUserRating(vinyl.rating);
    } else {
      setUserRating(undefined);
    }
    setRatingInfo(getRatingInfo(vinyl));
  }, [vinyl, session?.user?.id]);

  // Check if vinyl is bookmarked
  useEffect(() => {
    if (isLoggedIn && session?.user?.id && !isOwner) {
      fetch(`/api/bookmarks/check?vinylId=${vinyl.id}`)
        .then(res => res.json())
        .then(data => setIsBookmarked(data.bookmarked))
        .catch(() => setIsBookmarked(false));
    } else if (!isLoggedIn && !isOwner) {
      // Check if vinyl is in pending bookmarks (localStorage)
      const pendingBookmarks = JSON.parse(localStorage.getItem("pendingBookmarks") || "[]");
      setIsBookmarked(pendingBookmarks.includes(vinyl.id));
    }
  }, [vinyl.id, isLoggedIn, isOwner, session?.user?.id]);

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isLoggedIn) {
      // Store or remove bookmark in localStorage for later sync
      const pendingBookmarks = JSON.parse(localStorage.getItem("pendingBookmarks") || "[]");
      if (pendingBookmarks.includes(vinyl.id)) {
        // Remove from pending bookmarks
        const updated = pendingBookmarks.filter((id: string) => id !== vinyl.id);
        if (updated.length > 0) {
          localStorage.setItem("pendingBookmarks", JSON.stringify(updated));
        } else {
          localStorage.removeItem("pendingBookmarks");
        }
        setIsBookmarked(false);
      } else {
        // Add to pending bookmarks
        pendingBookmarks.push(vinyl.id);
        localStorage.setItem("pendingBookmarks", JSON.stringify(pendingBookmarks));
        setIsBookmarked(true);
        router.push("/login");
      }
      return;
    }

    if (isOwner) {
      return; // Don't allow bookmarking own vinyls
    }

    setIsToggling(true);

    try {
      if (isBookmarked) {
        const response = await fetch(`/api/bookmarks?vinylId=${vinyl.id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setIsBookmarked(false);
        }
      } else {
        const response = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vinylId: vinyl.id }),
        });
        if (response.ok) {
          setIsBookmarked(true);
        }
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    } finally {
      setIsToggling(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getYouTubeVideoId = (url?: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeVideoId(vinyl.youtubeLink);
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden">
      <div className="aspect-square bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
        {vinyl.albumArt ? (
          <Image
            src={vinyl.albumArt}
            alt={`${vinyl.artist} - ${vinyl.album}`}
            width={400}
            height={400}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <div className="text-slate-500 dark:text-slate-400 text-center p-4">
            <svg
              className="w-16 h-16 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
            <p className="text-xs">No Cover</p>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-1 line-clamp-1">
          {vinyl.album}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-2 line-clamp-1">
          {vinyl.artist}
        </p>
        {(ratingInfo.average > 0 || (isLoggedIn && !isOwner)) && (
          <div className="mb-2">
            <StarRating 
              rating={isLoggedIn && !isOwner ? (userRating || ratingInfo.average) : ratingInfo.average} 
              onRatingChange={isLoggedIn && !isOwner ? async (rating) => {
                try {
                  const response = await fetch(`/api/vinyls/${vinyl.id}/rating`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ rating: rating === 0 ? undefined : rating }),
                  });
                  if (response.ok) {
                    const updatedVinyl = await response.json();
                    setUserRating(rating === 0 ? undefined : rating);
                    setRatingInfo(getRatingInfo(updatedVinyl));
                    // Update the vinyl prop if parent component supports it
                    if (onEdit) {
                      onEdit(updatedVinyl);
                    }
                  }
                } catch (error) {
                  console.error("Error updating rating:", error);
                }
              } : undefined}
              readonly={!isLoggedIn || isOwner} 
              size="sm"
              reviewCount={ratingInfo.count}
            />
          </div>
        )}
        <div className="flex flex-wrap gap-2 mb-3 text-xs">
          {formatDate(vinyl.releaseDate) && (
            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300">
              {formatDate(vinyl.releaseDate)}
            </span>
          )}
          {vinyl.genre && (
            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300">
              {vinyl.genre}
            </span>
          )}
          {vinyl.condition && (
            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300">
              {vinyl.condition}
            </span>
          )}
        </div>
        {vinyl.label && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            {vinyl.label}
          </p>
        )}
        {vinyl.ean && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            EAN: {vinyl.ean}
          </p>
        )}
        {(vinyl.owners && vinyl.owners.length > 0) ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            {vinyl.owners.length === 1 ? (
              <>Owned by {onOwnerClick ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOwnerClick(vinyl.owners![0].username, vinyl.owners![0].userId);
                  }}
                  className="font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 underline cursor-pointer"
                >
                  {vinyl.owners[0].username}
                </button>
              ) : (
                <span className="font-semibold text-slate-700 dark:text-slate-300">{vinyl.owners[0].username}</span>
              )}</>
            ) : (
              <>Owned by {vinyl.owners.map((o, idx) => (
                <span key={o.userId}>
                  {onOwnerClick ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOwnerClick(o.username, o.userId);
                      }}
                      className="font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 underline cursor-pointer"
                    >
                      {o.username}
                    </button>
                  ) : (
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{o.username}</span>
                  )}
                  {idx < vinyl.owners!.length - 1 && ", "}
                </span>
              ))}</>
            )}
          </p>
        ) : vinyl.username && vinyl.userId ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Owned by {onOwnerClick ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOwnerClick(vinyl.username!, vinyl.userId);
                }}
                className="font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 underline cursor-pointer"
              >
                {vinyl.username}
              </button>
            ) : (
              <span className="font-semibold text-slate-700 dark:text-slate-300">{vinyl.username}</span>
            )}
          </p>
        ) : null}
        {videoId && (
          <div className="mb-3">
            <a
              href={vinyl.youtubeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              Watch on YouTube
            </a>
          </div>
        )}
        <div className="flex gap-2">
          {customButtons ? (
            customButtons
          ) : (
            <>
              <button
                onClick={() => onEdit(vinyl)}
                className={`flex-1 px-3 py-2 ${isLoggedIn && isOwner ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-600 hover:bg-slate-700'} text-white text-sm rounded transition-colors`}
              >
                {isLoggedIn && isOwner ? "Edit" : "Détails"}
              </button>
              {!isOwner && !hideBookmark && (
                <button
                  onClick={handleBookmarkClick}
                  disabled={isToggling}
                  className={`px-3 py-2 rounded transition-colors ${
                    isBookmarked
                      ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                      : "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
                >
                  <svg
                    className="w-5 h-5"
                    fill={isBookmarked ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                </button>
              )}
              {isLoggedIn && isOwner && onDelete && (
                <button
                  onClick={() => onDelete(vinyl.id)}
                  className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                >
                  Delete
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}


