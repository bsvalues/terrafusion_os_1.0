/**
 * TerraAtlas API Service — GIS & Geospatial Data
 * =================================================================
 * Write-lane owner: Atlas owns parcel geometry, zoning overlays,
 * aerial layers, flood/slope data.
 *
 * @see config/suiteRegistry.ts — Constitutional Suite: atlas
 */

import { getToken } from '@/auth/authStorage';
import { getViteEnv } from '@/env/getViteEnv';

const API_BASE_URL = getViteEnv().VITE_API_URL || '';
const ATLAS_API = `${API_BASE_URL}/api/atlas`;
const BENTON_MASS_APPRAISAL_LAYER =
  'https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/AssessorPropVal/FeatureServer/0';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface MapLayer {
  id: string;
  name: string;
  category: 'base' | 'overlay' | 'analysis';
  enabled: boolean;
  opacity: number;
  source: string;
  features?: number;
  type?: 'vector' | 'raster' | 'geojson';
  url?: string;
}

interface ArcGisLayerCatalogResponse {
  layers: Array<{
    Id?: string;
    Name?: string;
    Category?: string;
    ServiceUrl?: string;
    GeometryType?: string;
    Description?: string;
    id?: string;
    name?: string;
    category?: string;
    serviceUrl?: string;
    geometryType?: string;
    description?: string;
  }>;
}

export interface ParcelResult {
  parcelId: string;
  address: string;
  owner: string;
  acreage: number;
  zoning: string;
  landUse: string;
  assessedValue: number;
  latitude?: number;
  longitude?: number;
  geometry?: GeoJSON.Geometry;
}

export interface ParcelSearchRequest {
  query: string;
  limit?: number;
  offset?: number;
  filters?: {
    zoning?: string;
    landUse?: string;
    minValue?: number;
    maxValue?: number;
    minAcreage?: number;
    maxAcreage?: number;
  };
}

export interface ParcelSearchResponse {
  results: ParcelResult[];
  total: number;
  hasMore: boolean;
}

export interface MassAppraisalSearchRequest {
  query?: string;
  propertyType?: string;
  limit?: number;
}

export interface MassAppraisalFeatureProperties {
  Parcel_ID?: string;
  situs_display?: string;
  Property_Type?: string;
  neighborhood?: string;
  zoning?: string | null;
  Current_Ratio?: number | null;
  MV_PPSF?: number | null;
  ASSESSED_VAL?: number | null;
  TotalMarketValue?: number | null;
  Shape__Area?: number | null;
}

export type MassAppraisalGeometry = GeoJSON.Polygon | GeoJSON.MultiPolygon;

export interface MassAppraisalFeature
  extends GeoJSON.Feature<MassAppraisalGeometry, MassAppraisalFeatureProperties> {}

export interface MassAppraisalFeatureCollection extends GeoJSON.FeatureCollection<MassAppraisalGeometry, MassAppraisalFeatureProperties> {
  properties?: {
    exceededTransferLimit?: boolean;
  };
}

export interface ZoningDistrict {
  id: string;
  code: string;
  name: string;
  description: string;
  jurisdiction: string;
  color: string;
  parcelCount: number;
}

export interface FloodZone {
  id: string;
  zone: string;
  name: string;
  riskLevel: 'high' | 'moderate' | 'low' | 'minimal';
  source: string;
}

export interface SpatialStats {
  totalParcels: number;
  totalAcreage: number;
  zoningDistrictCount: number;
  floodZoneCount: number;
  lastDataUpdate: string;
  averageAssessedValue?: number;
  averageMarketValue?: number;
  totalAssessedValue?: number;
  totalMarketValue?: number;
  typeBreakdown?: Array<{
    type: string;
    count: number;
  }>;
  layers?: string[];
}

export interface GeoEquityArea {
  id: string;
  name: string;
  neighborhoodCode: string;
  propertyType: string;
  propertyTypeCategory: string;
  equityRatio: number;
  ratioStdDev: number;
  parcelCount: number;
  averageMarketValue: number;
  center: [number, number];
}

export interface GeoEquityResponse {
  count: number;
  asOf: string;
  source: string;
  areas: GeoEquityArea[];
}

export interface GeometryHealthArea {
  id: string;
  name: string;
  neighborhoodCode: string;
  totalParcels: number;
  parcelsWithGeometry: number;
  parcelsMissingGeometry: number;
  flaggedGeometryRecords: number;
  center: [number, number];
}

export interface GeometryHealthResponse {
  totalParcels: number;
  parcelsWithGeometry: number;
  parcelsMissingGeometry: number;
  flaggedGeometryRecords: number;
  lastSyncTimestamp: string;
  source: string;
  areaStats: GeometryHealthArea[];
}

export interface LayerConfig {
  Id?: string;
  Name?: string;
  FeatureServerPath?: string;
  serviceUrl?: string;
  queryUrl?: string;
  Fields?: string[];
  GeometryType?: string;
  SpatialCapabilities?: string[];
}

export interface LayerConfigsResponse {
  count: number;
  source: string;
  baseUrl: string;
  layers: LayerConfig[];
}

export interface ParcelSpatialProfileStep {
  step: number;
  action: string;
  url?: string;
  overlayCount?: number;
  overlays?: Array<{
    layerId: string;
    layerName: string;
    queryUrl: string;
    fields: string[];
    note?: string;
  }>;
}

export interface ParcelSpatialProfileResponse {
  parcelId: string;
  workflow: string;
  steps: ParcelSpatialProfileStep[];
  overlayLayers: string[];
  expectedResults: Record<string, string>;
  source: string;
}

export interface ArcGisParcelFieldMap {
  canonical: string;
  arcgisFields: string[];
}

export interface ArcGisParcelQueryResponse {
  parcelId: string;
  localData: {
    address?: string;
    propertyType?: string;
    assessedValue?: number;
  };
  arcgisQuery: {
    serviceUrl: string;
    queryUrl: string;
    method: string;
    whereClause: string;
    returnGeometry: boolean;
    outputFormat: string;
    spatialReference: number;
  };
  fieldMapping: ArcGisParcelFieldMap[];
  source: string;
}

interface ArcGisParcelFeatureCollection
  extends GeoJSON.FeatureCollection<GeoJSON.Geometry, Record<string, unknown>> {}

export interface ArcGisSearchRequest {
  parcelId?: string;
  ownerName?: string;
  address?: string;
  minValue?: number;
  maxValue?: number;
  zoning?: string;
  limit?: number;
}

export interface ArcGisSearchResponse {
  arcgisQuery: {
    serviceUrl: string;
    queryUrl: string;
    method: string;
    whereClause: string;
    resultRecordCount: number;
    returnGeometry: boolean;
    outputFormat: string;
    spatialReference: number;
  };
  fieldMapping: ArcGisParcelFieldMap[];
  source: string;
}

interface ArcGisSearchFeatureCollection
  extends GeoJSON.FeatureCollection<GeoJSON.Geometry, Record<string, unknown>> {}

export interface ParcelLensRecord extends ParcelResult {
  pin?: string;
  apn?: string;
  legalDescription?: string;
  taxCode?: string;
  landValue?: number;
  improvementValue?: number;
  totalValue?: number;
  source: string;
  queryUrl: string;
}

export interface TerraQueryRecord {
  parcelId: string;
  pin?: string;
  address?: string;
  ownerName?: string;
  assessedValue?: number;
  landValue?: number;
  improvementValue?: number;
  acreage?: number;
  propertyType?: string;
  geometry?: GeoJSON.Geometry;
  source: string;
}

export interface TerraQuerySearchResult {
  criteria: ArcGisSearchRequest;
  whereClause: string;
  queryUrl: string;
  rowCount: number;
  source: string;
  records: TerraQueryRecord[];
}

export type AtlasExportFormat = 'geojson' | 'csv';

export interface LiveAtlasExportLayer {
  id: string;
  name: string;
  serviceUrl: string;
  queryUrl: string;
  fields: string[];
  geometryType?: string;
  featureCount?: number;
  source: string;
}

export interface AtlasLayerExportArtifact {
  filename: string;
  format: AtlasExportFormat;
  featureCount: number;
  source: string;
  blob: Blob;
}

// ============================================================================
// HELPERS
// ============================================================================

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function atlasGet<T>(path: string): Promise<T> {
  const response = await fetch(`${ATLAS_API}${path}`, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Atlas API error: ${response.statusText}`);
  return response.json();
}

async function atlasPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${ATLAS_API}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Atlas API error: ${response.statusText}`);
  return response.json();
}

async function fetchArcGisQuery<T>(params: URLSearchParams): Promise<T> {
  const response = await fetch(`${BENTON_MASS_APPRAISAL_LAYER}/query?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`ArcGIS query failed: ${response.statusText}`);
  }
  return response.json();
}

async function getArcGisMassAppraisalStats(): Promise<SpatialStats> {
  const countParams = new URLSearchParams({
    where: '1=1',
    returnGeometry: 'false',
    returnCountOnly: 'true',
    f: 'json',
  });

  const valuationParams = new URLSearchParams({
    where: '1=1',
    returnGeometry: 'false',
    outStatistics: JSON.stringify([
      {
        statisticType: 'sum',
        onStatisticField: 'TotalMarketValue',
        outStatisticFieldName: 'totalMarketValue',
      },
      {
        statisticType: 'avg',
        onStatisticField: 'TotalMarketValue',
        outStatisticFieldName: 'averageMarketValue',
      },
    ]),
    f: 'json',
  });

  const typeBreakdownParams = new URLSearchParams({
    where: '1=1',
    groupByFieldsForStatistics: 'Property_Type',
    outStatistics: JSON.stringify([
      {
        statisticType: 'count',
        onStatisticField: 'OBJECTID',
        outStatisticFieldName: 'parcelCount',
      },
    ]),
    returnGeometry: 'false',
    f: 'json',
  });

  const [countResponse, valuationResponse, typeResponse] = await Promise.all([
    fetchArcGisQuery<{ count?: number }>(countParams),
    fetchArcGisQuery<{ features?: Array<{ attributes?: { totalMarketValue?: number; averageMarketValue?: number } }> }>(valuationParams),
    fetchArcGisQuery<{ features?: Array<{ attributes?: { Property_Type?: string; parcelCount?: number } }> }>(typeBreakdownParams),
  ]);

  const valuationAttributes = valuationResponse.features?.[0]?.attributes;

  return {
    totalParcels: countResponse.count ?? 0,
    totalAcreage: 0,
    zoningDistrictCount: 0,
    floodZoneCount: 0,
    lastDataUpdate: new Date().toISOString(),
    averageAssessedValue: valuationAttributes?.averageMarketValue ?? 0,
    averageMarketValue: valuationAttributes?.averageMarketValue ?? 0,
    totalAssessedValue: valuationAttributes?.totalMarketValue ?? 0,
    totalMarketValue: valuationAttributes?.totalMarketValue ?? 0,
    typeBreakdown:
      typeResponse.features
        ?.map((feature) => ({
          type: feature.attributes?.Property_Type ?? 'Unknown',
          count: feature.attributes?.parcelCount ?? 0,
        }))
        .filter((entry) => entry.count > 0) ?? [],
    layers: ['benton-arcgis-mass-appraisal-fy2025'],
  };
}

function normalizeGeoEquityPropertyType(propertyType: string): string {
  const value = propertyType.trim().toLowerCase();
  if (value.includes('residential')) return 'Residential';
  if (value.includes('commercial') || value.includes('service')) return 'Commercial';
  if (
    value.includes('industrial') ||
    value.includes('manufacturing') ||
    value.includes('utility') ||
    value.includes('transportation')
  ) {
    return 'Industrial';
  }
  if (value.includes('agriculture') || value.includes('resource production')) return 'Agricultural';
  return 'Other';
}

function mapLayerCategory(category: string | undefined): MapLayer['category'] {
  const normalized = category?.toLowerCase() ?? '';
  if (normalized === 'base' || normalized === 'parcels') return 'base';
  if (normalized === 'analysis' || normalized === 'hazards' || normalized === 'assessment') return 'analysis';
  return 'overlay';
}

function mapLayerType(geometryType: string | undefined): MapLayer['type'] {
  const normalized = geometryType?.toLowerCase() ?? '';
  if (normalized === 'polygon' || normalized === 'point' || normalized === 'line' || normalized === 'geojson') return 'geojson';
  if (normalized === 'raster') return 'raster';
  return 'vector';
}

function normalizeArcGisLayerCatalog(response: ArcGisLayerCatalogResponse): MapLayer[] {
  return response.layers.map((layer) => {
    const id = layer.id ?? layer.Id ?? 'unknown-layer';
    const category = mapLayerCategory(layer.category ?? layer.Category);
    return {
      id,
      name: layer.name ?? layer.Name ?? id,
      category,
      enabled: id === 'parcels' || id === 'assessor-values' || id === 'zoning' || id === 'city-limits' || id === 'flood-100yr',
      opacity: id === 'parcels' ? 0.92 : 0.7,
      source: 'Benton County ArcGIS FeatureServer',
      type: mapLayerType(layer.geometryType ?? layer.GeometryType),
      url: layer.serviceUrl ?? layer.ServiceUrl,
      features: undefined,
    } satisfies MapLayer;
  });
}

function getMappedArcGisValue(
  attributes: Record<string, unknown>,
  candidates: string[],
): unknown {
  for (const candidate of candidates) {
    if (candidate in attributes) return attributes[candidate];

    const matchedKey = Object.keys(attributes).find(
      (key) => key.toLowerCase() === candidate.toLowerCase(),
    );
    if (matchedKey) return attributes[matchedKey];
  }

  return undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

async function fetchArcGisParcelRecord(parcelId: string): Promise<ParcelLensRecord> {
  const query = await atlasGet<ArcGisParcelQueryResponse>(`/arcgis/query/parcel/${encodeURIComponent(parcelId)}`);
  const response = await fetch(query.arcgisQuery.queryUrl);

  if (!response.ok) {
    throw new Error(`ArcGIS parcel query failed: ${response.statusText}`);
  }

  const featureCollection = (await response.json()) as ArcGisParcelFeatureCollection;
  const feature = featureCollection.features?.[0];
  const attributes = feature?.properties ?? {};

  if (!feature) {
    throw new Error(`Atlas could not load live ArcGIS parcel attributes for ${parcelId}.`);
  }

  const mapping = Object.fromEntries(
    query.fieldMapping.map((entry) => [entry.canonical, entry.arcgisFields]),
  ) as Record<string, string[]>;

  const address =
    asString(getMappedArcGisValue(attributes, ['SITE_ADDR', 'SITUS_ADDRESS'])) ??
    query.localData.address ??
    'Unknown Benton parcel';

  const assessedValue =
    asNumber(getMappedArcGisValue(attributes, mapping.assessedValue ?? ['ASSESSED_VAL', 'TOTALVALUE'])) ??
    query.localData.assessedValue ??
    0;

  const acreage =
    asNumber(getMappedArcGisValue(attributes, mapping.acreage ?? ['ACREAGE', 'ACRES'])) ?? 0;

  return {
    parcelId:
      asString(getMappedArcGisValue(attributes, ['PARCEL_ID', 'PARCEL_NUMBER'])) ??
      query.parcelId,
    address,
    owner:
      asString(getMappedArcGisValue(attributes, mapping.ownerName ?? ['OWNER_NAME', 'OWNERNAME'])) ??
      'Owner unavailable',
    acreage,
    zoning:
      asString(getMappedArcGisValue(attributes, mapping.zoningCode ?? ['ZONE_CODE', 'ZONING'])) ??
      'Unmapped',
    landUse:
      asString(getMappedArcGisValue(attributes, mapping.propertyType ?? ['PROP_TYPE', 'PROPERTY_TYPE'])) ??
      query.localData.propertyType ??
      'Unknown',
    assessedValue,
    geometry: feature.geometry ?? undefined,
    pin: asString(getMappedArcGisValue(attributes, ['PIN'])),
    apn: asString(getMappedArcGisValue(attributes, ['APN'])),
    legalDescription: asString(
      getMappedArcGisValue(attributes, mapping.legalDescription ?? ['LEGAL_DESC', 'LEGAL']),
    ),
    taxCode: asString(getMappedArcGisValue(attributes, mapping.taxCode ?? ['TAX_CODE', 'TAX_AREA'])),
    landValue: asNumber(getMappedArcGisValue(attributes, mapping.landValue ?? ['LAND_VAL', 'LAND_VALUE'])),
    improvementValue: asNumber(
      getMappedArcGisValue(attributes, mapping.improvementValue ?? ['IMPROV_VAL', 'IMP_VALUE']),
    ),
    totalValue: asNumber(getMappedArcGisValue(attributes, ['TOTALVALUE'])) ?? assessedValue,
    source: query.source,
    queryUrl: query.arcgisQuery.queryUrl,
  };
}

const ARCGIS_SEARCH_FIELD_MAP: ArcGisParcelFieldMap[] = [
  { canonical: 'parcelId', arcgisFields: ['PARCEL_ID', 'Parcel_ID'] },
  { canonical: 'pin', arcgisFields: ['PIN'] },
  { canonical: 'address', arcgisFields: ['SITE_ADDR', 'situs_display', 'SITUS_ADDRESS'] },
  { canonical: 'ownerName', arcgisFields: ['OWNER_NAME', 'OwnerName'] },
  { canonical: 'assessedValue', arcgisFields: ['ASSESSED_VAL', 'TotalMarketValue'] },
  { canonical: 'landValue', arcgisFields: ['LAND_VAL'] },
  { canonical: 'improvementValue', arcgisFields: ['IMPROV_VAL'] },
  { canonical: 'acreage', arcgisFields: ['ACREAGE', 'Shape__Area'] },
  { canonical: 'propertyType', arcgisFields: ['PROP_TYPE', 'Property_Type'] },
];

function buildDirectArcGisSearchWhere(request: ArcGisSearchRequest): string {
  const clauses: string[] = [];

  if (request.parcelId?.trim()) {
    clauses.push(`PARCEL_ID LIKE '%${request.parcelId.trim().replace(/'/g, "''")}%'`);
  }

  if (request.ownerName?.trim()) {
    clauses.push(`OWNER_NAME LIKE '%${request.ownerName.trim().replace(/'/g, "''")}%'`);
  }

  if (request.address?.trim()) {
    clauses.push(`SITE_ADDR LIKE '%${request.address.trim().replace(/'/g, "''")}%'`);
  }

  if (typeof request.minValue === 'number' && Number.isFinite(request.minValue)) {
    clauses.push(`ASSESSED_VAL >= ${Math.max(0, Math.round(request.minValue))}`);
  }

  if (typeof request.maxValue === 'number' && Number.isFinite(request.maxValue)) {
    clauses.push(`ASSESSED_VAL <= ${Math.max(0, Math.round(request.maxValue))}`);
  }

  if (request.zoning?.trim()) {
    clauses.push(`ZONE_CODE = '${request.zoning.trim().replace(/'/g, "''")}'`);
  }

  if (clauses.length === 0) {
    throw new Error('At least one Benton query criterion is required.');
  }

  return clauses.join(' AND ');
}

async function fetchArcGisSearchRecords(
  request: ArcGisSearchRequest,
): Promise<TerraQuerySearchResult> {
  let search: ArcGisSearchResponse;

  try {
    search = await atlasPost<ArcGisSearchResponse>('/arcgis/query/search', request);
  } catch {
    const whereClause = buildDirectArcGisSearchWhere(request);
    const params = new URLSearchParams({
      where: whereClause,
      outFields:
        'PARCEL_ID,PIN,SITE_ADDR,OWNER_NAME,ASSESSED_VAL,LAND_VAL,IMPROV_VAL,ACREAGE,PROP_TYPE',
      returnGeometry: 'true',
      f: 'geojson',
      outSR: '4326',
      resultRecordCount: String(Math.min(Math.max(request.limit ?? 25, 5), 200)),
    });

    search = {
      arcgisQuery: {
        serviceUrl: BENTON_MASS_APPRAISAL_LAYER,
        queryUrl: `${BENTON_MASS_APPRAISAL_LAYER}/query?${params.toString()}`,
        method: 'GET',
        whereClause,
        resultRecordCount: Math.min(Math.max(request.limit ?? 25, 5), 200),
        returnGeometry: true,
        outputFormat: 'geojson',
        spatialReference: 4326,
      },
      fieldMapping: ARCGIS_SEARCH_FIELD_MAP,
      source: 'Direct Benton ArcGIS parcel query secondary path',
    };
  }

  const response = await fetch(search.arcgisQuery.queryUrl);
  if (!response.ok) {
    throw new Error(`ArcGIS search query failed: ${response.statusText}`);
  }

  const featureCollection = (await response.json()) as ArcGisSearchFeatureCollection;
  const mapping = Object.fromEntries(
    search.fieldMapping.map((entry) => [entry.canonical, entry.arcgisFields]),
  ) as Record<string, string[]>;

  const records = (featureCollection.features ?? []).map((feature) => {
    const attributes = feature.properties ?? {};
    return {
      parcelId:
        asString(getMappedArcGisValue(attributes, mapping.parcelId ?? ['PARCEL_ID'])) ?? 'unknown',
      pin: asString(getMappedArcGisValue(attributes, mapping.pin ?? ['PIN'])),
      address: asString(
        getMappedArcGisValue(attributes, mapping.address ?? ['SITE_ADDR', 'situs_display']),
      ),
      ownerName: asString(getMappedArcGisValue(attributes, mapping.ownerName ?? ['OWNER_NAME'])),
      assessedValue: asNumber(
        getMappedArcGisValue(attributes, mapping.assessedValue ?? ['ASSESSED_VAL']),
      ),
      landValue: asNumber(getMappedArcGisValue(attributes, mapping.landValue ?? ['LAND_VAL'])),
      improvementValue: asNumber(
        getMappedArcGisValue(attributes, mapping.improvementValue ?? ['IMPROV_VAL']),
      ),
      acreage: asNumber(getMappedArcGisValue(attributes, mapping.acreage ?? ['ACREAGE'])),
      propertyType: asString(
        getMappedArcGisValue(attributes, mapping.propertyType ?? ['PROP_TYPE']),
      ),
      geometry: feature.geometry,
      source: search.source,
    } satisfies TerraQueryRecord;
  });

  return {
    criteria: request,
    whereClause: search.arcgisQuery.whereClause,
    queryUrl: search.arcgisQuery.queryUrl,
    rowCount: records.length,
    source: search.source,
    records,
  };
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function fetchArcGisLayerCount(serviceUrl: string): Promise<number | undefined> {
  const params = new URLSearchParams({
    where: '1=1',
    returnCountOnly: 'true',
    f: 'json',
  });
  const response = await fetch(`${serviceUrl}/query?${params.toString()}`);
  if (!response.ok) return undefined;

  const payload = (await response.json()) as { count?: number };
  return typeof payload.count === 'number' ? payload.count : undefined;
}

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function featuresToCsv(features: Array<GeoJSON.Feature<GeoJSON.Geometry, Record<string, unknown>>>): string {
  const columns = new Set<string>();
  for (const feature of features) {
    Object.keys(feature.properties ?? {}).forEach((key) => columns.add(key));
  }

  const orderedColumns = ['geometry_json', ...Array.from(columns)];
  const header = orderedColumns.join(',');
  const rows = features.map((feature) => {
    const properties = feature.properties ?? {};
    return orderedColumns
      .map((column) =>
        column === 'geometry_json'
          ? escapeCsv(feature.geometry ? JSON.stringify(feature.geometry) : '')
          : escapeCsv(properties[column]),
      )
      .join(',');
  });

  return [header, ...rows].join('\n');
}

async function fetchAllArcGisLayerFeatures(
  layer: LiveAtlasExportLayer,
): Promise<Array<GeoJSON.Feature<GeoJSON.Geometry, Record<string, unknown>>>> {
  const idsResponse = await fetch(
    `${layer.serviceUrl}/query?${new URLSearchParams({
      where: '1=1',
      returnIdsOnly: 'true',
      f: 'json',
    }).toString()}`,
  );

  if (!idsResponse.ok) {
    throw new Error(`Atlas layer export id query failed: ${idsResponse.statusText}`);
  }

  const idsPayload = (await idsResponse.json()) as {
    objectIds?: number[];
  };
  const objectIds = idsPayload.objectIds ?? [];
  if (objectIds.length === 0) return [];

  const batches = chunk(objectIds, 200);
  const features: Array<GeoJSON.Feature<GeoJSON.Geometry, Record<string, unknown>>> = [];

  for (const batch of batches) {
    const params = new URLSearchParams({
      objectIds: batch.join(','),
      outFields: layer.fields.join(','),
      returnGeometry: 'true',
      f: 'geojson',
      outSR: '4326',
    });

    const response = await fetch(`${layer.serviceUrl}/query?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Atlas layer export fetch failed: ${response.statusText}`);
    }

    const payload = (await response.json()) as GeoJSON.FeatureCollection<
      GeoJSON.Geometry,
      Record<string, unknown>
    >;
    features.push(...(payload.features ?? []));
  }

  return features;
}

async function buildAtlasLayerExportArtifact(
  layer: LiveAtlasExportLayer,
  format: AtlasExportFormat,
): Promise<AtlasLayerExportArtifact> {
  const features = await fetchAllArcGisLayerFeatures(layer);
  const featureCollection: GeoJSON.FeatureCollection<GeoJSON.Geometry, Record<string, unknown>> = {
    type: 'FeatureCollection',
    features,
  };

  const safeName = layer.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (format === 'geojson') {
    return {
      filename: `${safeName || layer.id}.geojson`,
      format,
      featureCount: features.length,
      source: layer.source,
      blob: new Blob([JSON.stringify(featureCollection, null, 2)], {
        type: 'application/geo+json',
      }),
    };
  }

  return {
    filename: `${safeName || layer.id}.csv`,
    format,
    featureCount: features.length,
    source: layer.source,
    blob: new Blob([featuresToCsv(features)], {
      type: 'text/csv;charset=utf-8',
    }),
  };
}

async function getArcGisGeoEquityAreas(minParcelCount = 25): Promise<GeoEquityResponse> {
  const params = new URLSearchParams({
    where:
      'Current_Ratio IS NOT NULL AND Current_Ratio > 0.5 AND Current_Ratio < 1.5 AND neighborhood IS NOT NULL AND Property_Type IS NOT NULL',
    groupByFieldsForStatistics: 'neighborhood,Property_Type',
    outStatistics: JSON.stringify([
      {
        statisticType: 'count',
        onStatisticField: 'OBJECTID',
        outStatisticFieldName: 'parcelCount',
      },
      {
        statisticType: 'avg',
        onStatisticField: 'Current_Ratio',
        outStatisticFieldName: 'avgRatio',
      },
      {
        statisticType: 'stddev',
        onStatisticField: 'Current_Ratio',
        outStatisticFieldName: 'ratioStdDev',
      },
      {
        statisticType: 'avg',
        onStatisticField: 'CENTROID_Y',
        outStatisticFieldName: 'avgLat',
      },
      {
        statisticType: 'avg',
        onStatisticField: 'CENTROID_X',
        outStatisticFieldName: 'avgLng',
      },
      {
        statisticType: 'avg',
        onStatisticField: 'TotalMarketValue',
        outStatisticFieldName: 'avgMarketValue',
      },
    ]),
    havingClause: `COUNT(OBJECTID) >= ${Math.max(10, minParcelCount)}`,
    orderByFields: 'parcelCount DESC',
    returnGeometry: 'false',
    f: 'json',
  });

  const response = await fetchArcGisQuery<{
    features?: Array<{
      attributes?: {
        neighborhood?: string;
        Property_Type?: string;
        parcelCount?: number;
        avgRatio?: number;
        ratioStdDev?: number;
        avgLat?: number;
        avgLng?: number;
        avgMarketValue?: number;
      };
    }>;
  }>(params);

  const areas =
    response.features
      ?.map((feature) => {
        const attributes = feature.attributes;
        if (
          !attributes?.neighborhood ||
          !attributes.Property_Type ||
          typeof attributes.parcelCount !== 'number' ||
          typeof attributes.avgRatio !== 'number' ||
          typeof attributes.avgLat !== 'number' ||
          typeof attributes.avgLng !== 'number'
        ) {
          return null;
        }

        const propertyTypeCategory = normalizeGeoEquityPropertyType(attributes.Property_Type);
        return {
          id: `${attributes.neighborhood}:${propertyTypeCategory}`,
          name: `Neighborhood ${attributes.neighborhood}`,
          neighborhoodCode: attributes.neighborhood,
          propertyType: attributes.Property_Type,
          propertyTypeCategory,
          equityRatio: Number(attributes.avgRatio.toFixed(4)),
          ratioStdDev: Number((attributes.ratioStdDev ?? 0).toFixed(4)),
          parcelCount: Math.round(attributes.parcelCount),
          averageMarketValue: Number((attributes.avgMarketValue ?? 0).toFixed(2)),
          center: [Number(attributes.avgLat.toFixed(6)), Number(attributes.avgLng.toFixed(6))] as [number, number],
        } satisfies GeoEquityArea;
      })
      .filter((area): area is GeoEquityArea => area !== null) ?? [];

  return {
    count: areas.length,
    asOf: new Date().toISOString(),
    source: 'Benton County ArcGIS AssessorPropVal grouped by neighborhood and property type',
    areas,
  };
}

async function getArcGisGeometryHealth(minParcelCount = 50): Promise<GeometryHealthResponse> {
  const overviewParams = new URLSearchParams({
    where: 'neighborhood IS NOT NULL',
    outStatistics: JSON.stringify([
      {
        statisticType: 'count',
        onStatisticField: 'OBJECTID',
        outStatisticFieldName: 'totalParcels',
      },
      {
        statisticType: 'sum',
        onStatisticField:
          'CASE WHEN Shape__Area > 0 AND CENTROID_X IS NOT NULL AND CENTROID_Y IS NOT NULL THEN 1 ELSE 0 END',
        outStatisticFieldName: 'parcelsWithGeometry',
      },
      {
        statisticType: 'sum',
        onStatisticField: 'CASE WHEN recalc_error_flag = 1 THEN 1 ELSE 0 END',
        outStatisticFieldName: 'flaggedGeometryRecords',
      },
    ]),
    returnGeometry: 'false',
    f: 'json',
  });

  const areaParams = new URLSearchParams({
    where: 'neighborhood IS NOT NULL',
    groupByFieldsForStatistics: 'neighborhood',
    outStatistics: JSON.stringify([
      {
        statisticType: 'count',
        onStatisticField: 'OBJECTID',
        outStatisticFieldName: 'totalParcels',
      },
      {
        statisticType: 'sum',
        onStatisticField:
          'CASE WHEN Shape__Area > 0 AND CENTROID_X IS NOT NULL AND CENTROID_Y IS NOT NULL THEN 1 ELSE 0 END',
        outStatisticFieldName: 'parcelsWithGeometry',
      },
      {
        statisticType: 'sum',
        onStatisticField: 'CASE WHEN recalc_error_flag = 1 THEN 1 ELSE 0 END',
        outStatisticFieldName: 'flaggedGeometryRecords',
      },
      {
        statisticType: 'avg',
        onStatisticField: 'CENTROID_Y',
        outStatisticFieldName: 'avgLat',
      },
      {
        statisticType: 'avg',
        onStatisticField: 'CENTROID_X',
        outStatisticFieldName: 'avgLng',
      },
    ]),
    havingClause: `COUNT(OBJECTID) >= ${Math.max(25, minParcelCount)}`,
    orderByFields: 'totalParcels DESC',
    returnGeometry: 'false',
    f: 'json',
  });

  const [overviewResponse, areasResponse] = await Promise.all([
    fetchArcGisQuery<{
      features?: Array<{
        attributes?: {
          totalParcels?: number;
          parcelsWithGeometry?: number;
          flaggedGeometryRecords?: number;
        };
      }>;
    }>(overviewParams),
    fetchArcGisQuery<{
      features?: Array<{
        attributes?: {
          neighborhood?: string;
          totalParcels?: number;
          parcelsWithGeometry?: number;
          flaggedGeometryRecords?: number;
          avgLat?: number;
          avgLng?: number;
        };
      }>;
    }>(areaParams),
  ]);

  const overview = overviewResponse.features?.[0]?.attributes;
  const totalParcels = Math.round(overview?.totalParcels ?? 0);
  const parcelsWithGeometry = Math.round(overview?.parcelsWithGeometry ?? 0);
  const flaggedGeometryRecords = Math.round(overview?.flaggedGeometryRecords ?? 0);

  const areaStats =
    areasResponse.features
      ?.map((feature) => {
        const attributes = feature.attributes;
        if (
          !attributes?.neighborhood ||
          typeof attributes.totalParcels !== 'number' ||
          typeof attributes.avgLat !== 'number' ||
          typeof attributes.avgLng !== 'number'
        ) {
          return null;
        }

        const linked = Math.min(
          Math.round(attributes.totalParcels),
          Math.max(0, Math.round(attributes.parcelsWithGeometry ?? 0)),
        );

        return {
          id: attributes.neighborhood,
          name: `Neighborhood ${attributes.neighborhood}`,
          neighborhoodCode: attributes.neighborhood,
          totalParcels: Math.round(attributes.totalParcels),
          parcelsWithGeometry: linked,
          parcelsMissingGeometry: Math.max(0, Math.round(attributes.totalParcels) - linked),
          flaggedGeometryRecords: Math.max(0, Math.round(attributes.flaggedGeometryRecords ?? 0)),
          center: [Number(attributes.avgLat.toFixed(6)), Number(attributes.avgLng.toFixed(6))] as [number, number],
        } satisfies GeometryHealthArea;
      })
      .filter((area): area is GeometryHealthArea => area !== null) ?? [];

  return {
    totalParcels,
    parcelsWithGeometry,
    parcelsMissingGeometry: Math.max(0, totalParcels - parcelsWithGeometry),
    flaggedGeometryRecords,
    lastSyncTimestamp: new Date().toISOString(),
    source: 'Benton County ArcGIS AssessorPropVal geometry coverage and recalculation flags grouped by neighborhood',
    areaStats,
  };
}

async function searchMassAppraisalParcelsFromArcGis(
  request: MassAppraisalSearchRequest,
): Promise<MassAppraisalFeatureCollection> {
  const clauses: string[] = [];

  if (request.query?.trim()) {
    const escaped = request.query.trim().replace(/'/g, "''");
    clauses.push(`(Parcel_ID LIKE '%${escaped}%' OR situs_display LIKE '%${escaped}%')`);
  }

  if (request.propertyType?.trim()) {
    const escaped = request.propertyType.trim().replace(/'/g, "''");
    clauses.push(`Property_Type = '${escaped}'`);
  }

  const params = new URLSearchParams({
    where: clauses.length > 0 ? clauses.join(' AND ') : '1=1',
    outFields:
      'Parcel_ID,situs_display,Property_Type,neighborhood,zoning,Current_Ratio,MV_PPSF,TotalMarketValue,Shape__Area',
    returnGeometry: 'true',
    f: 'geojson',
    outSR: '4326',
    resultRecordCount: String(Math.min(Math.max(request.limit ?? 25, 5), 50)),
  });

  return fetchArcGisQuery<MassAppraisalFeatureCollection>(params);
}

// ============================================================================
// NOTE: DEFAULT fallback data removed in CC-13 (R1 Week 3).
// All service methods now propagate errors from the real backend.
// ============================================================================

// ============================================================================
// ATLAS SERVICE
// ============================================================================

export const atlasService = {
  /**
   * Get map layers configuration
   */
  getLayers: async (): Promise<MapLayer[]> => {
    try {
      return await atlasGet<MapLayer[]>('/layers');
    } catch {
      const response = await atlasGet<ArcGisLayerCatalogResponse>('/arcgis-layers');
      return normalizeArcGisLayerCatalog(response);
    }
  },

  /**
   * Search parcels by address, ID, or owner
   */
  searchParcels: async (request: ParcelSearchRequest): Promise<ParcelSearchResponse> => {
    return atlasPost<ParcelSearchResponse>('/parcels/search', request);
  },

  /**
   * Fetch a live Benton County mass-appraisal parcel slice with ArcGIS geometry.
   */
  searchMassAppraisalParcels: async (
    request: MassAppraisalSearchRequest,
  ): Promise<MassAppraisalFeatureCollection> => {
    try {
      return await atlasPost<MassAppraisalFeatureCollection>('/mass-appraisal/parcels', request);
    } catch {
      return searchMassAppraisalParcelsFromArcGis(request);
    }
  },

  /**
   * Get parcel detail by ID
   */
  getParcel: async (parcelId: string): Promise<ParcelResult | null> => {
    try {
      return await atlasGet<ParcelResult>(`/parcels/${encodeURIComponent(parcelId)}`);
    } catch (err) {
      if (err instanceof Error && err.message.includes('404')) return null;
      throw err;
    }
  },

  /**
   * Get zoning districts
   */
  getZoningDistricts: async (): Promise<ZoningDistrict[]> => {
    return atlasGet<ZoningDistrict[]>('/zoning');
  },

  /**
   * Get flood zones
   */
  getFloodZones: async (): Promise<FloodZone[]> => {
    return atlasGet<FloodZone[]>('/flood-zones');
  },

  /**
   * Get spatial statistics for the county
   */
  getStats: async (): Promise<SpatialStats> => {
    return atlasGet<SpatialStats>('/stats');
  },

  /**
   * Get county posture for Mass Appraisal GIS, preferring the backend Atlas API
   * and falling back to the live Benton ArcGIS layer when stats are unavailable.
   */
  getMassAppraisalStats: async (): Promise<SpatialStats> => {
    try {
      return await atlasGet<SpatialStats>('/stats');
    } catch {
      return getArcGisMassAppraisalStats();
    }
  },

  /**
   * Get live GeoEquity grouped areas, preferring the backend Atlas API and
   * falling back to a direct Benton ArcGIS aggregation when needed.
   */
  getGeoEquityAreas: async (minParcelCount = 25): Promise<GeoEquityResponse> => {
    try {
      return await atlasGet<GeoEquityResponse>(`/geo-equity/areas?minParcelCount=${Math.max(10, minParcelCount)}`);
    } catch {
      return getArcGisGeoEquityAreas(minParcelCount);
    }
  },

  /**
   * Get live geometry coverage posture, preferring the backend Atlas API and
   * falling back to direct Benton ArcGIS aggregation when needed.
   */
  getGeometryHealth: async (minParcelCount = 50): Promise<GeometryHealthResponse> => {
    try {
      return await atlasGet<GeometryHealthResponse>(
        `/geometry-health?minParcelCount=${Math.max(25, minParcelCount)}`,
      );
    } catch {
      return getArcGisGeometryHealth(minParcelCount);
    }
  },

  getLayerConfigs: async (): Promise<LayerConfigsResponse> => {
    return atlasGet<LayerConfigsResponse>('/arcgis/layer-configs');
  },

  getParcelSpatialProfile: async (parcelId: string): Promise<ParcelSpatialProfileResponse> => {
    return atlasGet<ParcelSpatialProfileResponse>(`/parcels/${encodeURIComponent(parcelId)}/spatial-profile`);
  },

  getParcelLensRecord: async (parcelId: string): Promise<ParcelLensRecord> => {
    return fetchArcGisParcelRecord(parcelId);
  },

  executeTerraQuerySearch: async (
    request: ArcGisSearchRequest,
  ): Promise<TerraQuerySearchResult> => {
    return fetchArcGisSearchRecords(request);
  },

  getLiveExportLayers: async (): Promise<LiveAtlasExportLayer[]> => {
    const response = await atlasGet<LayerConfigsResponse>('/arcgis/layer-configs');
    const layers = response.layers.map((layer) => ({
      id: layer.Id ?? layer.Name ?? 'unknown-layer',
      name: layer.Name ?? layer.Id ?? 'Unknown Layer',
      serviceUrl: layer.serviceUrl ?? '',
      queryUrl: layer.queryUrl ?? '',
      fields: layer.Fields ?? [],
      geometryType: layer.GeometryType,
      source: response.source,
    }));

    const counts = await Promise.all(
      layers.map(async (layer) => ({
        id: layer.id,
        featureCount: layer.serviceUrl ? await fetchArcGisLayerCount(layer.serviceUrl) : undefined,
      })),
    );

    const countMap = new Map(counts.map((entry) => [entry.id, entry.featureCount]));
    return layers.map((layer) => ({
      ...layer,
      featureCount: countMap.get(layer.id),
    }));
  },

  exportAtlasLayer: async (
    layer: LiveAtlasExportLayer,
    format: AtlasExportFormat,
  ): Promise<AtlasLayerExportArtifact> => {
    return buildAtlasLayerExportArtifact(layer, format);
  },
};

export default atlasService;
