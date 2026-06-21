/**
 * YouTube URL normalization for Academy video embeds.
 * Accepts bare IDs or full watch/embed URLs; always returns a valid embed URL or null.
 */

const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

const URL_PATTERNS = [
  /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
  /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
];

export function extractYouTubeId(input: string | null | undefined): string | null {
  if (!input?.trim()) return null;

  const trimmed = input.trim();

  for (const pattern of URL_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match?.[1]) return match[1];
  }

  if (YOUTUBE_ID_RE.test(trimmed)) return trimmed;

  return null;
}

export function isValidYouTubeId(id: string | null | undefined): id is string {
  return typeof id === 'string' && YOUTUBE_ID_RE.test(id);
}

/**
 * Build a YouTube embed URL from a bare ID or full YouTube URL.
 * Returns null when the input cannot be resolved to a valid 11-char video ID.
 */
export function getEmbedUrl(input: string | null | undefined): string | null {
  const id = extractYouTubeId(input);
  if (!id) return null;

  const origin =
    typeof window !== 'undefined' ? `&origin=${encodeURIComponent(window.location.origin)}` : '';

  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&enablejsapi=1${origin}`;
}

export function getWatchUrl(input: string | null | undefined): string {
  const id = extractYouTubeId(input);
  return id ? `https://www.youtube.com/watch?v=${id}` : 'https://www.youtube.com';
}

export function getThumbnailUrl(input: string | null | undefined): string {
  const id = extractYouTubeId(input);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
}
