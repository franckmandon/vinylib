import { NextRequest, NextResponse } from "next/server";
import { getDiscogsToken } from "@/lib/discogs-auth";

export const runtime = "nodejs";

interface EANLookupResult {
  ean: string;
  title?: string;
  artist?: string;
  album?: string;
  description?: string;
  image?: string;
  brand?: string;
  category?: string;
  genre?: string;
  label?: string;
  releaseDate?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ean = searchParams.get("ean");

  if (!ean) {
    return NextResponse.json(
      { error: "EAN number is required" },
      { status: 400 }
    );
  }

  // Clean the EAN (remove any non-digit characters)
  const cleanEAN = ean.replace(/\D/g, "");

  if (cleanEAN.length < 8 || cleanEAN.length > 13) {
    return NextResponse.json(
      { error: "Invalid EAN format. EAN should be 8-13 digits." },
      { status: 400 }
    );
  }

  try {
    // Try multiple EAN lookup services
    // 1. Open EAN Database (free, no API key required)
    let result: EANLookupResult | null = null;

    // Try Open EAN Database first
    try {
      const openEanUrl = `https://opengtindb.org/?ean=${cleanEAN}&cmd=query&queryid=400000000`;
      const response = await fetch(openEanUrl, {
        headers: {
          "User-Agent": "Vinyl Report Vinyl Library Manager/1.0",
        },
      });

      if (response.ok) {
        const text = await response.text();
        // Parse the response (Open EAN DB returns XML-like format)
        const nameMatch = text.match(/<name>(.*?)<\/name>/i);
        const detailMatch = text.match(/<detailname>(.*?)<\/detailname>/i);
        const descriptionMatch = text.match(/<descr>(.*?)<\/descr>/i);
        const imageMatch = text.match(/<image>(.*?)<\/image>/i);

        if (nameMatch || detailMatch) {
          const productName = detailMatch?.[1] || nameMatch?.[1] || "";
          
          // Try to extract artist and album from product name
          // Common formats: "Artist - Album", "Album by Artist", "Artist: Album", etc.
          let artist = "";
          let album = productName;

          // Try "Artist - Album" format (most common for music)
          if (productName.includes(" - ")) {
            const parts = productName.split(" - ");
            if (parts.length >= 2) {
              artist = parts[0].trim();
              album = parts.slice(1).join(" - ").trim();
            }
          }
          // Try "Artist: Album" format
          else if (productName.includes(": ")) {
            const parts = productName.split(": ");
            if (parts.length >= 2) {
              artist = parts[0].trim();
              album = parts.slice(1).join(": ").trim();
            }
          }
          // Try "Album by Artist" format
          else if (productName.toLowerCase().includes(" by ")) {
            const parts = productName.split(/ by /i);
            if (parts.length >= 2) {
              album = parts[0].trim();
              artist = parts.slice(1).join(" by ").trim();
            }
          }
          // Try "Artist / Album" format
          else if (productName.includes(" / ")) {
            const parts = productName.split(" / ");
            if (parts.length >= 2) {
              artist = parts[0].trim();
              album = parts.slice(1).join(" / ").trim();
            }
          }

          result = {
            ean: cleanEAN,
            title: productName,
            artist: artist || undefined,
            album: album !== productName ? album : undefined,
            description: descriptionMatch?.[1] || undefined,
            image: imageMatch?.[1] || undefined,
          };
        }
      }
    } catch (error) {
      console.error("Open EAN DB error:", error);
    }

    // If Open EAN DB didn't work, try Discogs API as fallback
    if (!result || (!result.title && !result.artist && !result.album)) {
      try {
        const { token, hasToken } = getDiscogsToken();
        
        if (hasToken) {
          // Search Discogs by barcode (EAN/UPC)
          const discogsUrl = `https://api.discogs.com/database/search?barcode=${cleanEAN}&type=release&token=${token}`;
          const discogsResponse = await fetch(discogsUrl, {
            headers: {
              "User-Agent": "Vinyl Report Vinyl Library Manager/1.0",
            },
          });

          if (discogsResponse.ok) {
            const discogsData = await discogsResponse.json();
            
            if (discogsData.results && discogsData.results.length > 0) {
              // Get the first result (most relevant)
              const release = discogsData.results[0];
              
              // Try to get more details from the release
              let releaseDetails = null;
              try {
                const detailsUrl = `https://api.discogs.com/releases/${release.id}?token=${token}`;
                const detailsResponse = await fetch(detailsUrl, {
                  headers: {
                    "User-Agent": "Vinyl Report Vinyl Library Manager/1.0",
                  },
                });
                if (detailsResponse.ok) {
                  releaseDetails = await detailsResponse.json();
                }
              } catch (error) {
                console.error("Error fetching Discogs release details:", error);
              }

              // Extract artist and title
              const artist = release.artist || (releaseDetails?.artists?.[0]?.name) || "";
              const album = release.title || releaseDetails?.title || "";
              const image = release.thumb || releaseDetails?.images?.[0]?.uri || releaseDetails?.images?.[0]?.resource_url || "";
              const description = releaseDetails?.notes || (releaseDetails?.genres?.length ? releaseDetails.genres.join(", ") : "") || "";
              const genre = (releaseDetails?.genres?.[0]) || (Array.isArray(release.genre) ? release.genre[0] : release.genre) || "";
              const label = releaseDetails?.labels?.[0]?.name || "";
              const releaseDate = releaseDetails?.released || (release.year ? release.year.toString() : "") || "";

              // If we have artist and album, use this result
              if (artist || album) {
                result = {
                  ean: cleanEAN,
                  artist: artist || undefined,
                  album: album || undefined,
                  title: album || artist || undefined,
                  image: image || undefined,
                  description: description || undefined,
                  genre: genre || undefined,
                  label: label || undefined,
                  releaseDate: releaseDate || undefined,
                };
              }
            }
          }
        }
      } catch (error) {
        console.error("Discogs API error:", error);
      }
    }

    if (!result.title && !result.artist && !result.album) {
      return NextResponse.json(
        { error: "No product information found for this EAN" },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error looking up EAN:", error);
    return NextResponse.json(
      { error: "Failed to lookup EAN information" },
      { status: 500 }
    );
  }
}

