"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Vinyl, VinylFormData } from "@/types/vinyl";
import StarRating from "./StarRating";
import BarcodeScanner from "./BarcodeScanner";

interface VinylFormProps {
  vinyl?: Vinyl | null;
  onSubmit: () => void;
  onCancel: () => void;
  readOnly?: boolean; // If true, form is in view-only mode
}

export default function VinylForm({ vinyl, onSubmit, onCancel, readOnly = false }: VinylFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState<VinylFormData>({
    artist: "",
    album: "",
    releaseDate: "",
    genre: "",
    label: "",
    condition: "",
    notes: "",
    albumArt: "",
    ean: "",
    rating: undefined,
    youtubeLink: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingWikipedia, setLoadingWikipedia] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [loadingEAN, setLoadingEAN] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showChoiceDialog, setShowChoiceDialog] = useState(false);
  const [scannedVinylData, setScannedVinylData] = useState<VinylFormData | null>(null);
  const [userRating, setUserRating] = useState<number | undefined>(undefined);
  const [ratingInfo, setRatingInfo] = useState<{ average: number; count: number }>({ average: 0, count: 0 });

  useEffect(() => {
    if (vinyl) {
      setFormData({
        artist: vinyl.artist,
        album: vinyl.album,
        releaseDate: vinyl.releaseDate || "",
        genre: vinyl.genre || "",
        label: vinyl.label || "",
        condition: vinyl.condition || "",
        notes: vinyl.notes || "",
        albumArt: vinyl.albumArt || "",
        ean: vinyl.ean || "",
        rating: vinyl.rating,
        youtubeLink: vinyl.youtubeLink || "",
      });
      
      // Get user's rating and calculate average
      if (vinyl.ratings && session?.user?.id) {
        const userRatingEntry = vinyl.ratings.find(r => r.userId === session.user.id);
        setUserRating(userRatingEntry?.rating);
      } else if (vinyl.rating && session?.user?.id && vinyl.userId === session.user.id) {
        setUserRating(vinyl.rating);
      } else {
        setUserRating(undefined);
      }
      
      // Calculate average rating
      if (vinyl.ratings && vinyl.ratings.length > 0) {
        const sum = vinyl.ratings.reduce((acc, r) => acc + r.rating, 0);
        const average = Math.round((sum / vinyl.ratings.length) * 10) / 10;
        setRatingInfo({ average, count: vinyl.ratings.length });
      } else if (vinyl.rating && vinyl.rating > 0) {
        setRatingInfo({ average: vinyl.rating, count: 1 });
      } else {
        setRatingInfo({ average: 0, count: 0 });
      }
    }
  }, [vinyl, session?.user?.id]);

  const fetchWikipediaContent = async () => {
    if (!formData.artist || !formData.album) {
      alert("Please enter both artist and album before fetching Wikipedia content");
      return;
    }

    setLoadingWikipedia(true);
    try {
      const response = await fetch(
        `/api/wikipedia?artist=${encodeURIComponent(formData.artist)}&album=${encodeURIComponent(formData.album)}`
      );

      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({
          ...prev,
          notes: data.content || prev.notes,
        }));
      } else {
        const error = await response.json();
        alert(error.error || "Failed to fetch Wikipedia content");
      }
    } catch (error) {
      console.error("Error fetching Wikipedia content:", error);
      alert("Failed to fetch Wikipedia content");
    } finally {
      setLoadingWikipedia(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = "/api/vinyls";
      const method = vinyl ? "PUT" : "POST";
      const body = vinyl
        ? { id: vinyl.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const savedVinyl = await response.json();
        
        // If adding to collection, remove from bookmarks if it exists there
        if (session?.user?.id && !vinyl) {
          try {
            const bookmarkCheckResponse = await fetch(`/api/bookmarks/check?vinylId=${savedVinyl.id}`);
            if (bookmarkCheckResponse.ok) {
              const { bookmarked } = await bookmarkCheckResponse.json();
              if (bookmarked) {
                // Remove from bookmarks
                await fetch(`/api/bookmarks?vinylId=${savedVinyl.id}`, {
                  method: "DELETE",
                });
              }
            }
          } catch (error) {
            // Ignore errors when checking/removing bookmarks
            console.error("Error checking/removing bookmark:", error);
          }
        }
        
        onSubmit();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save vinyl");
      }
    } catch (error) {
      console.error("Error saving vinyl:", error);
      alert("Failed to save vinyl");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRatingChange = async (rating: number) => {
    const finalRating = rating === 0 ? undefined : rating;
    
    // If editing an existing vinyl, update rating via API
    if (vinyl && session?.user?.id) {
      try {
        const response = await fetch(`/api/vinyls/${vinyl.id}/rating`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating: finalRating }),
        });
        if (response.ok) {
          const updatedVinyl = await response.json();
          setUserRating(finalRating);
          
          // Update rating info
          if (updatedVinyl.ratings && updatedVinyl.ratings.length > 0) {
            const sum = updatedVinyl.ratings.reduce((acc: number, r: any) => acc + r.rating, 0);
            const average = Math.round((sum / updatedVinyl.ratings.length) * 10) / 10;
            setRatingInfo({ average, count: updatedVinyl.ratings.length });
          } else {
            setRatingInfo({ average: 0, count: 0 });
          }
        }
      } catch (error) {
        console.error("Error updating rating:", error);
      }
    } else {
      // For new vinyls, store in form data
      setFormData((prev) => ({
        ...prev,
        rating: finalRating,
      }));
      setUserRating(finalRating);
    }
  };


  useEffect(() => {
    setIsClient(true);
  }, []);

  const lookupEAN = async (ean: string) => {
    if (!ean || ean.trim().length < 8) {
      return null;
    }

    setLoadingEAN(true);

    try {
      const response = await fetch(`/api/ean-lookup?ean=${encodeURIComponent(ean)}`);

      if (response.ok) {
        const data = await response.json();
        const vinylData: VinylFormData = {
          ean: data.ean || ean,
          artist: data.artist || "",
          album: data.album || data.title || "",
          releaseDate: data.releaseDate || "",
          genre: data.genre || "",
          label: data.label || "",
          condition: "",
          notes: data.description || "",
          albumArt: data.image || "",
          rating: undefined,
          youtubeLink: "",
        };
        return vinylData;
      } else {
        const error = await response.json();
        console.error("EAN lookup error:", error);
        alert(error.error || `No product information found for EAN ${ean}. You can fill in the details manually.`);
        return null;
      }
    } catch (error) {
      console.error("Error looking up EAN:", error);
      alert("Failed to fetch product information. You can fill in the details manually.");
      return null;
    } finally {
      setLoadingEAN(false);
    }
  };

  const handleBarcodeScanned = async (ean: string) => {
    setShowScanner(false);
    const vinylData = await lookupEAN(ean);
    
    if (vinylData) {
      // If we're adding a new vinyl (not editing), show choice dialog
      if (!vinyl) {
        setScannedVinylData(vinylData);
        setShowChoiceDialog(true);
      } else {
        // If editing, just fill the form
        setFormData((prev) => ({
          ...prev,
          ...vinylData,
        }));
      }
    }
  };

  const handleAddToCollection = async () => {
    if (!scannedVinylData) return;
    
    // Check if this vinyl is already in bookmarks and remove it
    if (session?.user?.id) {
      try {
        // First check if vinyl exists
        const vinylsResponse = await fetch("/api/vinyls?mode=public");
        if (vinylsResponse.ok) {
          const vinyls = await vinylsResponse.json();
          const existingVinyl = vinyls.find((v: Vinyl) => v.ean === scannedVinylData.ean);
          
          if (existingVinyl) {
            // Check if it's bookmarked and remove it
            const bookmarkCheckResponse = await fetch(`/api/bookmarks/check?vinylId=${existingVinyl.id}`);
            if (bookmarkCheckResponse.ok) {
              const { bookmarked } = await bookmarkCheckResponse.json();
              if (bookmarked) {
                await fetch(`/api/bookmarks?vinylId=${existingVinyl.id}`, {
                  method: "DELETE",
                });
              }
            }
          }
        }
      } catch (error) {
        // Ignore errors when checking/removing bookmarks
        console.error("Error checking/removing bookmark:", error);
      }
    }
    
    setFormData((prev) => ({
      ...prev,
      ...scannedVinylData,
    }));
    setShowChoiceDialog(false);
    setScannedVinylData(null);
  };

  const handleAddToBookmarks = async () => {
    if (!scannedVinylData) return;

    // Check if user is logged in
    if (!session?.user?.id) {
      // Store EAN in localStorage for later processing after login
      const pendingEANs = JSON.parse(localStorage.getItem("pendingBookmarkEANs") || "[]");
      if (!pendingEANs.find((item: any) => item.ean === scannedVinylData.ean)) {
        pendingEANs.push({
          ean: scannedVinylData.ean,
          data: scannedVinylData,
        });
        localStorage.setItem("pendingBookmarkEANs", JSON.stringify(pendingEANs));
      }
      alert("Please sign in to add bookmarks. Your selection will be saved.");
      router.push("/login");
      return;
    }

    try {
      // First, check if vinyl already exists
      const vinylsResponse = await fetch("/api/vinyls?mode=public");
      if (vinylsResponse.ok) {
        const vinyls = await vinylsResponse.json();
        const existingVinyl = vinyls.find((v: Vinyl) => v.ean === scannedVinylData.ean);
        
        if (existingVinyl) {
          // Check if vinyl is already in user's collection
          const isInCollection = existingVinyl.userId === session.user.id || 
                                 existingVinyl.owners?.some((o: { userId: string; username: string; addedAt: string }) => o.userId === session.user.id);
          
          if (isInCollection) {
            alert("This vinyl is already in your collection. Remove it from your collection first to add it to bookmarks.");
            setShowChoiceDialog(false);
            setScannedVinylData(null);
            return;
          }
          
          // Add existing vinyl to bookmarks
          const bookmarkResponse = await fetch("/api/bookmarks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vinylId: existingVinyl.id }),
          });

          if (bookmarkResponse.ok) {
            alert("Vinyl added to bookmarks!");
            setShowChoiceDialog(false);
            setScannedVinylData(null);
            onCancel(); // Close the form
          } else {
            const error = await bookmarkResponse.json();
            alert(error.error || "Failed to add to bookmarks");
          }
        } else {
          // Create vinyl without owner (for bookmarks only), then add to bookmarks
          const createResponse = await fetch("/api/vinyls/bookmark", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(scannedVinylData),
          });

          if (createResponse.ok) {
            const newVinyl = await createResponse.json();
            const bookmarkResponse = await fetch("/api/bookmarks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ vinylId: newVinyl.id }),
            });

            if (bookmarkResponse.ok) {
              alert("Vinyl added to bookmarks!");
              setShowChoiceDialog(false);
              setScannedVinylData(null);
              onCancel(); // Close the form
            } else {
              const error = await bookmarkResponse.json();
              alert(error.error || "Failed to add to bookmarks");
            }
          } else {
            const error = await createResponse.json();
            alert(error.error || "Failed to create vinyl");
          }
        }
      }
    } catch (error) {
      console.error("Error adding to bookmarks:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleEANLookup = async () => {
    if (!formData.ean || formData.ean.trim().length < 8) {
      alert("Please enter a valid EAN number (8-13 digits)");
      return;
    }
    await lookupEAN(formData.ean);
  };

  return (
    <React.Fragment>
      {showScanner && isClient && (
        <BarcodeScanner
          onScanSuccess={handleBarcodeScanned}
          onClose={() => setShowScanner(false)}
        />
      )}
      {showChoiceDialog && scannedVinylData && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Add to Collection or Bookmarks?
            </h3>
            {scannedVinylData.albumArt && (
              <div className="mb-4 relative w-full h-48 rounded-lg overflow-hidden">
                <Image
                  src={scannedVinylData.albumArt}
                  alt={scannedVinylData.album || "Album cover"}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            <div className="mb-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Artist</p>
              <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {scannedVinylData.artist || "Unknown"}
              </p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Album</p>
              <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {scannedVinylData.album || "Unknown"}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleAddToCollection}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Add to Collection
              </button>
              <button
                onClick={handleAddToBookmarks}
                className="w-full px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
              >
                Add to Bookmarks
              </button>
              <button
                onClick={() => {
                  setShowChoiceDialog(false);
                  setScannedVinylData(null);
                }}
                className="w-full px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 z-50 p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 pr-8">
            {readOnly ? "Vinyl Details" : vinyl ? "Edit Vinyl" : "Add New Vinyl"}
          </h2>
          {vinyl && (
            <div className="mb-4 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
              {vinyl.owners && vinyl.owners.length > 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {vinyl.owners.length === 1 ? (
                    <>Owned by <span className="font-semibold text-slate-900 dark:text-slate-100">{vinyl.owners[0].username}</span></>
                  ) : (
                    <>
                      Owned by {vinyl.owners.map((o, idx) => (
                        <span key={o.userId}>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{o.username}</span>
                          {idx < vinyl.owners!.length - 1 && ", "}
                        </span>
                      ))} ({vinyl.owners.length} owners)
                    </>
                  )}
                </p>
              ) : vinyl.username ? (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Owned by <span className="font-semibold text-slate-900 dark:text-slate-100">{vinyl.username}</span>
                </p>
              ) : null}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Artist *
                </label>
                <input
                  type="text"
                  name="artist"
                  value={formData.artist}
                  onChange={handleChange}
                  required={!readOnly}
                  disabled={readOnly}
                  readOnly={readOnly}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Album *
                </label>
                <input
                  type="text"
                  name="album"
                  value={formData.album}
                  onChange={handleChange}
                  required={!readOnly}
                  disabled={readOnly}
                  readOnly={readOnly}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Release Date
                </label>
                <input
                  type="date"
                  name="releaseDate"
                  value={formData.releaseDate || ""}
                  onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]}
                  disabled={readOnly}
                  readOnly={readOnly}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    EAN Number
                  </label>
                  <div className="flex gap-2">
                    {!readOnly && (
                    <>
                      <button
                        type="button"
                        onClick={handleEANLookup}
                        disabled={loadingEAN || !formData.ean || formData.ean.trim().length < 8}
                        className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center gap-1"
                      >
                        <svg
                          className="w-3 h-3"
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
                        {loadingEAN ? "Recherche..." : "Rechercher"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowScanner(true)}
                        className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors flex items-center gap-1"
                      >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                        />
                      </svg>
                      Scanner
                    </button>
                    </>
                  )}
                  </div>
                </div>
                <input
                  type="text"
                  name="ean"
                  value={formData.ean}
                  onChange={handleChange}
                  onKeyDown={(e) => {
                    if (!readOnly && e.key === 'Enter' && formData.ean && formData.ean.trim().length >= 8) {
                      e.preventDefault();
                      handleEANLookup();
                    }
                  }}
                  placeholder="EAN-13 or UPC (then click Rechercher)"
                  disabled={loadingEAN || readOnly}
                  readOnly={readOnly}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
                {loadingEAN && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Recherche des informations du produit...
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Genre
                </label>
                <input
                  type="text"
                  name="genre"
                  value={formData.genre}
                  onChange={handleChange}
                  disabled={readOnly}
                  readOnly={readOnly}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  name="label"
                  value={formData.label}
                  onChange={handleChange}
                  disabled={readOnly}
                  readOnly={readOnly}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Condition
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="">Select condition</option>
                  <option value="Mint">Mint</option>
                  <option value="Near Mint">Near Mint</option>
                  <option value="Very Good">Very Good</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Album Art URL
              </label>
              <input
                type="url"
                name="albumArt"
                value={formData.albumArt}
                onChange={handleChange}
                placeholder="https://example.com/album-cover.jpg"
                disabled={readOnly}
                readOnly={readOnly}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Rating
              </label>
              {readOnly && ratingInfo.count > 0 ? (
                <div>
                  <StarRating
                    rating={ratingInfo.average}
                    readonly={true}
                    size="lg"
                    reviewCount={ratingInfo.count}
                  />
                  {session?.user?.id && (
                    <div className="mt-2">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Your rating:</p>
                      <StarRating
                        rating={userRating || 0}
                        onRatingChange={handleRatingChange}
                        size="md"
                        readonly={false}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <StarRating
                  rating={userRating || formData.rating || 0}
                  onRatingChange={readOnly ? undefined : handleRatingChange}
                  size="lg"
                  readonly={readOnly}
                  reviewCount={ratingInfo.count > 0 ? ratingInfo.count : undefined}
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                YouTube Link
              </label>
              <input
                type="url"
                name="youtubeLink"
                value={formData.youtubeLink}
                onChange={handleChange}
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={readOnly}
                readOnly={readOnly}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Notes
                </label>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={fetchWikipediaContent}
                    disabled={loadingWikipedia || !formData.artist || !formData.album}
                    className="text-xs px-3 py-1 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingWikipedia ? "Loading..." : "Fetch from Wikipedia"}
                  </button>
                )}
              </div>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                disabled={readOnly}
                readOnly={readOnly}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="Add notes or fetch from Wikipedia..."
              />
            </div>
            <div className="flex gap-3 pt-4">
              {!readOnly && (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                >
                  {loading ? "Saving..." : vinyl ? "Update" : "Add Vinyl"}
                </button>
              )}
              <button
                type="button"
                onClick={onCancel}
                className={`${readOnly ? 'w-full' : 'flex-1'} px-4 py-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 text-slate-900 dark:text-slate-100 rounded-lg font-medium transition-colors`}
              >
                {readOnly ? "Close" : "Cancel"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </React.Fragment>
  );
}


