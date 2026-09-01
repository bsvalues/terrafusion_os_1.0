import referencePackage from './washingtonAssessorReferencePackage.json';

export type WashingtonReferencePackageSource = 'hosted' | 'repository-reference';

/**
 * Logical route identifiers retained for compatibility with the governed
 * Washington package contract. They resolve from this tracked library module;
 * the explicit repository-reference journey does not depend on ignored Vite
 * public files or HTTP.
 */
export const WASHINGTON_REFERENCE_ROUTES = {
  status: '/launch-data/washington/counties/status.json',
  manifest: '/launch-data/washington/manifest.json',
  spokaneDetail: '/launch-data/washington/counties/063.json',
  spokaneSales: '/launch-data/washington/sales/by-county/063.json',
} as const;

export const WASHINGTON_ASSESSOR_REFERENCE_PACKAGE = referencePackage;

const routePayloads: Readonly<Record<string, unknown>> = {
  [WASHINGTON_REFERENCE_ROUTES.status]: referencePackage.status,
  [WASHINGTON_REFERENCE_ROUTES.manifest]: referencePackage.manifest,
  [WASHINGTON_REFERENCE_ROUTES.spokaneDetail]: referencePackage.countyDetails['063'],
  [WASHINGTON_REFERENCE_ROUTES.spokaneSales]: referencePackage.salesShards['063'],
};

export function resolveWashingtonAssessorReferenceRoute(
  route: string,
): unknown | undefined {
  return routePayloads[route];
}
