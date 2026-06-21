/** Re-export YouTube helpers from utils (legacy import path). */
export {
  extractYouTubeId,
  isValidYouTubeId,
  getEmbedUrl,
  getWatchUrl,
  getThumbnailUrl,
} from '../utils/youtube';

import { getEmbedUrl, getWatchUrl, getThumbnailUrl } from '../utils/youtube';

export function buildYouTubeEmbedUrl(videoId: string): string {
  return getEmbedUrl(videoId) ?? '';
}

export function buildYouTubeWatchUrl(videoId: string): string {
  return getWatchUrl(videoId);
}

export function buildYouTubeThumbnailUrl(videoId: string): string {
  return getThumbnailUrl(videoId);
}
