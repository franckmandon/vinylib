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
      `${album} (album)`,
      `${album} by ${artist}`,
      `${artist} ${album}`,
    ];

    let pageTitle = "";
    let credits = "";

    for (const query of searchQueries) {
      try {
        // First, get the page summary to find the page title
        const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
        const summaryResponse = await fetch(summaryUrl, {
          headers: {
            "User-Agent": "Vinyl Report Vinyl Library Manager/1.0",
          },
        });

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
            
            // Try to extract credits from infobox or specific sections
            // Look for "Personnel" or "Credits" sections
            const personnelMatch = html.match(/<h[23][^>]*>.*?(?:Personnel|Credits|Recording).*?<\/h[23]>([\s\S]*?)(?=<h[23]|$)/i);
            if (personnelMatch) {
              // Extract text from HTML, remove tags
              let creditsText = personnelMatch[1]
                .replace(/<[^>]+>/g, " ")
                .replace(/\s+/g, " ")
                .trim();
              
              // Clean up common Wikipedia artifacts
              creditsText = creditsText
                .replace(/\[citation needed\]/gi, "")
                .replace(/\[.*?\]/g, "")
                .replace(/\(edit\)/gi, "")
                .trim();
              
              if (creditsText.length > 50) { // Only use if substantial content
                credits = creditsText;
                break;
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

