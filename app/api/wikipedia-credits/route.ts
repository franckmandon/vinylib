import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const artist = searchParams.get("artist");
  const album = searchParams.get("album");

  if (!artist || !album) {
    return NextResponse.json(
      { error: "Artist and album are required" },
      { status: 400 }
    );
  }

  try {
    // Try to find the Wikipedia page for the album
    const searchQueries = [
      `${album} (${artist} album)`,
      `${album} (album)`,
      `${album} by ${artist}`,
      `${artist} - ${album}`,
      `${artist}: ${album}`,
      `${artist} ${album}`,
    ];

    let pageTitle = "";
    let credits = "";

    for (const query of searchQueries) {
      try {
        // First, try to get the page directly
        let summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
        let summaryResponse = await fetch(summaryUrl, {
          headers: {
            "User-Agent": "Vinyl Report Vinyl Library Manager/1.0",
          },
        });

        // If direct page doesn't exist, try Wikipedia search API
        if (!summaryResponse.ok) {
          const searchApiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(album)}`;
          summaryResponse = await fetch(searchApiUrl, {
            headers: {
              "User-Agent": "Vinyl Report Vinyl Library Manager/1.0",
            },
          });
        }

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          pageTitle = summaryData.title;
          
          // Now get the full page content to extract credits
          const pageUrl = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(pageTitle)}`;
          const pageResponse = await fetch(pageUrl, {
            headers: {
              "User-Agent": "Vinyl Report Vinyl Library Manager/1.0",
            },
          });

          if (pageResponse.ok) {
            const html = await pageResponse.text();
            
            // First, try to find section with id="Personnel" or id="personnel"
            let personnelSection = "";
            
            // Look for section with id containing "Personnel" or "personnel"
            // Capture until next h2 (main section) to include all subsections (h3, h4, etc.)
            const personnelIdMatch = html.match(/<h[23][^>]*id="[^"]*[Pp]ersonnel[^"]*"[^>]*>([\s\S]*?)(?=<h2|$)/i);
            if (personnelIdMatch) {
              personnelSection = personnelIdMatch[0];
            } else {
              // Look for section with class or data attributes containing "Personnel"
              const personnelClassMatch = html.match(/<h[23][^>]*(?:class|data-section)[^>]*[Pp]ersonnel[^>]*>([\s\S]*?)(?=<h2|$)/i);
              if (personnelClassMatch) {
                personnelSection = personnelClassMatch[0];
              } else {
                // Look for heading with text "Personnel" followed by content
                // Capture until next h2 to include all subsections
                const personnelHeadingMatch = html.match(/<h[23][^>]*>.*?(?:Personnel|Credits|Recording).*?<\/h[23]>([\s\S]*?)(?=<h2|$)/i);
                if (personnelHeadingMatch) {
                  personnelSection = personnelHeadingMatch[0];
                }
              }
            }
            
            if (personnelSection) {
              // Extract all list items from the Personnel section, regardless of structure (columns, divs, etc.)
              // This will find ALL <li> elements in the entire section, even if they're in multiple <ul> or nested structures
              const listItems: string[] = [];
              const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
              let liMatch;
              
              // Reset regex lastIndex to ensure we search the entire section
              liRegex.lastIndex = 0;
              
              while ((liMatch = liRegex.exec(personnelSection)) !== null) {
                let itemText = liMatch[1]
                  .replace(/<[^>]+>/g, " ") // Remove all HTML tags, replace with space
                  .replace(/\s+/g, " ") // Normalize whitespace
                  .trim();
                
                // Clean up Wikipedia artifacts
                itemText = itemText
                  .replace(/\[citation needed\]/gi, "")
                  .replace(/\[.*?\]/g, "")
                  .replace(/\(edit\)/gi, "")
                  .trim();
                
                if (itemText.length > 0) {
                  listItems.push(itemText);
                }
              }
              
              // If we found list items, join them with newlines and add bullets
              if (listItems.length > 0) {
                credits = listItems.map(item => `• ${item}`).join("\n");
              } else {
                // Fallback: if no <li> found, try the original method
                // Extract text from HTML, remove tags but preserve line breaks
                let creditsText = personnelSection
                  .replace(/<h[23][^>]*>.*?<\/h[23]>/i, "") // Remove the heading itself
                  .replace(/<ul[^>]*>/gi, "") // Remove ul opening tag
                  .replace(/<li[^>]*>/gi, "• ") // Convert list items to bullets
                  .replace(/<\/li>/gi, "\n") // Each list item ends with a newline
                  .replace(/<\/ul>/gi, "") // Remove ul closing tag (no extra newline needed)
                  .replace(/<p[^>]*>/gi, "") // Remove p opening tag
                  .replace(/<\/p>/gi, "\n") // Each paragraph ends with a newline
                  .replace(/<br\s*\/?>/gi, "\n") // Convert line breaks
                  .replace(/<div[^>]*>/gi, "") // Remove div opening tags
                  .replace(/<\/div>/gi, "") // Remove div closing tags (no extra newline)
                  .replace(/<[^>]+>/g, "") // Remove all remaining HTML tags (without adding spaces)
                  .replace(/\n{2,}/g, "\n") // Replace 2+ consecutive newlines with single newline
                  .replace(/[ \t]+/g, " ") // Normalize spaces and tabs within lines (but preserve newlines)
                  .replace(/^[ \t]+|[ \t]+$/gm, "") // Trim each line
                  .trim();
                
                // Clean up common Wikipedia artifacts (preserve newlines)
                creditsText = creditsText
                  .replace(/\[citation needed\]/gi, "")
                  .replace(/\[.*?\]/g, "")
                  .replace(/\(edit\)/gi, "")
                  .replace(/[ \t]+/g, " ") // Normalize spaces and tabs within lines (but preserve newlines)
                  .replace(/^[ \t]+|[ \t]+$/gm, "") // Trim each line (spaces/tabs only, not newlines)
                  .replace(/\n{2,}/g, "\n") // Ensure no double newlines remain
                  .trim();
                
                if (creditsText.length > 50) {
                  credits = creditsText;
                }
              }
              
              if (credits && credits.length > 50) {
                break;
              }
            }
            
            // If no Personnel section found, try to find it by searching for the section ID pattern
            if (!credits) {
              // Wikipedia sections often have IDs like "Personnel" or "personnel"
              // Try to find span or div with id containing "Personnel"
              const personnelIdPattern = /<[^>]+id="[^"]*[Pp]ersonnel[^"]*"[^>]*>([\s\S]*?)(?=<h[23]|<\/div>|<\/section>|$)/i;
              const personnelIdMatch = html.match(personnelIdPattern);
              if (personnelIdMatch) {
                const sectionContent = personnelIdMatch[1];
                
                // Extract all list items from this section
                const listItems: string[] = [];
                const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
                let liMatch;
                
                while ((liMatch = liRegex.exec(sectionContent)) !== null) {
                  let itemText = liMatch[1]
                    .replace(/<[^>]+>/g, " ") // Remove all HTML tags, replace with space
                    .replace(/\s+/g, " ") // Normalize whitespace
                    .trim();
                  
                  // Clean up Wikipedia artifacts
                  itemText = itemText
                    .replace(/\[citation needed\]/gi, "")
                    .replace(/\[.*?\]/g, "")
                    .replace(/\(edit\)/gi, "")
                    .trim();
                  
                  if (itemText.length > 0) {
                    listItems.push(itemText);
                  }
                }
                
                // If we found list items, join them with newlines and add bullets
                if (listItems.length > 0) {
                  credits = listItems.map(item => `• ${item}`).join("\n");
                } else {
                  // Fallback: if no <li> found, try the original method
                  let creditsText = sectionContent
                    .replace(/<ul[^>]*>/gi, "") // Remove ul opening tag
                    .replace(/<li[^>]*>/gi, "• ") // Convert list items to bullets
                    .replace(/<\/li>/gi, "\n") // Each list item ends with a newline
                    .replace(/<\/ul>/gi, "") // Remove ul closing tag (no extra newline needed)
                    .replace(/<p[^>]*>/gi, "") // Remove p opening tag
                    .replace(/<\/p>/gi, "\n") // Each paragraph ends with a newline
                    .replace(/<br\s*\/?>/gi, "\n") // Convert line breaks
                    .replace(/<div[^>]*>/gi, "") // Remove div opening tags
                    .replace(/<\/div>/gi, "") // Remove div closing tags (no extra newline)
                    .replace(/<[^>]+>/g, "") // Remove all remaining HTML tags (without adding spaces)
                    .replace(/\n{2,}/g, "\n") // Replace 2+ consecutive newlines with single newline
                    .replace(/[ \t]+/g, " ") // Normalize spaces and tabs within lines (but preserve newlines)
                    .replace(/^[ \t]+|[ \t]+$/gm, "") // Trim each line
                    .trim();
                  
                  creditsText = creditsText
                    .replace(/\[citation needed\]/gi, "")
                    .replace(/\[.*?\]/g, "")
                    .replace(/\(edit\)/gi, "")
                    .replace(/[ \t]+/g, " ") // Normalize spaces and tabs within lines (but preserve newlines)
                    .replace(/^[ \t]+|[ \t]+$/gm, "") // Trim each line (spaces/tabs only, not newlines)
                    .replace(/\n{2,}/g, "\n") // Ensure no double newlines remain
                    .trim();
                  
                  if (creditsText.length > 50) {
                    credits = creditsText;
                  }
                }
                
                if (credits && credits.length > 50) {
                  break;
                }
              }
            }
            
            // Alternative: Look for infobox with personnel information
            const infoboxMatch = html.match(/<table[^>]*class="[^"]*infobox[^"]*"[^>]*>([\s\S]*?)<\/table>/i);
            if (infoboxMatch && !credits) {
              const infoboxText = infoboxMatch[1]
                .replace(/<[^>]+>/g, " ")
                .replace(/\s+/g, " ")
                .trim();
              
              // Look for personnel-related rows
              if (infoboxText.match(/(?:producer|engineer|musician|personnel|credits)/i)) {
                credits = infoboxText
                  .replace(/\[citation needed\]/gi, "")
                  .replace(/\[.*?\]/g, "")
                  .trim();
              }
            }
          }
          
          if (credits) break;
        }
      } catch (error) {
        continue;
      }
    }

    // If no credits found, try a simpler approach with the summary
    if (!credits) {
      const searchApiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(album)}`;
      try {
        const searchResponse = await fetch(searchApiUrl, {
          headers: {
            "User-Agent": "Vinyl Report Vinyl Library Manager/1.0",
          },
        });

        if (searchResponse.ok) {
          const data = await searchResponse.json();
          // Sometimes credits are mentioned in the extract
          const extract = data.extract || "";
          if (extract.match(/(?:produced by|engineered by|recorded by|personnel)/i)) {
            credits = extract
              .replace(/\[citation needed\]/gi, "")
              .replace(/\[.*?\]/g, "")
              .trim();
          }
        }
      } catch (error) {
        // If all fails, return empty
      }
    }

    if (!credits) {
      return NextResponse.json(
        { error: "No credits information found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      credits: credits.substring(0, 2000), // Limit to 2000 characters
      pageTitle,
    });
  } catch (error) {
    console.error("Error fetching Wikipedia credits:", error);
    return NextResponse.json(
      { error: "Failed to fetch Wikipedia credits" },
      { status: 500 }
    );
  }
}

