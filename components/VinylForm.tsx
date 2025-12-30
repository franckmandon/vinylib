"use client";

import React, { useState, useEffect } from "react";
import { Vinyl, VinylFormData } from "@/types/vinyl";
import StarRating from "./StarRating";
import BarcodeScanner from "./BarcodeScanner";

interface VinylFormProps {
  vinyl?: Vinyl | null;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function VinylForm({ vinyl, onSubmit, onCancel }: VinylFormProps) {
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
    }
  }, [vinyl]);

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

  const handleRatingChange = (rating: number) => {
    setFormData((prev) => ({
      ...prev,
      rating,
    }));
  };


  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleBarcodeScanned = async (ean: string) => {
    setShowScanner(false);
    setLoadingEAN(true);

    try {
      const response = await fetch(`/api/ean-lookup?ean=${encodeURIComponent(ean)}`);

      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({
          ...prev,
          ean: data.ean || prev.ean,
          artist: data.artist || prev.artist,
          album: data.album || data.title || prev.album,
          albumArt: data.image || prev.albumArt,
          notes: data.description || prev.notes,
        }));
      } else {
        const error = await response.json();
        // Still set the EAN even if lookup fails
        setFormData((prev) => ({
          ...prev,
          ean: ean,
        }));
        alert(error.error || "EAN scanned but no product information found. You can fill in the details manually.");
      }
    } catch (error) {
      console.error("Error looking up EAN:", error);
      // Still set the EAN even if lookup fails
      setFormData((prev) => ({
        ...prev,
        ean: ean,
      }));
      alert("EAN scanned but failed to fetch product information. You can fill in the details manually.");
    } finally {
      setLoadingEAN(false);
    }
  };

  return (
    <React.Fragment>
      {showScanner && isClient && (
        <BarcodeScanner
          onScanSuccess={handleBarcodeScanned}
          onClose={() => setShowScanner(false)}
        />
      )}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            {vinyl ? "Edit Vinyl" : "Add New Vinyl"}
          </h2>
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
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    EAN Number
                  </label>
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
                    Scan Barcode
                  </button>
                </div>
                <input
                  type="text"
                  name="ean"
                  value={formData.ean}
                  onChange={handleChange}
                  placeholder="EAN-13 or UPC"
                  disabled={loadingEAN}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                {loadingEAN && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Looking up product information...
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
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Rating
              </label>
              <StarRating
                rating={formData.rating || 0}
                onRatingChange={handleRatingChange}
                size="lg"
              />
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
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Notes
                </label>
                <button
                  type="button"
                  onClick={fetchWikipediaContent}
                  disabled={loadingWikipedia || !formData.artist || !formData.album}
                  className="text-xs px-3 py-1 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingWikipedia ? "Loading..." : "Fetch from Wikipedia"}
                </button>
              </div>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add notes or fetch from Wikipedia..."
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
              >
                {loading ? "Saving..." : vinyl ? "Update" : "Add Vinyl"}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 text-slate-900 dark:text-slate-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </React.Fragment>
  );
}


