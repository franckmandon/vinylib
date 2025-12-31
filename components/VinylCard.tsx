"use client";

import Image from "next/image";
import { Vinyl } from "@/types/vinyl";
import StarRating from "./StarRating";

interface VinylCardProps {
  vinyl: Vinyl;
  onEdit: (vinyl: Vinyl) => void;
  onDelete: (id: string) => void;
}

export default function VinylCard({ vinyl, onEdit, onDelete }: VinylCardProps) {
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
      <div className="aspect-square bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center relative">
        {vinyl.albumArt ? (
          <Image
            src={vinyl.albumArt}
            alt={`${vinyl.artist} - ${vinyl.album}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
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
        {vinyl.rating && vinyl.rating > 0 && (
          <div className="mb-2">
            <StarRating rating={vinyl.rating} readonly size="sm" />
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
          <button
            onClick={() => onEdit(vinyl)}
            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(vinyl.id)}
            className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}


