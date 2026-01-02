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
  trackList?: Array<{ title: string; duration?: string }>;
  country?: string;
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
              
              // Determine if this is a master or release
              // Check if the result type is "master" or if it has a master_id (which means we might want to use the master)
              const isMaster = release.type === "master";
              const resourceType = isMaster ? "masters" : "releases";
              const resourceId = isMaster ? release.id : release.id;
              
              // Try to get more details from the release or master
              let releaseDetails = null;
              try {
                const detailsUrl = `https://api.discogs.com/${resourceType}/${resourceId}?token=${token}`;
                const detailsResponse = await fetch(detailsUrl, {
                  headers: {
                    "User-Agent": "Vinyl Report Vinyl Library Manager/1.0",
                  },
                });
                if (detailsResponse.ok) {
                  releaseDetails = await detailsResponse.json();
                }
              } catch (error) {
                console.error("Error fetching Discogs release/master details:", error);
              }

              // Extract artist and title
              const artist = release.artist || (releaseDetails?.artists?.[0]?.name) || "";
              let album = release.title || releaseDetails?.title || "";
              
              // If album title contains " - ", extract only the part after " - " (album name)
              // Format: "Artist - Album" -> we want just "Album"
              if (album.includes(" - ")) {
                const parts = album.split(" - ");
                if (parts.length >= 2) {
                  // Take the last part (album name) and trim quotes if present
                  album = parts.slice(1).join(" - ").trim();
                  // Remove surrounding quotes if present
                  album = album.replace(/^["']|["']$/g, "");
                }
              }
              const image = release.thumb || releaseDetails?.images?.[0]?.uri || releaseDetails?.images?.[0]?.resource_url || "";
              const description = releaseDetails?.notes || (releaseDetails?.genres?.length ? releaseDetails.genres.join(", ") : "") || "";
              const genre = (releaseDetails?.genres?.[0]) || (Array.isArray(release.genre) ? release.genre[0] : release.genre) || "";
              const label = releaseDetails?.labels?.[0]?.name || "";
              const releaseDate = releaseDetails?.released || (release.year ? release.year.toString() : "") || "";
              const country = releaseDetails?.country || "";
              
              // Extract track list from Discogs
              let trackList: Array<{ title: string; duration?: string }> | undefined = undefined;
              if (releaseDetails?.tracklist && Array.isArray(releaseDetails.tracklist)) {
                trackList = releaseDetails.tracklist.map((track: any) => {
                  // Check multiple possible duration fields from Discogs API
                  const duration = track.duration || 
                                  track.length || 
                                  track.time || 
                                  (track.position && track.position.match(/\((\d{1,2}:\d{2})\)/)?.[1]) ||
                                  undefined;
                  
                  return {
                    title: track.title || "",
                    duration: duration || undefined,
                  };
                });
                
                // If durations are missing from API, try to fetch from HTML page
                const hasDurations = trackList && trackList.some(track => track.duration);
                if (!hasDurations && resourceId && trackList) {
                  try {
                    // Use the correct URL based on whether it's a master or release
                    const discogsPageUrl = isMaster 
                      ? `https://www.discogs.com/master/${resourceId}`
                      : `https://www.discogs.com/release/${resourceId}`;
                    const htmlResponse = await fetch(discogsPageUrl, {
                      headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                        "Accept-Language": "en-US,en;q=0.5",
                      },
                    });
                    
                    if (htmlResponse.ok) {
                      const html = await htmlResponse.text();
                      
                      // Strategy 1: Extract all durations with class "duration" first (most reliable)
                      const allDurationsWithClass: string[] = [];
                      // Try multiple patterns for duration class
                      const durationClassPatterns = [
                        /<[^>]*class="[^"]*duration[^"]*"[^>]*>([^<]+)<\/[^>]+>/gi,
                        /<span[^>]*class="[^"]*duration[^"]*"[^>]*>([^<]+)<\/span>/gi,
                        /<td[^>]*class="[^"]*duration[^"]*"[^>]*>([^<]+)<\/td>/gi,
                        /<div[^>]*class="[^"]*duration[^"]*"[^>]*>([^<]+)<\/div>/gi,
                      ];
                      
                      for (const pattern of durationClassPatterns) {
                        let durationMatch;
                        pattern.lastIndex = 0; // Reset regex
                        while ((durationMatch = pattern.exec(html)) !== null) {
                          const duration = durationMatch[1].trim();
                          if (duration.match(/^\d{1,2}:\d{2}$/)) {
                            allDurationsWithClass.push(duration);
                          }
                        }
                      }
                      
                      // Remove duplicates while preserving order
                      const uniqueDurations = Array.from(new Set(allDurationsWithClass));
                      
                      // If we found durations with class and count matches, use them directly
                      if (uniqueDurations.length >= trackList.length) {
                        trackList = trackList.map((track, index) => ({
                          ...track,
                          duration: uniqueDurations[index] || track.duration,
                        }));
                      } else {
                        // Strategy 2: Extract durations by matching track titles with their durations in HTML
                        const trackDurationsMap = new Map<number, string>();
                        
                        // First, try to find tracklist rows/items and extract durations from them
                        // Look for table rows or list items that contain track information
                        const trackRowPattern = /<(?:tr|li|div)[^>]*>([\s\S]*?)<\/(?:tr|li|div)>/gi;
                        const trackRows: Array<{ html: string; duration?: string }> = [];
                        let rowMatch;
                        
                        while ((rowMatch = trackRowPattern.exec(html)) !== null) {
                          const rowHtml = rowMatch[1];
                          
                          // Check if this row contains a track title (simple heuristic: contains text that might be a track)
                          // Extract duration from this row
                          let rowDuration: string | undefined;
                          
                          // Pattern 1: Class with "duration"
                          let durationInRow = rowHtml.match(/<[^>]*class="[^"]*duration[^"]*"[^>]*>([^<]+)<\/[^>]+>/i);
                          if (durationInRow) {
                            rowDuration = durationInRow[1].trim();
                          } else {
                            // Pattern 2: Time pattern in the row
                            const timeInRow = rowHtml.match(/\b(\d{1,2}:\d{2})\b/);
                            if (timeInRow) {
                              rowDuration = timeInRow[1];
                            }
                          }
                          
                          if (rowDuration && rowDuration.match(/^\d{1,2}:\d{2}$/)) {
                            trackRows.push({ html: rowHtml, duration: rowDuration });
                          }
                        }
                        
                        // Match track rows with our track list by finding title matches
                        trackList.forEach((track, trackIndex) => {
                          if (track.title && !trackDurationsMap.has(trackIndex)) {
                            // Normalize track title for matching (remove extra spaces, special chars)
                            const normalizedTitle = track.title
                              .toLowerCase()
                              .replace(/\s+/g, ' ')
                              .trim();
                            
                            // Try to find a row that contains this track title
                            for (const row of trackRows) {
                              // Normalize row HTML text for comparison
                              const rowText = row.html
                                .replace(/<[^>]+>/g, ' ') // Remove HTML tags
                                .replace(/\s+/g, ' ')
                                .toLowerCase()
                                .trim();
                              
                              // Try exact match first
                              if (rowText.includes(normalizedTitle) && row.duration) {
                                trackDurationsMap.set(trackIndex, row.duration);
                                break;
                              }
                              
                              // Try partial match (at least 50% of title length)
                              if (normalizedTitle.length > 0) {
                                const minMatchLength = Math.max(5, Math.floor(normalizedTitle.length * 0.5));
                                for (let i = 0; i <= normalizedTitle.length - minMatchLength; i++) {
                                  const titleSubstring = normalizedTitle.substring(i, i + minMatchLength);
                                  if (rowText.includes(titleSubstring) && row.duration) {
                                    trackDurationsMap.set(trackIndex, row.duration);
                                    break;
                                  }
                                }
                                if (trackDurationsMap.has(trackIndex)) break;
                              }
                            }
                          }
                        });
                        
                        // If we still have missing durations, try to match by order
                        if (trackDurationsMap.size < trackList.length) {
                          const orderedDurations = trackRows
                            .filter(row => row.duration)
                            .map(row => row.duration!);
                          
                          if (orderedDurations.length >= trackList.length) {
                            trackList.forEach((track, index) => {
                              if (!trackDurationsMap.has(index) && orderedDurations[index]) {
                                trackDurationsMap.set(index, orderedDurations[index]);
                              }
                            });
                          }
                        }
                        
                        // Strategy 3: If we still have missing durations, try extracting from tracklist section
                        if (trackDurationsMap.size < trackList.length) {
                          // Find tracklist section - try multiple patterns
                          let tracklistSection = "";
                          const tracklistPatterns = [
                            /<section[^>]*id="tracklist"[^>]*>([\s\S]*?)<\/section>/i,
                            /<div[^>]*id="tracklist"[^>]*>([\s\S]*?)<\/div>/i,
                            /<table[^>]*class="[^"]*tracklist[^"]*"[^>]*>([\s\S]*?)<\/table>/i,
                            /<div[^>]*class="[^"]*tracklist[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
                            /<tbody[^>]*>([\s\S]*?)<\/tbody>/i,
                            /<ul[^>]*class="[^"]*tracklist[^"]*"[^>]*>([\s\S]*?)<\/ul>/i,
                            /<table[^>]*>([\s\S]*?)<\/table>/i, // Fallback: any table
                          ];
                          
                          for (const pattern of tracklistPatterns) {
                            const match = html.match(pattern);
                            if (match && match[1]) {
                              tracklistSection = match[1];
                              break;
                            }
                          }
                          
                          if (tracklistSection) {
                            // Extract all time patterns from tracklist section
                            const timePattern = /\b(\d{1,2}:\d{2})\b/g;
                            const allTimes: string[] = [];
                            let timeMatch;
                            
                            while ((timeMatch = timePattern.exec(tracklistSection)) !== null) {
                              const time = timeMatch[1];
                              const contextStart = Math.max(0, timeMatch.index - 30);
                              const contextEnd = Math.min(tracklistSection.length, timeMatch.index + 30);
                              const context = tracklistSection.substring(contextStart, contextEnd);
                              
                              // Skip if it looks like a date or timestamp
                              if (!context.match(/\d{4}/) && 
                                  !context.match(/:\d{2}:\d{2}/) &&
                                  !context.match(/AM|PM/i)) {
                                allTimes.push(time);
                              }
                            }
                            
                            // Match times with tracks by order
                            if (allTimes.length >= trackList.length) {
                              trackList.forEach((track, index) => {
                                if (!trackDurationsMap.has(index) && allTimes[index]) {
                                  trackDurationsMap.set(index, allTimes[index]);
                                }
                              });
                            }
                          }
                        }
                        
                        // Strategy 4: Last resort - extract all time patterns from entire HTML and match by order
                        if (trackDurationsMap.size < trackList.length) {
                          const allTimesInHtml: string[] = [];
                          const timePattern = /\b(\d{1,2}:\d{2})\b/g;
                          let timeMatch;
                          
                          while ((timeMatch = timePattern.exec(html)) !== null) {
                            const time = timeMatch[1];
                            const contextStart = Math.max(0, timeMatch.index - 50);
                            const contextEnd = Math.min(html.length, timeMatch.index + 50);
                            const context = html.substring(contextStart, contextEnd);
                            
                            // Skip if it looks like a date, timestamp, or other non-track duration
                            if (!context.match(/\d{4}/) && 
                                !context.match(/:\d{2}:\d{2}/) &&
                                !context.match(/AM|PM/i) &&
                                !context.match(/release|date|year/i)) {
                              allTimesInHtml.push(time);
                            }
                          }
                          
                          // Remove duplicates
                          const uniqueTimes = Array.from(new Set(allTimesInHtml));
                          
                          // If we have enough times and they're in a reasonable range (between 0:30 and 20:00 typically)
                          const validTimes = uniqueTimes.filter(time => {
                            const [minutes, seconds] = time.split(':').map(Number);
                            const totalSeconds = minutes * 60 + seconds;
                            return totalSeconds >= 30 && totalSeconds <= 1200; // 30 seconds to 20 minutes
                          });
                          
                          // Match by order if count is reasonable
                          if (validTimes.length >= trackList.length && validTimes.length <= trackList.length * 2) {
                            trackList.forEach((track, index) => {
                              if (!trackDurationsMap.has(index) && validTimes[index]) {
                                trackDurationsMap.set(index, validTimes[index]);
                              }
                            });
                          }
                        }
                        
                        // Apply found durations
                        if (trackDurationsMap.size > 0) {
                          trackList = trackList.map((track, index) => ({
                            ...track,
                            duration: trackDurationsMap.get(index) || track.duration,
                          }));
                        }
                      }
                    }
                  } catch (error) {
                    console.error("Error fetching Discogs HTML for durations:", error);
                    // Continue with trackList without durations
                  }
                }
              }

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
                  trackList: trackList || undefined,
                  country: country || undefined,
                };
              }
            }
          }
        }
      } catch (error) {
        console.error("Discogs API error:", error);
      }
    }

    if (!result || (!result.title && !result.artist && !result.album)) {
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

