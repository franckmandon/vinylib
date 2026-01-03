"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Vinyl, VinylFormData } from "@/types/vinyl";
import StarRating from "./StarRating";
import BarcodeScanner from "./BarcodeScanner";
import { useReCaptcha } from "@/hooks/useReCaptcha";

interface VinylFormProps {
  vinyl?: Vinyl | null;
  onSubmit: () => void;
  onCancel: () => void;
  readOnly?: boolean; // If true, form is in view-only mode
  onSelectVinyl?: (vinylId: string) => void; // Callback to select another vinyl
}

export default function VinylForm({ vinyl, onSubmit, onCancel, readOnly = false, onSelectVinyl }: VinylFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
  const { executeRecaptcha } = useReCaptcha(siteKey);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<VinylFormData>({
    artist: "",
    album: "",
    releaseDate: "",
    genre: "",
    label: "",
    condition: "",
    notes: "",
    artistBio: "",
    purchasePrice: undefined,
    addedAt: "",
    albumArt: "",
    ean: "",
    rating: undefined,
    spotifyLink: "",
    trackList: undefined,
    country: "",
    credits: "",
    pressingType: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [loadingWikipedia, setLoadingWikipedia] = useState(false);
  const [loadingWikipediaArtist, setLoadingWikipediaArtist] = useState(false);
  const [loadingWikipediaCredits, setLoadingWikipediaCredits] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [loadingEAN, setLoadingEAN] = useState(false);
  const [otherAlbums, setOtherAlbums] = useState<Array<{ id: string; album: string; albumArt?: string }>>([]);
  const [loadingOtherAlbums, setLoadingOtherAlbums] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showChoiceDialog, setShowChoiceDialog] = useState(false);
  const [scannedVinylData, setScannedVinylData] = useState<VinylFormData | null>(null);
  const [isLoadingAfterScan, setIsLoadingAfterScan] = useState(false);
  const [userRating, setUserRating] = useState<number | undefined>(undefined);
  const [ratingInfo, setRatingInfo] = useState<{ average: number; count: number }>({ average: 0, count: 0 });
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    if (vinyl) {
      // Get user's condition from owners array if available
      let userCondition = "";
      let userPurchasePrice: number | undefined = undefined;
      let userAddedAt = "";
      if (session?.user?.id && vinyl.owners) {
        const userOwner = vinyl.owners.find(o => o.userId === session.user.id);
        userCondition = userOwner?.condition || "";
        userPurchasePrice = userOwner?.purchasePrice;
        userAddedAt = userOwner?.addedAt || "";
      } else if (session?.user?.id && vinyl.userId === session.user.id) {
        // Fallback to vinyl.condition for backward compatibility
        userCondition = vinyl.condition || "";
        // For backward compatibility, use createdAt as addedAt
        userAddedAt = vinyl.createdAt || "";
      }
      
      setFormData({
        artist: vinyl.artist,
        album: vinyl.album,
        releaseDate: vinyl.releaseDate || "",
        genre: vinyl.genre || "",
        label: vinyl.label || "",
        condition: userCondition,
        notes: vinyl.notes || "", // Always show the general description (vinyl.notes), visible to all users
        artistBio: vinyl.artistBio || "",
        purchasePrice: userPurchasePrice,
        addedAt: userAddedAt,
        albumArt: vinyl.albumArt || "",
        ean: vinyl.ean || "",
        rating: vinyl.rating,
        spotifyLink: vinyl.spotifyLink || "",
        trackList: vinyl.trackList || undefined,
        country: vinyl.country || "",
        credits: vinyl.credits || "",
        pressingType: vinyl.pressingType || undefined,
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

  // Check if user owns this vinyl
  const isOwner = vinyl && session?.user?.id && (
    vinyl.userId === session.user.id ||
    vinyl.owners?.some(o => o.userId === session.user.id)
  );

  // Determine if we're in edit mode (either not readOnly, or readOnly but isEditing)
  const isEditMode = !readOnly || (readOnly && isEditing);

  // Reset isEditing when vinyl changes
  useEffect(() => {
    if (vinyl?.id) {
      setIsEditing(false);
    }
  }, [vinyl?.id]);

  const handleDelete = async () => {
    if (!vinyl?.id || !session?.user?.id) return;
    
    if (!confirm("Are you sure you want to delete this vinyl from your collection?")) {
      return;
    }

    try {
      const response = await fetch(`/api/vinyls?id=${vinyl.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onSubmit(); // Close form and refresh
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete vinyl");
      }
    } catch (error) {
      console.error("Error deleting vinyl:", error);
      alert("Failed to delete vinyl");
    }
  };

  // Check if vinyl is bookmarked
  useEffect(() => {
    if (!vinyl?.id) {
      setIsBookmarked(false);
      return;
    }

    if (!session?.user?.id) {
      // For non-logged in users, check localStorage
      if (readOnly) {
        const pendingBookmarks = JSON.parse(localStorage.getItem("pendingBookmarks") || "[]");
        setIsBookmarked(pendingBookmarks.includes(vinyl.id));
      } else {
        setIsBookmarked(false);
      }
    } else {
      // For logged in users, check API
      if (readOnly && !isOwner) {
        fetch(`/api/bookmarks/check?vinylId=${vinyl.id}`)
          .then(res => res.json())
          .then(data => setIsBookmarked(data.bookmarked))
          .catch(() => setIsBookmarked(false));
      } else {
        setIsBookmarked(false);
      }
    }
  }, [vinyl?.id, readOnly, session?.user?.id, isOwner]);

  const fetchWikipediaContent = async (silent = false) => {
    if (!formData.artist || !formData.album) {
      if (!silent) {
        alert("Please enter both artist and album before fetching Wikipedia content");
      }
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
          if (!silent) {
            alert(error.error || "Failed to fetch Wikipedia content");
          }
        }
    } catch (error) {
      console.error("Error fetching Wikipedia content:", error);
      if (!silent) {
        alert("Failed to fetch Wikipedia content");
      }
    } finally {
      setLoadingWikipedia(false);
    }
  };

  // Auto-fetch Wikipedia description when artist and album are available
  const autoFetchWikipediaDescription = async (artist: string, album: string) => {
    if (!artist || !album) return;
    
    // Only fetch if notes is empty or very short
    if (formData.notes && formData.notes.trim().length > 50) return;
    
    setLoadingWikipedia(true);
    try {
      const response = await fetch(
        `/api/wikipedia?artist=${encodeURIComponent(artist)}&album=${encodeURIComponent(album)}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          setFormData((prev) => ({
            ...prev,
            notes: data.content,
          }));
        }
      }
    } catch (error) {
      console.error("Error auto-fetching Wikipedia content:", error);
      // Silent fail for auto-fetch
    } finally {
      setLoadingWikipedia(false);
    }
  };

  const fetchWikipediaArtistBio = async () => {
    if (!formData.artist) {
      alert("Please enter an artist name before fetching Wikipedia content");
      return;
    }

    setLoadingWikipediaArtist(true);
    try {
      const response = await fetch(
        `/api/wikipedia-artist?artist=${encodeURIComponent(formData.artist)}`
      );

      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({
          ...prev,
          artistBio: data.content || prev.artistBio,
        }));
      } else {
        const error = await response.json();
        alert(error.error || "Failed to fetch Wikipedia content");
      }
    } catch (error) {
      console.error("Error fetching Wikipedia artist bio:", error);
      alert("Failed to fetch Wikipedia content");
    } finally {
      setLoadingWikipediaArtist(false);
    }
  };

  const fetchWikipediaCredits = async () => {
    if (!formData.artist || !formData.album) {
      alert("Please enter both artist and album before fetching Wikipedia credits");
      return;
    }

    setLoadingWikipediaCredits(true);
    try {
      const response = await fetch(
        `/api/wikipedia-credits?artist=${encodeURIComponent(formData.artist)}&album=${encodeURIComponent(formData.album)}`
      );

      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({
          ...prev,
          credits: data.credits || prev.credits,
        }));
      } else {
        const error = await response.json();
        alert(error.error || "Failed to fetch Wikipedia credits");
      }
    } catch (error) {
      console.error("Error fetching Wikipedia credits:", error);
      alert("Failed to fetch Wikipedia credits");
    } finally {
      setLoadingWikipediaCredits(false);
    }
  };

  // Fetch other albums by the same artist
  useEffect(() => {
    const fetchOtherAlbums = async () => {
      if (!formData.artist || !session?.user?.id) return;
      
      setLoadingOtherAlbums(true);
      try {
        const response = await fetch(`/api/vinyls?mode=public`);
        if (response.ok) {
          const allVinyls: Vinyl[] = await response.json();
          // Filter albums by the same artist, excluding the current vinyl
          const sameArtistAlbums = allVinyls
            .filter(v => 
              v.artist.toLowerCase() === formData.artist.toLowerCase() &&
              (!vinyl || v.id !== vinyl.id)
            )
            .map(v => ({
              id: v.id,
              album: v.album,
              albumArt: v.albumArt,
            }))
            .slice(0, 10); // Limit to 10 albums
          
          setOtherAlbums(sameArtistAlbums);
        }
      } catch (error) {
        console.error("Error fetching other albums:", error);
      } finally {
        setLoadingOtherAlbums(false);
      }
    };

    if (formData.artist && session?.user?.id) {
      fetchOtherAlbums();
    } else {
      setOtherAlbums([]);
    }
  }, [formData.artist, vinyl, session?.user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Execute reCAPTCHA only for new vinyls (POST), not for updates (PUT)
      let recaptchaToken: string | null = null;
      if (!vinyl && siteKey) {
        try {
          recaptchaToken = await executeRecaptcha("add_vinyl");
          console.log("[vinyl-form] reCAPTCHA token obtained");
        } catch (recaptchaError) {
          console.error("[vinyl-form] reCAPTCHA error:", recaptchaError);
          alert("reCAPTCHA verification failed. Please try again.");
          setLoading(false);
          return;
        }
      }

      const url = "/api/vinyls";
      const method = vinyl ? "PUT" : "POST";
      const body = vinyl
        ? { id: vinyl.id, ...formData }
        : { ...formData, recaptchaToken: recaptchaToken || undefined };

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

  const handleTrackListChange = (index: number, field: 'title' | 'duration' | 'spotifyLink', value: string) => {
    if (!formData.trackList) return;
    const updatedTrackList = [...formData.trackList];
    updatedTrackList[index] = {
      ...updatedTrackList[index],
      [field]: value,
    };
    setFormData((prev) => ({
      ...prev,
      trackList: updatedTrackList,
    }));
  };

  const handleAddTrack = () => {
    const newTrack = { title: "", duration: "", spotifyLink: "" };
    setFormData((prev) => ({
      ...prev,
      trackList: [...(prev.trackList || []), newTrack],
    }));
  };

  const handleRemoveTrack = (index: number) => {
    if (!formData.trackList) return;
    const updatedTrackList = formData.trackList.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      trackList: updatedTrackList.length > 0 ? updatedTrackList : undefined,
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
          spotifyLink: "",
          trackList: data.trackList || undefined,
          country: data.country || "",
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
    setIsLoadingAfterScan(true);
    
    try {
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
          // Auto-fetch Wikipedia description if artist and album are available
          if (vinylData.artist && vinylData.album) {
            await autoFetchWikipediaDescription(vinylData.artist, vinylData.album);
          }
        }
      }
    } finally {
      setIsLoadingAfterScan(false);
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
    const vinylData = await lookupEAN(formData.ean);
    if (vinylData) {
      setFormData((prev) => ({
        ...prev,
        ...vinylData,
      }));
      // Auto-fetch Wikipedia description if artist and album are available
      if (vinylData.artist && vinylData.album) {
        await autoFetchWikipediaDescription(vinylData.artist, vinylData.album);
      }
    }
  };

  const handleShare = () => {
    if (!vinyl?.id) return;
    
    const shareUrl = `${window.location.origin}/?vinylId=${vinyl.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: `${vinyl.artist} - ${vinyl.album}`,
        text: `Check out ${vinyl.artist} - ${vinyl.album} on Vinyl Report!`,
        url: shareUrl,
      }).catch((error) => {
        console.error("Error sharing:", error);
        copyToClipboard(shareUrl);
      });
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Link copied to clipboard!");
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        alert("Link copied to clipboard!");
      } catch (err) {
        alert("Failed to copy link. Please copy manually: " + text);
      }
      document.body.removeChild(textArea);
    });
  };

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!vinyl?.id) return;
    
    if (!session?.user?.id) {
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

  return (
    <React.Fragment>
      {showScanner && isClient && (
        <BarcodeScanner
          onScanSuccess={handleBarcodeScanned}
          onClose={() => setShowScanner(false)}
        />
      )}
      {isLoadingAfterScan && !showChoiceDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-8 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mb-4" style={{ borderColor: 'rgb(83 74 211)' }}></div>
            <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
              Fetching vinyl information...
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Please wait while we retrieve the album details
            </p>
          </div>
        </div>
      )}
      {loadingEAN && !isLoadingAfterScan && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-8 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mb-4" style={{ borderColor: 'rgb(83 74 211)' }}></div>
            <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
              Searching for product information...
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Please wait while we retrieve the album details from EAN database
            </p>
          </div>
        </div>
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
                className="w-full px-4 py-3 text-white rounded-lg font-medium transition-colors"
                style={{ backgroundColor: '#534AD3' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4338A8'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#534AD3'}
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
            {isEditMode ? (vinyl ? "Edit Vinyl" : "Add New Vinyl") : "Vinyl Details"}
          </h2>
          {formData.albumArt && (
            <div className="mb-6 flex justify-center">
              <div className="relative w-64 h-64 rounded-lg overflow-hidden shadow-lg">
                <Image
                  src={formData.albumArt}
                  alt={`${formData.artist} - ${formData.album}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
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
                  required={isEditMode}
                  disabled={!isEditMode}
                  readOnly={!isEditMode}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
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
                  required={isEditMode}
                  disabled={!isEditMode}
                  readOnly={!isEditMode}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
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
                  disabled={!isEditMode}
                  readOnly={!isEditMode}
                  className={`w-full border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${!isEditMode ? 'px-3 py-2 md:h-[42px] md:px-4 md:pr-10 md:text-sm' : 'h-[42px] px-4 pr-10 text-sm'}`}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    EAN Number
                  </label>
                  <div className="flex gap-2">
                    {isEditMode && (!vinyl || !vinyl.ean || !vinyl.ean.trim()) && (
                    <>
                      <button
                        type="button"
                        onClick={handleEANLookup}
                        disabled={loadingEAN || !formData.ean || formData.ean.trim().length < 8}
                        className="text-xs px-3 py-1 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center gap-1"
                        style={{ backgroundColor: '#534AD3' }}
                        onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#4338A8')}
                        onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#534AD3')}
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
                        {loadingEAN ? "Searching..." : "Infos"}
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
                    if (isEditMode && e.key === 'Enter' && formData.ean && formData.ean.trim().length >= 8) {
                      e.preventDefault();
                      handleEANLookup();
                    }
                  }}
                  placeholder="EAN-13 or UPC (then click Infos)"
                  disabled={loadingEAN || readOnly}
                  readOnly={readOnly}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                />
                {loadingEAN && (
                  <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: 'rgb(83 74 211)' }}>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Searching for product information...</span>
                  </div>
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
                  disabled={!isEditMode}
                  readOnly={!isEditMode}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
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
                  disabled={!isEditMode}
                  readOnly={!isEditMode}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
              {session?.user?.id && isOwner && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Condition
                    </label>
                    {isEditMode ? (
                      <div className="relative">
                        <select
                          name="condition"
                          value={formData.condition}
                          onChange={handleChange}
                          className="w-full h-[42px] px-4 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none appearance-none text-sm"
                        >
                          <option value="">Select condition</option>
                          <option value="Mint">Mint</option>
                          <option value="Near Mint">Near Mint</option>
                          <option value="Very Good">Very Good</option>
                          <option value="Good">Good</option>
                          <option value="Fair">Fair</option>
                          <option value="Poor">Poor</option>
                        </select>
                        <svg
                          className="absolute right-3 top-2.5 w-5 h-5 text-slate-400 pointer-events-none"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={formData.condition || "Not specified"}
                        disabled
                        readOnly
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Purchase Price (in Euros)
                    </label>
                    {isEditMode ? (
                      <input
                        type="number"
                        name="purchasePrice"
                        value={formData.purchasePrice || ""}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    ) : (
                      <input
                        type="text"
                        value={formData.purchasePrice ? `${formData.purchasePrice.toFixed(2)} €` : "Not specified"}
                        disabled
                        readOnly
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Date Added
                    </label>
                    {isEditMode ? (
                      <input
                        type="date"
                        name="addedAt"
                        value={formData.addedAt ? formData.addedAt.split('T')[0] : ""}
                        onChange={(e) => {
                          const dateValue = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            addedAt: dateValue ? new Date(dateValue).toISOString() : ""
                          }));
                        }}
                        max={new Date().toISOString().split("T")[0]}
                        className="w-full h-[42px] px-4 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                      />
                    ) : (
                      <input
                        type="text"
                        value={formData.addedAt ? new Date(formData.addedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        }) : "Not specified"}
                        disabled
                        readOnly
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    )}
                  </div>
                </>
              )}
            </div>
            {isEditMode && (
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
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
            )}
              {!isEditMode && !session?.user?.id ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Average rating
                  </label>
                  {ratingInfo.count > 0 ? (
                    <StarRating
                      rating={ratingInfo.average}
                      readonly={true}
                      size="lg"
                      reviewCount={ratingInfo.count}
                    />
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No ratings yet</p>
                  )}
                </div>
                {formData.spotifyLink && formData.spotifyLink.includes('open.spotify.com') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Spotify Link
                    </label>
                    <a
                      href={formData.spotifyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:underline"
                      style={{ color: '#10d05b' }}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.66 0-.359.24-.66.54-.779 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                      Listen the LP on Spotify
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Average rating
                    </label>
                    {!isEditMode ? (
                      // Mode lecture : afficher la moyenne des ratings
                      <div>
                        <StarRating
                          rating={ratingInfo.average}
                          readonly={true}
                          size="lg"
                          reviewCount={ratingInfo.count > 0 ? ratingInfo.count : undefined}
                        />
                        {session?.user?.id && userRating !== undefined && (
                          <div className="mt-2">
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Your rating:</p>
                            <StarRating
                              rating={userRating}
                              readonly={true}
                              size="md"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      // Mode édition : permettre à l'utilisateur connecté de modifier son rating
                      session?.user?.id ? (
                        <div>
                          {ratingInfo.count > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Average rating:</p>
                              <StarRating
                                rating={ratingInfo.average}
                                readonly={true}
                                size="md"
                                reviewCount={ratingInfo.count}
                              />
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Your rating:</p>
                            <StarRating
                              rating={userRating || formData.rating || 0}
                              onRatingChange={handleRatingChange}
                              size="lg"
                              readonly={false}
                            />
                          </div>
                        </div>
                      ) : (
                        <StarRating
                          rating={ratingInfo.average}
                          readonly={true}
                          size="lg"
                          reviewCount={ratingInfo.count > 0 ? ratingInfo.count : undefined}
                        />
                      )
                    )}
                  </div>
                  <div className="flex-1">
                    {!isEditMode ? (
                      // Mode lecture : afficher le lien si disponible
                      formData.spotifyLink && formData.spotifyLink.includes('open.spotify.com') ? (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Spotify Link
                          </label>
                          <a
                            href={formData.spotifyLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm hover:underline"
                            style={{ color: '#10d05b' }}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.66 0-.359.24-.66.54-.779 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                            </svg>
                            Listen the LP on Spotify
                          </a>
                        </div>
                      ) : null
                    ) : (
                      // Mode édition : toujours afficher le champ input
                      <>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Spotify Link
                        </label>
                        <input
                          type="url"
                          name="spotifyLink"
                          value={formData.spotifyLink}
                          onChange={handleChange}
                          placeholder="https://open.spotify.com/album/..."
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
                        />
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Artist Bio
                </label>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={fetchWikipediaArtistBio}
                    disabled={loadingWikipediaArtist || !formData.artist}
                    className="text-xs px-3 py-1 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingWikipediaArtist ? "Loading..." : "Fetch from Wikipedia"}
                  </button>
                )}
              </div>
              <textarea
                name="artistBio"
                value={formData.artistBio}
                onChange={handleChange}
                rows={4}
                disabled={!isEditMode}
                readOnly={!isEditMode}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="Add artist bio or fetch from Wikipedia..."
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Description
                </label>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => fetchWikipediaContent(false)}
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
                disabled={!isEditMode}
                readOnly={!isEditMode}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="Add notes or fetch from Wikipedia..."
              />
            </div>
            {session?.user?.id && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Country of Origin
                    </label>
                    {isEditMode ? (
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        placeholder="e.g., US, UK, France"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    ) : (
                      <input
                        type="text"
                        value={formData.country || "Not specified"}
                        disabled
                        readOnly
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Pressing Type
                    </label>
                    {isEditMode ? (
                      <div className="relative">
                        <select
                          name="pressingType"
                          value={formData.pressingType || ""}
                          onChange={handleChange}
                          className="w-full h-[42px] px-4 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none appearance-none text-sm"
                        >
                          <option value="">Select pressing type</option>
                          <option value="original">Original Pressing</option>
                          <option value="reissue">Reissue</option>
                        </select>
                        <svg
                          className="absolute right-3 top-2.5 w-5 h-5 text-slate-400 pointer-events-none"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={formData.pressingType === "original" ? "Original Pressing" : formData.pressingType === "reissue" ? "Reissue" : "Not specified"}
                        disabled
                        readOnly
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Credits
                    </label>
                    {isEditMode && (
                      <button
                        type="button"
                        onClick={fetchWikipediaCredits}
                        disabled={loadingWikipediaCredits || !formData.artist || !formData.album}
                        className="text-xs px-3 py-1 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingWikipediaCredits ? "Loading..." : "Fetch from Wikipedia"}
                      </button>
                    )}
                  </div>
                  <textarea
                    name="credits"
                    value={formData.credits}
                    onChange={handleChange}
                    rows={4}
                    disabled={!isEditMode}
                    readOnly={!isEditMode}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed whitespace-pre-wrap"
                    placeholder="Add album credits or fetch from Wikipedia..."
                  />
                </div>
                {otherAlbums.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Other Albums by {formData.artist}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {otherAlbums.map((album) => (
                        <a
                          key={album.id}
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (onSelectVinyl) {
                              onSelectVinyl(album.id);
                            } else {
                              onCancel();
                              router.push(`/?vinylId=${album.id}`);
                            }
                          }}
                          className="group bg-slate-50 dark:bg-slate-900 rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <div className="aspect-square bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded overflow-hidden mb-2 relative">
                            {album.albumArt ? (
                              <Image
                                src={album.albumArt}
                                alt={album.album}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 50vw, 25vw"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs text-center p-2">
                                No Cover
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 transition-colors" style={{ '--hover-color': 'rgb(83 74 211)' } as React.CSSProperties}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(83 74 211)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = ''}>
                            {album.album}
                          </p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            {(formData.trackList && formData.trackList.length > 0) || isEditMode ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Track List
                  </label>
                  {isEditMode && (
                    <button
                      type="button"
                      onClick={handleAddTrack}
                      className="text-xs px-3 py-1 text-white rounded transition-colors"
                      style={{ backgroundColor: '#534AD3' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4338A8'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#534AD3'}
                    >
                      + Add Track
                    </button>
                  )}
                </div>
                {formData.trackList && formData.trackList.length > 0 ? (
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <div className="space-y-3">
                      {formData.trackList.map((track, index) => (
                        <div key={index} className="flex flex-col md:flex-row items-start gap-2 md:gap-3">
                          {!isEditMode ? (
                            <>
                              <div className="flex items-center justify-between gap-2 flex-1 min-w-0 w-full">
                                {track.spotifyLink && track.spotifyLink.includes('open.spotify.com') ? (
                                  <a
                                    href={track.spotifyLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 text-sm hover:underline min-w-0"
                                    style={{ color: '#10d05b' }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {track.title}
                                  </a>
                                ) : (
                                  <span className="flex-1 text-slate-900 dark:text-slate-100 text-sm min-w-0">
                                    {track.title}
                                  </span>
                                )}
                                {track.duration && (
                                  <span className="text-slate-500 dark:text-slate-400 min-w-[3rem] text-right text-sm flex-shrink-0">
                                    {track.duration}
                                  </span>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-start md:justify-center w-auto md:w-8 flex-shrink-0 self-start md:self-center">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                  <span className="md:hidden">Track </span>{index + 1}.
                                </span>
                              </div>
                              <div className="flex flex-col md:flex-row gap-2 flex-1 min-w-0 w-full">
                                <input
                                  type="text"
                                  value={track.title}
                                  onChange={(e) => handleTrackListChange(index, 'title', e.target.value)}
                                  placeholder="Track title"
                                  className="w-full md:flex-1 min-w-0 px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
                                />
                                <div className="flex gap-2 md:contents">
                                  <input
                                    type="text"
                                    value={track.duration || ""}
                                    onChange={(e) => handleTrackListChange(index, 'duration', e.target.value)}
                                    placeholder="3:45"
                                    className="w-1/4 md:w-20 px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
                                  />
                                  <input
                                    type="url"
                                    value={track.spotifyLink || ""}
                                    onChange={(e) => handleTrackListChange(index, 'spotifyLink', e.target.value)}
                                    placeholder="Spotify link"
                                    className="w-full md:w-48 min-w-0 px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveTrack(index)}
                                className="flex items-center gap-1 p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors flex-shrink-0"
                                aria-label="Remove track"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span className="text-sm md:hidden">Delete track</span>
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : isEditMode ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                    No tracks yet. Click &quot;Add Track&quot; to add one.
                  </p>
                ) : null}
              </div>
            ) : null}
            {vinyl && ((vinyl.owners && vinyl.owners.length > 0) || vinyl.username) && (
              <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
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
            <div className="flex gap-3 pt-4 items-center">
              {isEditMode ? (
                <>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors"
                    style={{ backgroundColor: '#534AD3' }}
                    onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#4338A8')}
                    onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#534AD3')}
                  >
                    {loading ? "Saving..." : vinyl ? "Update" : "Add Vinyl"}
                  </button>
                  {vinyl && isOwner && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (readOnly) {
                        setIsEditing(false);
                      } else {
                        onCancel();
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 text-slate-900 dark:text-slate-100 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  {/* Mode lecture */}
                  {readOnly && !isEditMode && (
                    <>
                      {/* Utilisateur connecté ET propriétaire : Edit + Close + Share */}
                      {session?.user?.id && isOwner && (
                        <>
                          <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors"
                            style={{ backgroundColor: 'rgb(83 74 211)' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4338A8'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(83 74 211)'}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 text-slate-900 dark:text-slate-100 rounded-lg font-medium transition-colors"
                          >
                            Close
                          </button>
                          <button
                            type="button"
                            onClick={handleShare}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Share this vinyl"
                            aria-label="Share this vinyl"
                          >
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              style={{ color: 'rgb(255 0 150)' }}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                              />
                            </svg>
                          </button>
                        </>
                      )}
                      {/* Utilisateur connecté MAIS NON propriétaire : Close + Bookmark + Share */}
                      {session?.user?.id && !isOwner && vinyl?.id && (
                        <div className="flex-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 text-slate-900 dark:text-slate-100 rounded-lg font-medium transition-colors"
                          >
                            Close
                          </button>
                          <button
                            type="button"
                            onClick={handleBookmarkClick}
                            disabled={isToggling}
                            className={`p-2 rounded transition-colors ${
                              isBookmarked
                                ? "text-white"
                                : "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            style={isBookmarked ? { backgroundColor: 'rgb(255 0 150)' } : undefined}
                            onMouseEnter={(e) => {
                              if (isBookmarked && !e.currentTarget.disabled) {
                                e.currentTarget.style.backgroundColor = 'rgb(200 0 120)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (isBookmarked && !e.currentTarget.disabled) {
                                e.currentTarget.style.backgroundColor = 'rgb(255 0 150)';
                              }
                            }}
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
                          <button
                            type="button"
                            onClick={handleShare}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Share this vinyl"
                            aria-label="Share this vinyl"
                          >
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              style={{ color: 'rgb(255 0 150)' }}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                      {/* Utilisateur NON connecté : Close + Bookmark */}
                      {!session?.user?.id && vinyl?.id && (
                        <div className="flex-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 text-slate-900 dark:text-slate-100 rounded-lg font-medium transition-colors"
                          >
                            Close
                          </button>
                          <button
                            type="button"
                            onClick={handleBookmarkClick}
                            disabled={isToggling}
                            className={`p-2 rounded transition-colors ${
                              isBookmarked
                                ? "text-white"
                                : "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            style={isBookmarked ? { backgroundColor: 'rgb(255 0 150)' } : undefined}
                            onMouseEnter={(e) => {
                              if (isBookmarked && !e.currentTarget.disabled) {
                                e.currentTarget.style.backgroundColor = 'rgb(200 0 120)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (isBookmarked && !e.currentTarget.disabled) {
                                e.currentTarget.style.backgroundColor = 'rgb(255 0 150)';
                              }
                            }}
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
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
            {/* Show reCAPTCHA notice only when adding new vinyl (not editing) */}
            {isEditMode && !vinyl && (
              <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
                Ce site est protégé par reCAPTCHA
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
    </React.Fragment>
  );
}


