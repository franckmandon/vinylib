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
    // First, try searching for "{Album} (album)" or "{Album} by {Artist}"
    const searchQueries = [
      `${album} (album)`,
      `${album} by ${artist}`,
      `${artist} ${album}`,
    ];

    let extract = "";
    let pageTitle = "";

    for (const query of searchQueries) {
      // Search for the page
      const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
      
      try {
        const searchResponse = await fetch(searchUrl, {
          headers: {
            "User-Agent": "My Vinylib Vinyl Library Manager/1.0",
          },
        });

        if (searchResponse.ok) {
          const data = await searchResponse.json();
          if (data.extract) {
            extract = data.extract;
            pageTitle = data.title;
            break;
          }
        }
      } catch (error) {
        // Continue to next query
        continue;
      }
    }

    // If no direct match, try searching via the search API
    if (!extract) {
      const searchApiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(album)}`;
      try {
        const searchResponse = await fetch(searchApiUrl, {
          headers: {
            "User-Agent": "My Vinylib Vinyl Library Manager/1.0",
          },
        });

        if (searchResponse.ok) {
          const data = await searchResponse.json();
          if (data.extract) {
            extract = data.extract;
            pageTitle = data.title;
          }
        }
      } catch (error) {
        // If all fails, return empty
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

