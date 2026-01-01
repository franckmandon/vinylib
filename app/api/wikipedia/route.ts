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
    // Try to find the Wikipedia page for the album using both artist and album name
    // Multiple search strategies combining artist and album
    const searchQueries = [
      `${album} (album)`,
      `${album} (${artist} album)`,
      `${album} by ${artist}`,
      `${artist} - ${album}`,
      `${artist}: ${album}`,
      `${artist} ${album}`,
      `${album}`,
    ];

    let extract = "";
    let pageTitle = "";

    // First, try direct page lookups using both artist and album
    for (const query of searchQueries) {
      const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
      
      try {
        const searchResponse = await fetch(searchUrl, {
          headers: {
            "User-Agent": "Vinyl Report Vinyl Library Manager/1.0",
          },
        });

        if (searchResponse.ok) {
          const data = await searchResponse.json();
          if (data.extract) {
            // Verify that the page is relevant (contains artist or album name)
            const extractLower = data.extract.toLowerCase();
            const artistLower = artist.toLowerCase();
            const albumLower = album.toLowerCase();
            
            // If extract mentions the artist or album, use it
            if (extractLower.includes(artistLower) || extractLower.includes(albumLower)) {
              extract = data.extract;
              pageTitle = data.title;
              break;
            }
          }
        }
      } catch (error) {
        // Continue to next query
        continue;
      }
    }

    // If no direct match, try Wikipedia search API to find pages mentioning both artist and album
    if (!extract) {
      try {
        // Search for pages containing both artist and album
        const searchApiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(`${artist} ${album}`)}&srlimit=5&origin=*`;
        
        const searchResponse = await fetch(searchApiUrl, {
          headers: {
            "User-Agent": "Vinyl Report Vinyl Library Manager/1.0",
          },
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.query?.search && searchData.query.search.length > 0) {
            // Try to get summary for the first result
            const firstResult = searchData.query.search[0];
            const pageId = firstResult.pageid;
            
            // Get page summary using page ID
            const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(firstResult.title)}`;
            const summaryResponse = await fetch(summaryUrl, {
              headers: {
                "User-Agent": "Vinyl Report Vinyl Library Manager/1.0",
              },
            });
            
            if (summaryResponse.ok) {
              const summaryData = await summaryResponse.json();
              if (summaryData.extract) {
                extract = summaryData.extract;
                pageTitle = summaryData.title;
              }
            }
          }
        }
      } catch (error) {
        console.error("Error in Wikipedia search API:", error);
      }
    }

    if (!extract) {
      return NextResponse.json(
        { error: "No Wikipedia content found" },
        { status: 404 }
      );
    }

    // Clean up the extract (remove references, etc.)
    const cleanedExtract = extract
      .replace(/\[citation needed\]/gi, "")
      .replace(/\[.*?\]/g, "")
      .trim();

    return NextResponse.json({
      content: cleanedExtract,
      pageTitle,
    });
  } catch (error) {
    console.error("Error fetching Wikipedia content:", error);
    return NextResponse.json(
      { error: "Failed to fetch Wikipedia content" },
      { status: 500 }
    );
  }
}

