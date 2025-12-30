/**
 * Get Discogs Personal Access Token from environment variables
 * Generate your token at: https://www.discogs.com/settings/developers
 */
export function getDiscogsToken() {
  const token = process.env.DISCOGS_TOKEN;
  
  return {
    token: token || '',
    hasToken: !!token,
  };
}

