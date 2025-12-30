import { NextRequest, NextResponse } from "next/server";
import { getDiscogsToken } from "@/lib/discogs-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get("barcode") || "0886971951219";

  try {
    const { token, hasToken } = getDiscogsToken();

    if (!hasToken) {
      return NextResponse.json({
        error: "No Discogs token found",
        hint: "Add DISCOGS_TOKEN to your .env.local file",
        env: {
          hasToken: !!process.env.DISCOGS_TOKEN,
        },
      });
    }

    const url = `https://api.discogs.com/database/search?barcode=${barcode}&type=release`;
    
    // Make request with Personal Access Token
    const response = await fetch(url, {
      headers: {
        "User-Agent": "MyVinylib/1.0 +https://github.com/franckmandon/vinylib",
        "Accept": "application/json",
        "Authorization": `Discogs token=${token}`,
      },
    });

    const status = response.status;
    const responseText = await response.text();
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    return NextResponse.json({
      barcode,
      status,
      hasToken,
      url,
      response: typeof responseData === 'string' 
        ? responseData.substring(0, 500) 
        : {
            pagination: responseData.pagination,
            resultsCount: responseData.results?.length || 0,
            firstResult: responseData.results?.[0] || null,
          },
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

