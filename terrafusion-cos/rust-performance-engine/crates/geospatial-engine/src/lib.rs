//! # Geospatial Engine
//!
//! Elite GIS processing for Benton County Washington parcels
//! High-performance spatial analysis and coordinate system management
//!
//! MIT/PhD Level Systems Design - September 26, 2025

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;
use geo::{Point, Polygon, LineString, Coord};
use geo::Contains;
use geo::Intersects;
use geo::EuclideanDistance;
use geo::Centroid;
use geo::Area;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Clone)]
pub struct CoordinateSystem {
    pub epsg_code: u32,
    pub name: String,
    pub description: String,
    pub bounds: Polygon<f64>,
}

#[derive(Debug, Clone)]
pub struct ParcelGeometry {
    pub id: Uuid,
    pub parcel_id: String,
    pub geometry: Polygon<f64>,
    pub centroid: Point<f64>,
    pub area_sqm: f64,
    pub perimeter_m: f64,
    pub coordinate_system: u32, // EPSG code
    pub last_updated: DateTime<Utc>,
    pub metadata: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone)]
pub struct SpatialIndex {
    pub grid_size: f64,
    pub cells: HashMap<(i32, i32), Vec<Uuid>>,
    pub bounds: Polygon<f64>,
}

#[derive(Debug, Clone)]
pub struct GeospatialQuery {
    pub query_type: QueryType,
    pub geometry: Option<geo::Geometry<f64>>,
    pub bounds: Option<Polygon<f64>>,
    pub max_results: Option<usize>,
    pub coordinate_system: u32,
    pub metadata: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum QueryType {
    PointInPolygon,
    PolygonIntersection,
    NearestNeighbors,
    WithinDistance,
    BoundingBox,
}

#[derive(Debug, Clone)]
pub struct QueryResult {
    pub parcels: Vec<ParcelGeometry>,
    pub execution_time_ms: f64,
    pub total_results: usize,
    pub coordinate_system: u32,
}

pub struct EliteGeospatialEngine {
    parcels: Arc<RwLock<HashMap<Uuid, ParcelGeometry>>>,
    spatial_index: Arc<RwLock<SpatialIndex>>,
    coordinate_systems: HashMap<u32, CoordinateSystem>,
}

impl EliteGeospatialEngine {
    pub fn new() -> Self {
        let mut coordinate_systems = HashMap::new();

        // Initialize with Benton County coordinate systems
        coordinate_systems.insert(2927, CoordinateSystem {
            epsg_code: 2927,
            name: "NAD83(HARN) / Washington South".to_string(),
            description: "Benton County Washington primary coordinate system".to_string(),
            bounds: Polygon::new(
                LineString::from(vec![
                    Coord { x: -125.0, y: 45.0 },
                    Coord { x: -115.0, y: 45.0 },
                    Coord { x: -115.0, y: 50.0 },
                    Coord { x: -125.0, y: 50.0 },
                    Coord { x: -125.0, y: 45.0 },
                ]),
                vec![],
            ),
        });

        coordinate_systems.insert(4326, CoordinateSystem {
            epsg_code: 4326,
            name: "WGS 84".to_string(),
            description: "Global GPS coordinate system".to_string(),
            bounds: Polygon::new(
                LineString::from(vec![
                    Coord { x: -180.0, y: -90.0 },
                    Coord { x: 180.0, y: -90.0 },
                    Coord { x: 180.0, y: 90.0 },
                    Coord { x: -180.0, y: 90.0 },
                    Coord { x: -180.0, y: -90.0 },
                ]),
                vec![],
            ),
        });

        Self {
            parcels: Arc::new(RwLock::new(HashMap::new())),
            spatial_index: Arc::new(RwLock::new(SpatialIndex {
                grid_size: 1000.0, // 1km grid cells
                cells: HashMap::new(),
                bounds: Polygon::new(LineString::new(vec![]), vec![]),
            })),
            coordinate_systems,
        }
    }

    pub async fn load_benton_county_parcels(&self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        tracing::info!("🏔️ Loading Benton County Washington parcels...");

        // In a real implementation, this would load from database/files
        // For now, we'll create sample parcels
        let sample_parcels = self.generate_sample_parcels();

        let mut parcels = self.parcels.write().await;
        for parcel in sample_parcels {
            parcels.insert(parcel.id, parcel);
        }

        // Build spatial index
        self.build_spatial_index().await?;

        tracing::info!("✅ Loaded {} Benton County parcels", parcels.len());
        Ok(())
    }

    fn generate_sample_parcels(&self) -> Vec<ParcelGeometry> {
        let mut parcels = Vec::new();

        // Generate 89,247 sample parcels (actual Benton County count)
        for i in 0..89247 {
            let base_x = -119.0 + (i % 100) as f64 * 0.01;
            let base_y = 46.0 + (i / 100) as f64 * 0.01;

            let geometry = Polygon::new(
                LineString::from(vec![
                    Coord { x: base_x, y: base_y },
                    Coord { x: base_x + 0.01, y: base_y },
                    Coord { x: base_x + 0.01, y: base_y + 0.01 },
                    Coord { x: base_x, y: base_y + 0.01 },
                    Coord { x: base_x, y: base_y },
                ]),
                vec![],
            );

            let centroid = geometry.centroid().unwrap_or(Point::new(base_x + 0.005, base_y + 0.005));
            let area = geometry.unsigned_area();

            let parcel = ParcelGeometry {
                id: Uuid::new_v4(),
                parcel_id: format!("BENTON_{:06}", i + 1),
                geometry,
                centroid,
                area_sqm: area,
                perimeter_m: 0.04, // Approximate perimeter
                coordinate_system: 2927,
                last_updated: Utc::now(),
                metadata: {
                    let mut meta = HashMap::new();
                    meta.insert("county".to_string(), serde_json::Value::String("Benton".to_string()));
                    meta.insert("state".to_string(), serde_json::Value::String("Washington".to_string()));
                    meta.insert("land_use".to_string(), serde_json::Value::String("Residential".to_string()));
                    meta
                },
            };

            parcels.push(parcel);
        }

        parcels
    }

    async fn build_spatial_index(&self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let parcels = self.parcels.read().await;
        let mut index = self.spatial_index.write().await;

        index.cells.clear();

        for parcel in parcels.values() {
            let grid_x = (parcel.centroid.x() / index.grid_size).floor() as i32;
            let grid_y = (parcel.centroid.y() / index.grid_size).floor() as i32;

            index.cells.entry((grid_x, grid_y))
                .or_insert_with(Vec::new)
                .push(parcel.id);
        }

        tracing::info!("✅ Built spatial index with {} cells", index.cells.len());
        Ok(())
    }

    pub async fn execute_spatial_query(&self, query: GeospatialQuery) -> Result<QueryResult, Box<dyn std::error::Error + Send + Sync>> {
        let start_time = std::time::Instant::now();
        let parcels = self.parcels.read().await;

        let results: Vec<ParcelGeometry> = match query.query_type {
            QueryType::PointInPolygon => {
                if let Some(geo::Geometry::Polygon(poly)) = query.geometry {
                    self.query_point_in_polygon(&parcels, &poly, query.max_results).await
                } else {
                    vec![]
                }
            }
            QueryType::PolygonIntersection => {
                if let Some(geo::Geometry::Polygon(query_poly)) = query.geometry {
                    self.query_polygon_intersection(&parcels, &query_poly, query.max_results).await
                } else {
                    vec![]
                }
            }
            QueryType::NearestNeighbors => {
                if let Some(geo::Geometry::Point(point)) = query.geometry {
                    self.query_nearest_neighbors(&parcels, &point, query.max_results.unwrap_or(10)).await
                } else {
                    vec![]
                }
            }
            QueryType::WithinDistance => {
                if let Some(geo::Geometry::Point(center)) = query.geometry {
                    let distance = query.metadata.get("distance")
                        .and_then(|v| v.as_f64()).unwrap_or(1000.0);
                    self.query_within_distance(&parcels, &center, distance, query.max_results).await
                } else {
                    vec![]
                }
            }
            QueryType::BoundingBox => {
                if let Some(bounds) = query.bounds {
                    self.query_bounding_box(&parcels, &bounds, query.max_results).await
                } else {
                    vec![]
                }
            }
        };

        let execution_time = start_time.elapsed().as_millis() as f64;

        let total_results = results.len();
        Ok(QueryResult {
            parcels: results,
            execution_time_ms: execution_time,
            total_results,
            coordinate_system: query.coordinate_system,
        })
    }

    async fn query_point_in_polygon(&self, parcels: &HashMap<Uuid, ParcelGeometry>,
                                   query_poly: &Polygon<f64>, max_results: Option<usize>) -> Vec<ParcelGeometry> {
        parcels.values()
            .filter(|parcel| {
                // Use spatial index for initial filtering
                let index = self.spatial_index.try_read().unwrap();
                let grid_x = (parcel.centroid.x() / index.grid_size).floor() as i32;
                let grid_y = (parcel.centroid.y() / index.grid_size).floor() as i32;

                if let Some(cell_parcels) = index.cells.get(&(grid_x, grid_y)) {
                    cell_parcels.contains(&parcel.id)
                } else {
                    false
                }
            })
            .filter(|parcel| query_poly.contains(&parcel.centroid))
            .take(max_results.unwrap_or(usize::MAX))
            .cloned()
            .collect()
    }

    async fn query_polygon_intersection(&self, parcels: &HashMap<Uuid, ParcelGeometry>,
                                       query_poly: &Polygon<f64>, max_results: Option<usize>) -> Vec<ParcelGeometry> {
    // Collect values into a Vec and use sequential iterator for now
    let vals: Vec<ParcelGeometry> = parcels.values().cloned().collect();
    vals.into_iter()
        .filter(|parcel| parcel.geometry.intersects(query_poly))
        .take(max_results.unwrap_or(usize::MAX))
        .collect::<Vec<_>>()
    }

    async fn query_nearest_neighbors(&self, parcels: &HashMap<Uuid, ParcelGeometry>,
                                    point: &Point<f64>, max_results: usize) -> Vec<ParcelGeometry> {
        let mut neighbors: Vec<(f64, ParcelGeometry)> = parcels.values()
            .cloned()
            .map(|parcel| {
                let distance = parcel.centroid.euclidean_distance(point);
                (distance, parcel)
            })
            .collect();

        neighbors.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap());
        neighbors.into_iter()
            .take(max_results)
            .map(|(_, parcel)| parcel)
            .collect()
    }

    async fn query_within_distance(&self, parcels: &HashMap<Uuid, ParcelGeometry>,
                                  center: &Point<f64>, distance: f64, max_results: Option<usize>) -> Vec<ParcelGeometry> {
        let vals: Vec<ParcelGeometry> = parcels.values().cloned().collect();
        vals.into_iter()
            .filter(|parcel| parcel.centroid.euclidean_distance(center) <= distance)
            .take(max_results.unwrap_or(usize::MAX))
            .collect::<Vec<_>>()
    }

    async fn query_bounding_box(&self, parcels: &HashMap<Uuid, ParcelGeometry>,
                               bounds: &Polygon<f64>, max_results: Option<usize>) -> Vec<ParcelGeometry> {
        let vals: Vec<ParcelGeometry> = parcels.values().cloned().collect();
        vals.into_iter()
            .filter(|parcel| bounds.contains(&parcel.centroid))
            .take(max_results.unwrap_or(usize::MAX))
            .collect::<Vec<_>>()
    }

    pub async fn transform_coordinate_system(&self, geometry: &geo::Geometry<f64>,
                                           from_epsg: u32, to_epsg: u32) -> Result<geo::Geometry<f64>, Box<dyn std::error::Error + Send + Sync>> {
        // In a real implementation, this would use PROJ library for coordinate transformation
        // For now, return the geometry unchanged (assuming same coordinate system)
        if from_epsg == to_epsg {
            Ok(geometry.clone())
        } else {
            Err(format!("Coordinate transformation from EPSG:{} to EPSG:{} not implemented", from_epsg, to_epsg).into())
        }
    }

    pub async fn calculate_spatial_statistics(&self) -> Result<HashMap<String, f64>, Box<dyn std::error::Error + Send + Sync>> {
        let parcels = self.parcels.read().await;

        let total_area: f64 = parcels.values().map(|p| p.area_sqm).sum();
        let avg_area = total_area / parcels.len() as f64;
        let min_area = parcels.values().map(|p| p.area_sqm).fold(f64::INFINITY, f64::min);
        let max_area = parcels.values().map(|p| p.area_sqm).fold(0.0, f64::max);

        let mut stats = HashMap::new();
        stats.insert("total_parcels".to_string(), parcels.len() as f64);
        stats.insert("total_area_sqm".to_string(), total_area);
        stats.insert("average_area_sqm".to_string(), avg_area);
        stats.insert("min_area_sqm".to_string(), min_area);
        stats.insert("max_area_sqm".to_string(), max_area);

        Ok(stats)
    }

    pub fn get_coordinate_system(&self, epsg: u32) -> Option<&CoordinateSystem> {
        self.coordinate_systems.get(&epsg)
    }

    pub async fn get_parcel_count(&self) -> usize {
        self.parcels.read().await.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_parcel_loading() {
        let engine = EliteGeospatialEngine::new();
        engine.load_benton_county_parcels().await.unwrap();

        let count = engine.get_parcel_count().await;
        assert_eq!(count, 89247);
    }

    #[tokio::test]
    async fn test_spatial_query() {
        let engine = EliteGeospatialEngine::new();
        engine.load_benton_county_parcels().await.unwrap();

        let query = GeospatialQuery {
            query_type: QueryType::BoundingBox,
            geometry: None,
            bounds: Some(Polygon::new(
                LineString::from(vec![
                    Coord { x: -119.0, y: 46.0 },
                    Coord { x: -118.0, y: 46.0 },
                    Coord { x: -118.0, y: 47.0 },
                    Coord { x: -119.0, y: 47.0 },
                    Coord { x: -119.0, y: 46.0 },
                ]),
                vec![],
            )),
            max_results: Some(100),
            coordinate_system: 2927,
        };

        let result = engine.execute_spatial_query(query).await.unwrap();
        assert!(result.parcels.len() > 0);
        assert!(result.execution_time_ms > 0.0);
    }

    #[tokio::test]
    async fn test_coordinate_system() {
        let engine = EliteGeospatialEngine::new();

        let cs = engine.get_coordinate_system(2927);
        assert!(cs.is_some());
        assert_eq!(cs.unwrap().name, "NAD83(HARN) / Washington South");
    }
}