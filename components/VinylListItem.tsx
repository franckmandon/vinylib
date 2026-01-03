"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Vinyl } from "@/types/vinyl";
import StarRating from "./StarRating";

interface VinylListItemProps {
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

export default function VinylListItem({ 
  vinyl, 
  onEdit, 
  onDelete, 
  isLoggedIn = false, 
  isOwner = false, 
  showOwners = false, 
  hideBookmark = false, 
  customButtons, 
  onOwnerClick 
}: VinylListItemProps) {
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
      const pendingBookmarks = JSON.parse(localStorage.getItem("pendingBookmarks") || "[]");
      setIsBookmarked(pendingBookmarks.includes(vinyl.id));
    }
  }, [vinyl.id, isLoggedIn, isOwner, session?.user?.id]);

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isLoggedIn) {
      const pendingBookmarks = JSON.parse(localStorage.getItem("pendingBookmarks") || "[]");
      if (pendingBookmarks.includes(vinyl.id)) {
        const updated = pendingBookmarks.filter((id: string) => id !== vinyl.id);
        if (updated.length > 0) {
          localStorage.setItem("pendingBookmarks", JSON.stringify(updated));
        } else {
          localStorage.removeItem("pendingBookmarks");
        }
        setIsBookmarked(false);
      } else {
        pendingBookmarks.push(vinyl.id);
        localStorage.setItem("pendingBookmarks", JSON.stringify(pendingBookmarks));
        setIsBookmarked(true);
        router.push("/login");
      }
      return;
    }

    setIsToggling(true);
    try {
      if (isBookmarked) {
        await fetch(`/api/bookmarks?vinylId=${vinyl.id}`, { method: "DELETE" });
        setIsBookmarked(false);
      } else {
        await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vinylId: vinyl.id }),
        });
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleViewDetails = () => {
    onEdit(vinyl);
  };

  const formatOwners = () => {
    if (!showOwners) return null;
    
    const allOwners: Array<{ userId: string; username: string }> = [];
    
    if (vinyl.userId && vinyl.username) {
      allOwners.push({ userId: vinyl.userId, username: vinyl.username });
    }
    
    if (vinyl.owners) {
      vinyl.owners.forEach(owner => {
        if (!allOwners.some(o => o.userId === owner.userId)) {
          allOwners.push({ userId: owner.userId, username: owner.username });
        }
      });
    }
    
    if (allOwners.length === 0) return null;
    
    return (
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-xs text-slate-500 dark:text-slate-400">Owned by:</span>
        {allOwners.map((owner, index) => (
          <span key={owner.userId}>
            {onOwnerClick ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOwnerClick(owner.username, owner.userId);
                }}
                className="text-xs hover:underline"
                style={{ color: 'rgb(83 74 211)' }}
              >
                {owner.username}
              </button>
            ) : (
              <span className="text-xs text-slate-600 dark:text-slate-400">{owner.username}</span>
            )}
            {index < allOwners.length - 1 && (
              <span className="text-xs text-slate-500 dark:text-slate-400">, </span>
            )}
          </span>
        ))}
      </div>
    );
  };

  return (
    <tr className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      {/* Thumbnail */}
      <td className="p-3">
        <div 
          className="relative w-[100px] h-[100px] rounded overflow-hidden bg-slate-200 dark:bg-slate-700 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => onEdit(vinyl)}
        >
          {vinyl.albumArt ? (
            <Image
              src={vinyl.albumArt}
              alt={`${vinyl.artist} - ${vinyl.album}`}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
              No Image
            </div>
          )}
        </div>
      </td>

      {/* Artist */}
      <td className="p-3">
        <div className="font-medium text-slate-900 dark:text-slate-100">
          {vinyl.artist}
        </div>
      </td>

      {/* Album */}
      <td className="p-3">
        <div className="text-slate-700 dark:text-slate-300">
          {vinyl.album}
        </div>
      </td>

      {/* Genre */}
      <td className="p-3">
        <div className="text-slate-600 dark:text-slate-400">
          {vinyl.genre || "-"}
        </div>
      </td>

      {/* Rating */}
      <td className="p-3">
        {(ratingInfo.average > 0 || (isLoggedIn && !isOwner)) && (
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
        )}
      </td>

      {/* Owners */}
      <td className="p-3">
        {formatOwners()}
      </td>

      {/* Actions */}
      <td className="p-3">
        <div className="flex items-center gap-2">
          {customButtons ? (
            customButtons
          ) : (
            <>
              {isLoggedIn && isOwner ? (
                <>
                  <button
                    onClick={() => onEdit(vinyl)}
                    className="px-3 py-1.5 text-white text-sm rounded transition-colors"
                    style={{ backgroundColor: '#534AD3' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4338A8'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#534AD3'}
                  >
                    Edit
                  </button>
                  {onDelete && (
                    <button
                      onClick={() => onDelete(vinyl.id)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={handleViewDetails}
                    className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded transition-colors"
                  >
                    Details
                  </button>
                  {!isOwner && !hideBookmark && (
                    <button
                      onClick={handleBookmarkClick}
                      disabled={isToggling}
                      className="p-1.5 text-slate-600 dark:text-slate-400 transition-colors disabled:opacity-50"
                      onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.color = 'rgb(83 74 211)')}
                      onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.color = '')}
                      aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
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
                </>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

