/**
 * Project one validated atlas.spatial-read@1.0.0 exchange to provider-neutral GeoJSON.
 * Validation and provider access remain outside this pure boundary.
 */
export function projectAtlasFeature(exchange) {
  const boundary = exchange.result.boundary;
  if (boundary.geometryState === 'unavailable') return null;

  const properties = {
    countyId: exchange.result.countyId,
    parcelId: exchange.result.parcelId,
    evidenceState: exchange.result.evidenceState,
  };

  if (boundary.geometryState === 'centroid_only') {
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [boundary.centroid.longitude, boundary.centroid.latitude],
      },
      properties,
    };
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [boundary.outerRing.map(point => [point.longitude, point.latitude])],
    },
    properties,
  };
}
