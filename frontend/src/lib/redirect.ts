const DEFAULT_CALLBACK = '/dashboard';

export function getSafeCallback(path: string | null | undefined): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return DEFAULT_CALLBACK;
  }
  return path;
}

/** Reads `callback` (preferred) or legacy `redirect` query param. */
export function getAuthCallback(searchParams: URLSearchParams): string {
  return getSafeCallback(searchParams.get('callback') || searchParams.get('redirect'));
}

export function buildLoginPath(callbackTo: string): string {
  return `/login?callback=${encodeURIComponent(callbackTo)}`;
}

const OAUTH_CALLBACK_KEY = 'oauth_callback';

export function storeOAuthCallback(path: string): void {
  sessionStorage.setItem(OAUTH_CALLBACK_KEY, path);
}

export function consumeOAuthCallback(): string {
  const stored = sessionStorage.getItem(OAUTH_CALLBACK_KEY);
  sessionStorage.removeItem(OAUTH_CALLBACK_KEY);
  return getSafeCallback(stored);
}

/** @deprecated Use getSafeCallback */
export const getSafeRedirect = getSafeCallback;

/** @deprecated Use storeOAuthCallback */
export const storeOAuthRedirect = storeOAuthCallback;

/** @deprecated Use consumeOAuthCallback */
export const consumeOAuthRedirect = consumeOAuthCallback;
