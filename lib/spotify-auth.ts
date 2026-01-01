// Spotify API authentication utility

let spotifyAccessToken: string | null = null;
let tokenExpiryTime: number = 0;

export async function getSpotifyAccessToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn("[spotify] SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET not configured");
    return null;
  }

  // Check if we have a valid cached token
  if (spotifyAccessToken && Date.now() < tokenExpiryTime) {
    return spotifyAccessToken;
  }

  try {
    // Get access token using Client Credentials flow
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      console.error("[spotify] Failed to get access token:", response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    spotifyAccessToken = data.access_token;
    // Set expiry time (subtract 60 seconds for safety margin)
    tokenExpiryTime = Date.now() + (data.expires_in * 1000) - 60000;

    return spotifyAccessToken;
  } catch (error) {
    console.error("[spotify] Error getting access token:", error);
    return null;
  }
}

export function hasSpotifyCredentials(): boolean {
  return !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
}

