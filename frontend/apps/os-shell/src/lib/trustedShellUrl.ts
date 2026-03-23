const ABSOLUTE_URL_PATTERN = /^[a-zA-Z][a-zA-Z\d+.-]*:/;

export type TrustedShellUrl = string & { readonly __trustedShellUrl: unique symbol };

export interface ResolveTrustedShellUrlOptions {
  allowRelative?: boolean;
  allowedOrigins?: string[];
  baseOrigin?: string;
}

function normalizeOrigin(origin: string): string | null {
  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}

function getBaseOrigin(baseOrigin?: string): string | null {
  if (baseOrigin) {
    return normalizeOrigin(baseOrigin);
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'http://localhost';
}

function isHttpProtocol(protocol: string): boolean {
  return protocol === 'http:' || protocol === 'https:';
}

export function resolveTrustedShellUrl(
  candidate: string | undefined | null,
  options: ResolveTrustedShellUrlOptions = {}
): TrustedShellUrl | null {
  const trimmed = candidate?.trim();
  if (!trimmed) {
    return null;
  }

  const baseOrigin = getBaseOrigin(options.baseOrigin);
  if (!baseOrigin) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed, `${baseOrigin}/`);
  } catch {
    return null;
  }

  if (!isHttpProtocol(parsed.protocol)) {
    return null;
  }

  const isAbsolute = ABSOLUTE_URL_PATTERN.test(trimmed);
  if (!isAbsolute) {
    if (options.allowRelative === false || parsed.origin !== baseOrigin) {
      return null;
    }

    return parsed.toString() as TrustedShellUrl;
  }

  const allowedOrigins = new Set(
    (options.allowedOrigins ?? [])
      .map(normalizeOrigin)
      .filter((origin): origin is string => origin !== null)
  );

  if (allowedOrigins.size > 0) {
    if (!allowedOrigins.has(parsed.origin)) {
      return null;
    }

    return parsed.toString() as TrustedShellUrl;
  }

  return parsed.origin === baseOrigin ? (parsed.toString() as TrustedShellUrl) : null;
}

export function getTrustedShellOrigin(url: TrustedShellUrl): string {
  return new URL(url).origin;
}

export function openTrustedShellPopup(
  url: TrustedShellUrl,
  target: string = '_blank'
): Window | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const opened = window.open(url, target, 'noopener,noreferrer');
  if (opened) {
    opened.opener = null;
  }

  return opened;
}