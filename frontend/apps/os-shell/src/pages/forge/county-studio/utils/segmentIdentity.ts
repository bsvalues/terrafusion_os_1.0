export interface SegmentIdentity {
  rawName: string;
  neighborhoodCode: string | null;
  revalArea: string | null;
  classCode: string | null;
  marketTag: string | null;
  descriptor: string | null;
}

function isUnknownToken(token: string | null | undefined): boolean {
  return !!token && /^(UNKNOWN|N\/A|NA|NONE|NULL|UNASSIGNED)$/i.test(token.trim());
}

function normalizeNeighborhoodToken(token: string | null | undefined): string | null {
  if (!token) {
    return null;
  }

  const trimmed = token.trim();
  if (!trimmed || isUnknownToken(trimmed)) {
    return null;
  }

  const prefixedMatch = trimmed.match(/^(?:Neighborhood|NBHD|HOOD)\s+(.+)$/i);
  if (prefixedMatch?.[1]) {
    return prefixedMatch[1].trim() || null;
  }

  return trimmed;
}

function parseExplicitRevalToken(token: string): string | null {
  const explicitMatch = token.match(/^reval\s*([1-6])$/i);
  if (explicitMatch) {
    return explicitMatch[1];
  }

  return /^[1-6]$/u.test(token) ? token : null;
}

function tokenize(rawName: string): string[] {
  return rawName
    .split(/[·/]/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

function normalizeDescriptorToken(token: string | null | undefined): string | null {
  if (!token) {
    return null;
  }

  const trimmed = token.trim();
  if (!trimmed || isUnknownToken(trimmed)) {
    return null;
  }

  return trimmed;
}

export function parseSegmentIdentity(
  rawName: string,
  options?: {
    neighborhoodCode?: string | null;
    revalArea?: number | string | null;
    buildingType?: string | null;
    qualityGrade?: string | null;
  },
): SegmentIdentity {
  const tokens = tokenize(rawName);
  const explicitNeighborhood = normalizeNeighborhoodToken(options?.neighborhoodCode);
  const inferredNeighborhood = normalizeNeighborhoodToken(tokens[0] ?? null);
  const neighborhoodCode = explicitNeighborhood ?? inferredNeighborhood;

  const consumedNeighborhoodToken = tokens.findIndex((token) => {
    const normalized = normalizeNeighborhoodToken(token);
    if (!normalized) {
      return false;
    }

    if (explicitNeighborhood) {
      return normalized === explicitNeighborhood || token === tokens[0];
    }

    return normalized === inferredNeighborhood;
  });

  const metadataRevalArea =
    options?.revalArea === null || options?.revalArea === undefined
      ? null
      : String(options.revalArea).trim();
  const explicitRevalArea =
    (metadataRevalArea ? parseExplicitRevalToken(metadataRevalArea) : null) ||
    tokens.map(parseExplicitRevalToken).find((token) => token !== null) ||
    null;
  const revalArea = explicitRevalArea;
  const operativeTokens = tokens
    .filter((token, index) => {
      if (index === consumedNeighborhoodToken) {
        return false;
      }

      if (parseExplicitRevalToken(token) !== null) {
        return false;
      }

      return !isUnknownToken(token);
    })
    .filter((token, index, allTokens) => allTokens.findIndex((candidate) => candidate === token) === index);
  const classCode = normalizeDescriptorToken(options?.buildingType) ?? normalizeDescriptorToken(operativeTokens[0]) ?? null;
  const marketTag = normalizeDescriptorToken(options?.qualityGrade) ?? normalizeDescriptorToken(operativeTokens[1]) ?? null;
  const descriptorTokens = [classCode, marketTag, ...operativeTokens.slice(2)].filter(
    (token): token is string => !!normalizeDescriptorToken(token),
  );
  const descriptor = descriptorTokens.length > 0 ? descriptorTokens.join(' · ') : null;

  return {
    rawName,
    neighborhoodCode,
    revalArea,
    classCode,
    marketTag,
    descriptor,
  };
}

export function formatOperationalPrimary(identity: SegmentIdentity): string {
  const pieces: string[] = [];
  if (identity.neighborhoodCode) {
    pieces.push(`Neighborhood ${identity.neighborhoodCode}`);
  }
  if (identity.revalArea) {
    pieces.push(`Reval ${identity.revalArea}`);
  }
  if (pieces.length > 0) {
    return pieces.join(' · ');
  }

  return identity.rawName;
}

export function formatOperationalDescriptor(identity: SegmentIdentity): string | null {
  return normalizeDescriptorToken(identity.descriptor);
}

export function describeOperationalScope(identity: SegmentIdentity): string {
  const pieces: string[] = [];
  if (identity.neighborhoodCode) {
    pieces.push(`Neighborhood ${identity.neighborhoodCode}`);
  }
  if (identity.revalArea) {
    pieces.push(`Reval ${identity.revalArea}`);
  }
  if (!identity.revalArea && identity.descriptor) {
    pieces.push(identity.descriptor);
  }
  return pieces.length > 0 ? pieces.join(' · ') : identity.rawName;
}
