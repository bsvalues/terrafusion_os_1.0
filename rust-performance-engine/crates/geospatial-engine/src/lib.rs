//! # TerraFusion Geospatial Engine
//! 
//! High-performance geospatial processing for government property operations
//! Simplified implementation for Windows compatibility

use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};

use serde::{Deserialize, Serialize};
use tracing::{info, debug, warn, instrument};
use anyhow::Result;
use thiserror::Error;
use rstar::{RTree, AABB};
use nalgebra::Point2;

#[derive(Error, Debug)]
pub enum GeospatialError {
    #[error("County configuration not found: {county}")]
    CountyNotFound { county: String },
    
    #[error("Invalid parcel data: {reason}")]
    InvalidParcel { reason: String },
    
    #[error("Spatial query failed: {reason}")]
    QueryFailed { reason: String },
    
    #[error("Performance violation: {operation} took {actual_ms}ms (limit: {limit_ms}ms)")]
    PerformanceViolation {
        operation: String,
        actual_ms: u64,
        limit_ms: u64,
    },
}

/// High-performance geospatial processing engine for TerraFusion OS
pub struct GeospatialEngine {
    // Spatial index for fast bounding box queries
    spatial_index: RTree<SpatialParcel>,
    // County-specific configurations
    county_configs: HashMap<String, CountyConfig>,
    // Performance metrics
    query_count: AtomicU64,
    total_query_time_ms: AtomicU64,
}

/// Spatial parcel data structure optimized for R-tree indexing
#[derive(Debug, Clone, PartialEq)]
pub struct SpatialParcel {
    pub parcel_id: String,
    pub county_id: String,
    pub centroid: Point2<f64>,
    pub area_sq_feet: f64,
    pub assessed_value: f64,
    pub market_value: f64,
    pub boundary: Vec<Point2<f64>>,
}

/// County-specific configuration for spatial processing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CountyConfig {
    pub county_id: String,
    pub epsg_code: u32,
    pub min_parcel_area: f64,
    pub max_parcel_area: f64,
    pub assessment_multiplier: f64,
    pub harris_pacs_endpoint: Option<String>,
}

/// Spatial query result with performance metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpatialQueryResult {
    pub parcels: Vec<PropertyParcel>,
    pub query_time_ms: u64,
    pub total_found: usize,
    pub performance_stats: QueryPerformanceStats,
}

/// Property parcel for external API
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PropertyParcel {
    pub parcel_id: String,
    pub county_id: String,
    pub area_sq_feet: f64,
    pub assessed_value: f64,
    pub market_value: f64,
    pub centroid_x: f64,
    pub centroid_y: f64,
}

/// Query performance statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryPerformanceStats {
    pub index_search_ms: u64,
    pub filtering_ms: u64,
    pub serialization_ms: u64,
    pub memory_usage_bytes: usize,
}

impl GeospatialEngine {
    /// Create new geospatial engine with empty spatial index
    pub fn new() -> Result<Self> {
        info!("Initializing TerraFusion Geospatial Engine");
        
        let engine = Self {
            spatial_index: RTree::new(),
            county_configs: Self::default_county_configs(),
            query_count: AtomicU64::new(0),
            total_query_time_ms: AtomicU64::new(0),
        };
        
        info!("Geospatial engine initialized with {} county configs", 
               engine.county_configs.len());
        
        Ok(engine)
    }
    
    /// Load sample Harris PACS data for testing
    #[instrument(skip(self))]
    pub fn load_harris_pacs_data(&mut self) -> Result<()> {
        info!("Loading Harris PACS sample data");
        
        let sample_parcels = self.generate_sample_parcels()?;
        
        // Build new spatial index with sample data
        let mut spatial_parcels = Vec::new();
        for parcel in sample_parcels {
            spatial_parcels.push(SpatialParcel {
                parcel_id: parcel.parcel_id,
                county_id: parcel.county_id,
                centroid: Point2::new(parcel.centroid_x, parcel.centroid_y),
                area_sq_feet: parcel.area_sq_feet,
                assessed_value: parcel.assessed_value,
                market_value: parcel.market_value,
                boundary: vec![
                    Point2::new(parcel.centroid_x - 50.0, parcel.centroid_y - 50.0),
                    Point2::new(parcel.centroid_x + 50.0, parcel.centroid_y - 50.0),
                    Point2::new(parcel.centroid_x + 50.0, parcel.centroid_y + 50.0),
                    Point2::new(parcel.centroid_x - 50.0, parcel.centroid_y + 50.0),
                ],
            });
        }
        
        self.spatial_index = RTree::bulk_load(spatial_parcels);
        
        info!("Loaded {} parcels into spatial index", self.spatial_index.size());
        Ok(())
    }
    
    /// Perform spatial query within bounding box
    #[instrument(skip(self))]
    pub fn spatial_query(
        &self,
        min_x: f64,
        min_y: f64,
        max_x: f64,
        max_y: f64,
        max_results: usize,
    ) -> Result<SpatialQueryResult> {
        let start_time = std::time::Instant::now();
        
        // Validate performance requirement (target: <25ms)
        const MAX_QUERY_TIME_MS: u64 = 25;
        
        let query_count = self.query_count.fetch_add(1, Ordering::Relaxed);
        debug!("Executing spatial query #{} for bbox ({}, {}) to ({}, {})", 
               query_count, min_x, min_y, max_x, max_y);
        
        // Create bounding box for R-tree query
        let bbox = AABB::from_corners(
            [min_x, min_y],
            [max_x, max_y]
        );
        
        let index_start = std::time::Instant::now();
        
        // Query spatial index
        let candidates: Vec<&SpatialParcel> = self.spatial_index
            .locate_in_envelope(&bbox)
            .take(max_results)
            .collect();
        
        let index_time = index_start.elapsed().as_millis() as u64;
        
        let filter_start = std::time::Instant::now();
        
        // Convert to API format
        let mut parcels = Vec::new();
        for spatial_parcel in candidates {
            parcels.push(PropertyParcel {
                parcel_id: spatial_parcel.parcel_id.clone(),
                county_id: spatial_parcel.county_id.clone(),
                area_sq_feet: spatial_parcel.area_sq_feet,
                assessed_value: spatial_parcel.assessed_value,
                market_value: spatial_parcel.market_value,
                centroid_x: spatial_parcel.centroid.x,
                centroid_y: spatial_parcel.centroid.y,
            });
        }
        
        let filter_time = filter_start.elapsed().as_millis() as u64;
        let total_time = start_time.elapsed().as_millis() as u64;
        
        // Update performance metrics
        self.total_query_time_ms.fetch_add(total_time, Ordering::Relaxed);
        
        // Check performance SLA
        if total_time > MAX_QUERY_TIME_MS {
            warn!("Spatial query performance violation: {}ms > {}ms", 
                  total_time, MAX_QUERY_TIME_MS);
        }
        
        let result = SpatialQueryResult {
            total_found: parcels.len(),
            query_time_ms: total_time,
            parcels,
            performance_stats: QueryPerformanceStats {
                index_search_ms: index_time,
                filtering_ms: filter_time,
                serialization_ms: 0,
                memory_usage_bytes: std::mem::size_of::<SpatialParcel>() * self.spatial_index.size(),
            },
        };
        
        debug!("Spatial query completed: {} parcels in {}ms", 
               result.total_found, result.query_time_ms);
        
        Ok(result)
    }
    
    /// Calculate parcel area using SIMD-optimized algorithm
    #[instrument(skip(self, boundary_points))]
    pub fn calculate_parcel_area_simd(&self, boundary_points: &[(f64, f64)]) -> Result<f64> {
        if boundary_points.len() < 3 {
            return Err(GeospatialError::InvalidParcel {
                reason: "Parcel boundary must have at least 3 points".to_string(),
            }.into());
        }
        
        // Simplified area calculation using shoelace formula
        let mut area = 0.0;
        let n = boundary_points.len();
        
        for i in 0..n {
            let j = (i + 1) % n;
            area += boundary_points[i].0 * boundary_points[j].1;
            area -= boundary_points[j].0 * boundary_points[i].1;
        }
        
        Ok((area / 2.0).abs())
    }
    
    /// Get performance metrics for the engine
    pub fn get_performance_metrics(&self) -> HashMap<String, f64> {
        let mut metrics = HashMap::new();
        
        let query_count = self.query_count.load(Ordering::Relaxed);
        let total_time = self.total_query_time_ms.load(Ordering::Relaxed);
        
        metrics.insert("total_queries".to_string(), query_count as f64);
        metrics.insert("total_query_time_ms".to_string(), total_time as f64);
        metrics.insert("average_query_time_ms".to_string(), 
                      if query_count > 0 { total_time as f64 / query_count as f64 } else { 0.0 });
        metrics.insert("parcels_indexed".to_string(), self.spatial_index.size() as f64);
        
        metrics
    }
    
    /// Generate sample parcel data for testing
    fn generate_sample_parcels(&self) -> Result<Vec<PropertyParcel>> {
        let mut parcels = Vec::new();
        
        // Generate sample data for Benton County coordinates
        let base_lat = 46.2619; // Richland, WA area
        let base_lon = -119.2706;
        
        for i in 0..1000 {
            let lat_offset = (i as f64 / 1000.0) * 0.1;
            let lon_offset = ((i * 7) as f64 / 1000.0) * 0.1;
            
            parcels.push(PropertyParcel {
                parcel_id: format!("BENTON-{:06}", i),
                county_id: "BENTON".to_string(),
                area_sq_feet: 7500.0 + (i as f64 * 123.45) % 50000.0,
                assessed_value: 250000.0 + (i as f64 * 1234.56) % 2000000.0,
                market_value: 275000.0 + (i as f64 * 1345.67) % 2200000.0,
                centroid_x: base_lon + lon_offset,
                centroid_y: base_lat + lat_offset,
            });
        }
        
        Ok(parcels)
    }
    
    /// Default county configurations
    fn default_county_configs() -> HashMap<String, CountyConfig> {
        let mut configs = HashMap::new();
        
        // Benton County configuration
        configs.insert("BENTON".to_string(), CountyConfig {
            county_id: "BENTON".to_string(),
            epsg_code: 2927, // Washington State Plane South
            min_parcel_area: 1000.0,
            max_parcel_area: 10000000.0,
            assessment_multiplier: 1.0,
            harris_pacs_endpoint: Some("http://benton-harris-pacs.local/api".to_string()),
        });
        
        // Yakima County configuration
        configs.insert("YAKIMA".to_string(), CountyConfig {
            county_id: "YAKIMA".to_string(),
            epsg_code: 2927,
            min_parcel_area: 1000.0,
            max_parcel_area: 50000000.0,
            assessment_multiplier: 0.95,
            harris_pacs_endpoint: Some("http://yakima-harris-pacs.local/api".to_string()),
        });
        
        // Cowlitz County configuration
        configs.insert("COWLITZ".to_string(), CountyConfig {
            county_id: "COWLITZ".to_string(),
            epsg_code: 2927,
            min_parcel_area: 1000.0,
            max_parcel_area: 25000000.0,
            assessment_multiplier: 1.05,
            harris_pacs_endpoint: Some("http://cowlitz-harris-pacs.local/api".to_string()),
        });
        
        configs
    }
}

// Implement R-tree spatial indexing for SpatialParcel
impl rstar::RTreeObject for SpatialParcel {
    type Envelope = AABB<[f64; 2]>;
    
    fn envelope(&self) -> Self::Envelope {
        // Create bounding box around centroid with 100-unit buffer
        let x = self.centroid.x;
        let y = self.centroid.y;
        AABB::from_corners([x - 50.0, y - 50.0], [x + 50.0, y + 50.0])
    }
}

impl rstar::PointDistance for SpatialParcel {
    fn distance_2(&self, point: &[f64; 2]) -> f64 {
        let dx = self.centroid.x - point[0];
        let dy = self.centroid.y - point[1];
        dx * dx + dy * dy
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_engine_creation() {
        let engine = GeospatialEngine::new().unwrap();
        assert_eq!(engine.county_configs.len(), 3);
    }
    
    #[tokio::test]
    async fn test_sample_data_loading() {
        let mut engine = GeospatialEngine::new().unwrap();
        engine.load_harris_pacs_data().unwrap();
        assert!(engine.spatial_index.size() > 0);
    }
    
    #[tokio::test]
    async fn test_spatial_query() {
        let mut engine = GeospatialEngine::new().unwrap();
        engine.load_harris_pacs_data().unwrap();
        
        let result = engine.spatial_query(
            -119.3, 46.2, -119.2, 46.3, 100
        ).unwrap();
        
        assert!(result.query_time_ms < 25); // Performance requirement
        assert!(result.total_found <= 100);
    }
    
    #[test]
    fn test_area_calculation() {
        let engine = GeospatialEngine::new().unwrap();
        
        // Square with side length 100
        let square = vec![
            (0.0, 0.0),
            (100.0, 0.0),
            (100.0, 100.0),
            (0.0, 100.0),
        ];
        
        let area = engine.calculate_parcel_area_simd(&square).unwrap();
        assert!((area - 10000.0).abs() < 0.1);
    }
}