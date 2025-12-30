import { NextRequest, NextResponse } from "next/server";

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
          "User-Agent": "My Vinylib Vinyl Library Manager/1.0",
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

    // If Open EAN DB didn't work, try Barcode Lookup API (requires free API key)
    // For now, we'll use a fallback approach
    if (!result) {
      // Try using MusicBrainz or Discogs API as fallback
      // These require more complex setup, so we'll return basic info
      result = {
        ean: cleanEAN,
        title: undefined,
      };
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

