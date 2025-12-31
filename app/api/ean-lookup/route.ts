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
  releaseDate?: string;
  genre?: string;
  label?: string;
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
    // 1. Discogs API (best for music/vinyl records) - requires User-Agent
    // 2. Open EAN Database (fallback)
    let result: EANLookupResult | null = null;

    // Try Discogs API first (best for music/vinyl)
    try {
      let discogsData = null;
      let discogsResponse: Response | null = null;
      
      // For UPC (12 digits), also try with leading zero (EAN-13 format)
      const searchCodes = [cleanEAN];
      if (cleanEAN.length === 12) {
        // UPC-A can be converted to EAN-13 by adding a leading zero
        searchCodes.push(`0${cleanEAN}`);
      }
      
      console.log(`Starting Discogs lookup for EAN ${cleanEAN}, trying codes:`, searchCodes);
      
      // Get Discogs Personal Access Token
      const { token, hasToken } = getDiscogsToken();
      
      console.log(`Discogs token check:`, {
        hasToken,
        tokenLength: token.length,
      });
      
      // Try each barcode variant
      for (const searchCode of searchCodes) {
        console.log(`\n🔍 Trying Discogs search for barcode: ${searchCode}`);
        
        // Search by barcode with type=release filter
        let discogsUrl = `https://api.discogs.com/database/search?barcode=${searchCode}&type=release`;
        console.log(`📡 Discogs URL: ${discogsUrl}`);
        
        // Build headers
        const headers: Record<string, string> = {
          "User-Agent": "MyVinylib/1.0 +https://github.com/franckmandon/vinylib",
          "Accept": "application/json",
        };
        
        // Add token authentication if available
        if (hasToken) {
          headers["Authorization"] = `Discogs token=${token}`;
          console.log(`✅ Using Personal Access Token authentication`);
        } else {
          console.log(`⚠️ No token found, using unauthenticated request`);
        }
        
        try {
          discogsResponse = await fetch(discogsUrl, {
            headers,
            signal: AbortSignal.timeout(10000),
          });
        
          console.log(`Discogs response status: ${discogsResponse.status} for code ${searchCode}`);
          
          if (discogsResponse.ok) {
            try {
              discogsData = await discogsResponse.json();
              console.log(`Discogs response for ${searchCode}:`, {
                pagination: discogsData.pagination,
                resultsCount: discogsData.results?.length || 0,
                allTypes: discogsData.results?.map((r: any) => r.type) || [],
                firstResult: discogsData.results?.[0] ? {
                  id: discogsData.results[0].id,
                  type: discogsData.results[0].type,
                  title: discogsData.results[0].title,
                  uri: discogsData.results[0].uri,
                } : null,
              });
              
              if (discogsData.results && discogsData.results.length > 0) {
                console.log(`✅ Found ${discogsData.results.length} results for code ${searchCode}`);
                break; // Found results, stop searching variants
              } else {
                console.log(`⚠️ No results found in Discogs response for code ${searchCode}`);
                // Try without type filter
                discogsUrl = `https://api.discogs.com/database/search?barcode=${searchCode}`;
                console.log(`📡 Trying without type filter: ${discogsUrl}`);
                
                const retryResponse = await fetch(discogsUrl, {
                  headers,
                  signal: AbortSignal.timeout(10000),
                });
                
                if (retryResponse.ok) {
                  discogsData = await retryResponse.json();
                  if (discogsData.results && discogsData.results.length > 0) {
                    console.log(`✅ Found ${discogsData.results.length} results without type filter`);
                    break;
                  }
                }
              }
            } catch (parseError) {
              console.error(`❌ Error parsing Discogs JSON for ${searchCode}:`, parseError);
            }
          } else {
            // Response was not OK - log detailed error
            const errorText = await discogsResponse.text().catch(() => "Unable to read error");
            console.error(`❌ Discogs API error (${discogsResponse.status}) for ${searchCode}:`, errorText.substring(0, 500));
            
            if (discogsResponse.status === 401) {
              console.error(`🔐 Authentication failed - check your Personal Access Token`);
            } else if (discogsResponse.status === 429) {
              console.error(`⚠️ Rate limit exceeded - too many requests`);
            }
          }
        } catch (fetchError: any) {
          console.error(`❌ Fetch error for ${searchCode}:`, fetchError.message);
        }
        
        // If we found results, break out of barcode variant loop
        if (discogsData && discogsData.results && discogsData.results.length > 0) {
          break;
        }
      }

      // Check if we got any results from Discogs
      if (discogsResponse?.ok && discogsData?.results && discogsData.results.length > 0) {
        console.log(`Discogs API found ${discogsData.results.length} result(s) for EAN ${cleanEAN}`);
        
        // Prefer releases, but accept other types if no release is found
        const releases = discogsData.results.filter((r: any) => r.type === 'release');
        const masters = discogsData.results.filter((r: any) => r.type === 'master');
        const otherTypes = discogsData.results.filter((r: any) => r.type !== 'release' && r.type !== 'master');
        
        console.log(`Result types found: ${releases.length} releases, ${masters.length} masters, ${otherTypes.length} other`);
        
        // Prefer release, then master, then first result
        const release = releases.length > 0 ? releases[0] : (masters.length > 0 ? masters[0] : discogsData.results[0]);
        
        if (!release) {
          console.log(`No valid release found in Discogs results for EAN ${cleanEAN}`);
        } else {
          console.log(`Using Discogs release ID ${release.id} for EAN ${cleanEAN}`);
        
          // Fetch detailed information about the release/master
          let detailedInfo = null;
          if (release.id && release.type) {
            try {
              // Use the correct endpoint based on type
              const endpoint = release.type === 'master' ? 'masters' : 'releases';
              const detailUrl = `https://api.discogs.com/${endpoint}/${release.id}`;
              console.log(`Fetching details from: ${detailUrl}`);
              
              // Build headers for detail request
              const detailHeaders: Record<string, string> = {
                "User-Agent": "MyVinylib/1.0 +https://github.com/franckmandon/vinylib",
                "Accept": "application/json",
              };
              
              // Add token authentication if available
              if (hasToken) {
                detailHeaders["Authorization"] = `Discogs token=${token}`;
              }
              
              const detailResponse = await fetch(detailUrl, {
                headers: detailHeaders,
                signal: AbortSignal.timeout(10000), // 10 second timeout
              });
              
              if (detailResponse.ok) {
                detailedInfo = await detailResponse.json();
                console.log(`Successfully fetched details for ${release.type} ${release.id}`);
              } else {
                console.error(`Failed to fetch details: ${detailResponse.status}`);
              }
            } catch (err) {
              console.error("Error fetching Discogs details:", err);
            }
          }

          const info = detailedInfo || release;
          
          // Extract artist name (can be a string or array)
          let artistName = "";
          if (info.artists && Array.isArray(info.artists) && info.artists.length > 0) {
            artistName = info.artists.map((a: any) => a.name || a).join(", ");
          } else if (info.artist) {
            artistName = Array.isArray(info.artist) ? info.artist.join(", ") : info.artist;
          }

          // Extract album title
          const albumTitle = info.title || release.title || "";
          
          console.log(`Processing Discogs release:`, {
            id: release.id,
            title: albumTitle,
            artist: artistName,
          });

          // Extract release date
          let releaseDate = "";
          if (info.released) {
            // Try to parse date format (could be YYYY-MM-DD or just YYYY)
            const dateMatch = info.released.match(/(\d{4})/);
            if (dateMatch) {
              if (info.released.includes("-")) {
                releaseDate = info.released.substring(0, 10); // Take YYYY-MM-DD part
              } else {
                releaseDate = `${dateMatch[1]}-01-01`; // Use January 1st if only year
              }
            }
          } else if (info.year) {
            releaseDate = `${info.year}-01-01`;
          }

          // Extract genre
          const genre = info.genres && info.genres.length > 0 ? info.genres[0] : undefined;

          // Extract label
          const label = info.labels && info.labels.length > 0 
            ? info.labels.map((l: any) => l.name).join(", ")
            : undefined;

          // Get cover image (prefer large, fallback to medium, then thumb)
          let coverImage = undefined;
          if (info.images && info.images.length > 0) {
            const largeImage = info.images.find((img: any) => img.type === "primary" || img.width > 500);
            coverImage = largeImage?.uri || largeImage?.resource_url || info.images[0].uri || info.images[0].resource_url;
          } else if (info.thumb) {
            coverImage = info.thumb;
          } else if (release.thumb) {
            coverImage = release.thumb;
          }

          // Extract description/notes from tracklist or notes
          let description = "";
          if (info.notes) {
            description = info.notes;
          } else if (info.tracklist && info.tracklist.length > 0) {
            description = `Tracklist:\n${info.tracklist.map((t: any) => `${t.position || ""} ${t.title || ""} ${t.duration || ""}`).join("\n")}`;
          }

          result = {
            ean: cleanEAN,
            title: albumTitle,
            artist: artistName || undefined,
            album: albumTitle || undefined,
            description: description || undefined,
            image: coverImage,
            releaseDate: releaseDate || undefined,
            genre: genre,
            label: label,
          };
          
          console.log(`Successfully extracted data from Discogs:`, {
            ean: result.ean,
            artist: result.artist,
            album: result.album,
            hasImage: !!result.image,
            hasDate: !!result.releaseDate,
          });
        }
      } else if (discogsResponse && !discogsResponse.ok) {
        // Discogs returned non-OK status
        try {
          const errorText = await discogsResponse.text().catch(() => "Unable to read error response");
          console.error(`Discogs API returned status ${discogsResponse.status} for EAN ${cleanEAN}:`, errorText.substring(0, 500));
          
          // If it's a rate limit or similar, we should still try fallback
          if (discogsResponse.status === 429) {
            console.log("Discogs rate limit hit, trying fallback");
          }
        } catch (textError) {
          console.error(`Discogs API error (${discogsResponse.status}) for EAN ${cleanEAN}: Could not read error text`);
        }
      } else if (discogsResponse && discogsResponse.ok && discogsData && (!discogsData.results || discogsData.results.length === 0)) {
        // Discogs returned OK but no results
        console.log(`Discogs found no results for EAN ${cleanEAN}. Response:`, JSON.stringify(discogsData).substring(0, 200));
      } else {
        console.log(`Discogs API did not return a valid response for EAN ${cleanEAN}`);
      }
    } catch (error: any) {
      console.error("Discogs API error:", error);
      // Log more details about the error
      if (error.message) {
        console.error("Discogs error message:", error.message);
      }
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        console.error("Discogs API request timed out");
      }
    }

    // Try Open EAN Database as fallback if Discogs didn't work
    if (!result) {
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
      } catch (error: any) {
        console.error("Open EAN DB error:", error);
        if (error.message) {
          console.error("Open EAN DB error message:", error.message);
        }
      }
    }

    if (!result || (!result.title && !result.artist && !result.album)) {
      return NextResponse.json(
        { 
          error: `No product information found for EAN ${cleanEAN}. Tried Discogs and Open EAN Database. This EAN may not be in the databases, or the product might not be a music release.`,
          ean: cleanEAN
        },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error looking up EAN:", error);
    const errorMessage = error?.message || error?.toString() || "Unknown error";
    const errorName = error?.name || "";
    
    let userMessage = "Failed to lookup EAN information";
    if (errorName === 'AbortError' || errorName === 'TimeoutError') {
      userMessage = "Request timed out. Please try again.";
    } else if (errorMessage.includes("fetch")) {
      userMessage = "Network error. Please check your connection and try again.";
    } else {
      userMessage = `Failed to lookup EAN information: ${errorMessage}`;
    }
    
    return NextResponse.json(
      { error: userMessage, ean: cleanEAN },
      { status: 500 }
    );
  }
}

