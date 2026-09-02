const WASHINGTON_LAUNCH_MANIFEST_SHA256_PATTERN = /^[a-f\d]{64}$/;

export const WASHINGTON_LAUNCH_DATA_PATH = '/launch-data/washington';
export const WASHINGTON_LAUNCH_DATA_PROXY_CONTEXT =
  '^/launch-data/washington/(?:manifest\\.json|counties/(?:status|\\d{3})\\.json|sales/by-county/\\d{3}\\.json)$';

export interface WashingtonLaunchDataProxyEnvironment {
  manifestSha256?: string;
  sourceUrl?: string;
}

export interface WashingtonLaunchDataProxyConfiguration {
  target: string;
  changeOrigin: true;
  secure: true;
}

function invalidConfiguration(message: string): never {
  throw new Error(`Invalid Washington launch data proxy configuration: ${message}`);
}

/**
 * Resolve the opt-in Vite bridge for the authenticated Washington public-data
 * package. The browser still fetches only same-origin canonical routes and
 * independently validates the build-pinned manifest and county shard digests.
 *
 * An entirely unconfigured development runtime remains available in truthful
 * navigation-only mode. A valid pin without a source URL explicitly
 * authenticates the tracked same-origin package for local acceptance; adding a
 * source URL opts into the credential-free HTTPS bridge. Unsafe inputs fail at
 * startup instead of silently presenting data as assessor-ready.
 */
export function resolveWashingtonLaunchDataProxy(
  environment: WashingtonLaunchDataProxyEnvironment
): WashingtonLaunchDataProxyConfiguration | undefined {
  const manifestSha256 = String(environment.manifestSha256 ?? '')
    .trim()
    .toLowerCase();
  const sourceUrl = String(environment.sourceUrl ?? '').trim();

  if (!manifestSha256 && !sourceUrl) return undefined;

  if (!WASHINGTON_LAUNCH_MANIFEST_SHA256_PATTERN.test(manifestSha256)) {
    invalidConfiguration(
      'VITE_WASHINGTON_LAUNCH_MANIFEST_SHA256 must be a 64-character SHA-256 digest.'
    );
  }
  if (!sourceUrl) return undefined;

  let parsedSourceUrl: URL;
  try {
    parsedSourceUrl = new URL(sourceUrl);
  } catch {
    invalidConfiguration('WASHINGTON_LAUNCH_DATA_SOURCE_URL must be an absolute URL.');
  }

  const normalizedPath = parsedSourceUrl.pathname.replace(/\/+$/, '');
  if (
    parsedSourceUrl.protocol !== 'https:' ||
    parsedSourceUrl.hostname.length === 0 ||
    parsedSourceUrl.username.length > 0 ||
    parsedSourceUrl.password.length > 0 ||
    (parsedSourceUrl.port !== '' && parsedSourceUrl.port !== '443') ||
    parsedSourceUrl.search.length > 0 ||
    parsedSourceUrl.hash.length > 0 ||
    normalizedPath !== WASHINGTON_LAUNCH_DATA_PATH
  ) {
    invalidConfiguration(
      `WASHINGTON_LAUNCH_DATA_SOURCE_URL must be a credential-free HTTPS URL ending in ${WASHINGTON_LAUNCH_DATA_PATH}.`
    );
  }

  return {
    // Vite preserves the canonical request path. Target only the validated
    // origin so the package path is not duplicated by the proxy library.
    target: parsedSourceUrl.origin,
    changeOrigin: true,
    secure: true,
  };
}
