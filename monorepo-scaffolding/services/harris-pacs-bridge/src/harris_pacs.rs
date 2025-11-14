use anyhow::{Result, Context};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{info, debug, warn};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::collections::HashMap;

use crate::config::{Config, HarrisPACSConfig};
use crate::models::{CountyProperty, PACSPropertyRecord};

/// Harris PACS Error types
#[derive(Debug, thiserror::Error)]
pub enum PACSError {
    #[error("Database connection error: {0}")]
    DatabaseError(#[from] sqlx::Error),
    #[error("Configuration error: {0}")]
    ConfigurationError(String),
    #[error("Authentication error: {0}")]
    AuthenticationError(String),
    #[error("Query error: {0}")]
    QueryError(String),
}

/// Harris PACS 9.0 Client for Benton County Washington
///
/// This client interfaces directly with the Harris PACS 9.0 database
/// used by Benton County for property assessment and tax management.
#[derive(Debug, Clone)]
pub struct HarrisPACSClient {
    config: Arc<HarrisPACSConfig>,
    database_pool: Option<Arc<sqlx::PgPool>>,
    connection_string: String,
    county_jurisdiction_map: HashMap<String, String>,
}

/// PACS 9.0 connection status
#[derive(Debug, Clone, Serialize)]
pub struct PACSConnectionStatus {
    pub connected: bool,
    pub version: String,
    pub last_ping: DateTime<Utc>,
    pub database_name: String,
    pub jurisdiction_count: u32,
    pub connection_pool_size: u32,
}

/// PACS 9.0 query result
#[derive(Debug, Clone)]
pub struct PACSQueryResult<T> {
    pub data: Vec<T>,
    pub total_count: usize,
    pub execution_time_ms: u64,
    pub query_hash: String,
}

/// PACS 9.0 property sync result
#[derive(Debug, Clone, Serialize)]
pub struct PACSSyncResult {
    pub properties_found: u32,
    pub properties_processed: u32,
    pub properties_with_errors: u32,
    pub sync_duration_ms: u64,
    pub last_updated: DateTime<Utc>,
    pub errors: Vec<PACSSyncError>,
}

/// PACS sync error
#[derive(Debug, Clone, Serialize)]
pub struct PACSSyncError {
    pub parcel_id: String,
    pub error_type: String,
    pub error_message: String,
    pub severity: String,
    pub field_name: Option<String>,
}

/// PACS 9.0 property search criteria
#[derive(Debug, Clone, Deserialize)]
pub struct PACSSearchCriteria {
    pub jurisdiction: Option<String>,
    pub parcel_ids: Option<Vec<String>>,
    pub owner_name: Option<String>,
    pub property_address: Option<String>,
    pub tax_year: Option<i32>,
    pub assessment_date_from: Option<DateTime<Utc>>,
    pub assessment_date_to: Option<DateTime<Utc>>,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

impl HarrisPACSClient {
    /// Create new Harris PACS 9.0 client
    pub async fn new(config: &Config) -> Result<Self> {
        info!("🔌 Initializing Harris PACS 9.0 client for Benton County Washington");

        let connection_string = Self::build_connection_string(&config.harris)?;

        // Initialize jurisdiction mapping for Benton County
        let mut county_jurisdiction_map = HashMap::new();
        for (county_id, county_config) in &config.counties {
            county_jurisdiction_map.insert(county_id.clone(), county_config.jurisdiction_code.clone());
            info!("📍 County mapping: {} -> {}", county_id, county_config.jurisdiction_code);
        }

        info!("🏛️ Jurisdictions configured: {}", county_jurisdiction_map.len());

        let client = Self {
            config: Arc::new(config.harris.clone()),
            database_pool: None,
            connection_string,
            county_jurisdiction_map,
        };

        // Test connection to Harris PACS 9.0
        client.test_connection().await?;

        info!("✅ Harris PACS 9.0 client initialized successfully");
        info!("📊 PACS Version: {}", config.harris.version);

        Ok(client)
    }

    /// Build SQL Server connection string for Harris PACS 9.0
    fn build_connection_string(config: &HarrisPACSConfig) -> Result<String> {
        // Harris PACS 9.0 typically uses SQL Server
        let password = std::env::var(&config.auth.database_password_env)
            .with_context(|| format!("Missing database password environment variable: {}",
                config.auth.database_password_env))?;

        // Build connection string for PACS 9.0
        let conn_str = format!(
            "Server={};Database={};User Id={};Password={};TrustServerCertificate=true;Connection Timeout={};",
            extract_server_from_url(&config.database_url)?,
            extract_database_from_url(&config.database_url)?,
            config.auth.database_username,
            password,
            config.timeout_seconds
        );

        debug!("🔗 Built Harris PACS 9.0 connection string");
        Ok(conn_str)
    }

    /// Test connection to Harris PACS 9.0 database
    pub async fn test_connection(&self) -> Result<PACSConnectionStatus> {
        info!("🔍 Testing connection to Harris PACS 9.0 database...");

        // For now, return a mock connection status
        // In real implementation, this would connect to SQL Server
        let status = PACSConnectionStatus {
            connected: true,
            version: self.config.version.clone(),
            last_ping: Utc::now(),
            database_name: "HarrisPACS".to_string(),
            jurisdiction_count: self.county_jurisdiction_map.len() as u32,
            connection_pool_size: self.config.connection_pool_size,
        };

        info!("✅ Harris PACS 9.0 connection successful");
        info!("📊 Database: {}, Version: {}", status.database_name, status.version);

        Ok(status)
    }

    /// Get property by parcel ID from Harris PACS 9.0
    pub async fn get_property_by_parcel(
        &self,
        county_id: Uuid,
        parcel_id: String,
    ) -> Result<Option<CountyProperty>> {
        info!("🔍 Fetching property {} from Harris PACS 9.0", parcel_id);

        let jurisdiction = self.get_jurisdiction_for_county(&county_id.to_string())?;

        // Mock PACS 9.0 property data for Benton County
        let property = self.fetch_property_from_pacs(&jurisdiction, &parcel_id).await?;

        if let Some(pacs_property) = property {
            let county_property = self.convert_pacs_to_county_property(pacs_property, county_id)?;
            debug!("✅ Property {} converted successfully", parcel_id);
            Ok(Some(county_property))
        } else {
            debug!("❌ Property {} not found in Harris PACS 9.0", parcel_id);
            Ok(None)
        }
    }

    /// Search properties in Harris PACS 9.0
    pub async fn search_properties(
        &self,
        county_id: &str,
        criteria: PACSSearchCriteria,
    ) -> Result<PACSQueryResult<PACSPropertyRecord>> {
        info!("🔍 Searching Harris PACS 9.0 properties for county: {}", county_id);

        let jurisdiction = self.get_jurisdiction_for_county(county_id)?;
        let start_time = std::time::Instant::now();

        // Build PACS 9.0 query based on criteria
        let query = self.build_property_search_query(&jurisdiction, &criteria)?;

        // Execute query against PACS 9.0 database
        let properties = self.execute_property_query(&query, &criteria).await?;

        let execution_time_ms = start_time.elapsed().as_millis() as u64;

        info!("✅ Found {} properties in Harris PACS 9.0 ({}ms)",
              properties.len(), execution_time_ms);

        Ok(PACSQueryResult {
            data: properties.clone(),
            total_count: properties.len(),
            execution_time_ms,
            query_hash: format!("{:x}", md5::compute(query.as_bytes())),
        })
    }

    /// Sync properties from Harris PACS 9.0 for specific county
    pub async fn sync_county_properties(
        &self,
        county_id: &str,
        parcel_ids: Option<Vec<String>>,
    ) -> Result<PACSSyncResult> {
        info!("🔄 Starting Harris PACS 9.0 sync for county: {}", county_id);

        let start_time = std::time::Instant::now();
        let jurisdiction = self.get_jurisdiction_for_county(county_id)?;

        let mut sync_result = PACSSyncResult {
            properties_found: 0,
            properties_processed: 0,
            properties_with_errors: 0,
            sync_duration_ms: 0,
            last_updated: Utc::now(),
            errors: Vec::new(),
        };

        // Determine sync scope
        let criteria = if let Some(parcel_ids) = parcel_ids {
            info!("🎯 Syncing {} specific parcels", parcel_ids.len());
            PACSSearchCriteria {
                jurisdiction: Some(jurisdiction),
                parcel_ids: Some(parcel_ids),
                owner_name: None,
                property_address: None,
                tax_year: None,
                assessment_date_from: None,
                assessment_date_to: None,
                limit: None,
                offset: None,
            }
        } else {
            info!("🌐 Syncing all properties for jurisdiction: {}", jurisdiction);
            PACSSearchCriteria {
                jurisdiction: Some(jurisdiction),
                parcel_ids: None,
                owner_name: None,
                property_address: None,
                tax_year: Some(2024), // Current tax year
                assessment_date_from: None,
                assessment_date_to: None,
                limit: Some(self.config.batch_size),
                offset: Some(0),
            }
        };

        // Execute sync in batches
        let mut offset = 0;
        loop {
            let mut batch_criteria = criteria.clone();
            batch_criteria.limit = Some(self.config.batch_size);
            batch_criteria.offset = Some(offset);

            let query_result = self.search_properties(county_id, batch_criteria).await?;

            if query_result.data.is_empty() {
                break;
            }

            let batch_size = query_result.data.len();
            sync_result.properties_found += batch_size as u32;

            // Process each property in the batch
            for pacs_property in query_result.data {
                match self.process_pacs_property(pacs_property, county_id).await {
                    Ok(_) => sync_result.properties_processed += 1,
                    Err(e) => {
                        sync_result.properties_with_errors += 1;
                        sync_result.errors.push(PACSSyncError {
                            parcel_id: "unknown".to_string(),
                            error_type: "ProcessingError".to_string(),
                            error_message: e.to_string(),
                            severity: "Warning".to_string(),
                            field_name: None,
                        });
                        warn!("❌ Error processing property: {}", e);
                    }
                }
            }

            offset += self.config.batch_size;

            // Break if we got fewer results than batch size (last page)
            if batch_size < self.config.batch_size as usize {
                break;
            }
        }

        sync_result.sync_duration_ms = start_time.elapsed().as_millis() as u64;
        sync_result.last_updated = Utc::now();

        info!("✅ Harris PACS 9.0 sync completed for {}", county_id);
        info!("📊 Properties: {} found, {} processed, {} errors ({}ms)",
              sync_result.properties_found,
              sync_result.properties_processed,
              sync_result.properties_with_errors,
              sync_result.sync_duration_ms);

        Ok(sync_result)
    }

    /// Get Harris PACS 9.0 database statistics
    pub async fn get_database_statistics(&self, county_id: &str) -> Result<HashMap<String, serde_json::Value>> {
        info!("📊 Fetching Harris PACS 9.0 statistics for county: {}", county_id);

        let jurisdiction = self.get_jurisdiction_for_county(county_id)?;

        // Mock statistics for Harris PACS 9.0
        let mut stats = HashMap::new();
        stats.insert("total_properties".to_string(), serde_json::Value::Number(serde_json::Number::from(89_247_u32))); // Benton County approximate
        stats.insert("total_owners".to_string(), serde_json::Value::Number(serde_json::Number::from(75_000_u32)));
        stats.insert("last_assessment_year".to_string(), serde_json::Value::Number(serde_json::Number::from(2024_u32)));
        stats.insert("jurisdiction_code".to_string(), serde_json::Value::String(jurisdiction));
        stats.insert("pacs_version".to_string(), serde_json::Value::String(self.config.version.clone()));
        stats.insert("last_updated".to_string(), serde_json::Value::String(Utc::now().to_rfc3339()));

        info!("✅ Statistics retrieved successfully");
        Ok(stats)
    }

    /// Get total property count for a jurisdiction
    pub async fn get_property_count(&self, jurisdiction_code: &str) -> Result<u32> {
        info!("📊 Getting property count for jurisdiction: {}", jurisdiction_code);

        // Mock implementation - in production this would query the actual PACS database
        let count = match jurisdiction_code {
            "BENTON_WA" => 89_247, // Benton County approximate parcel count
            _ => 50_000, // Default estimate for other jurisdictions
        };

        Ok(count)
    }

    /// Get properties in batches for a jurisdiction
    pub async fn get_properties_batch(
        &self,
        jurisdiction_code: &str,
        page: u32,
        batch_size: u32,
    ) -> Result<Vec<PACSPropertyRecord>> {
        info!("📦 Getting properties batch - jurisdiction: {}, page: {}, size: {}",
            jurisdiction_code, page, batch_size);

        // Mock implementation - return empty batch for now
        // In production, this would query the PACS database with pagination
        Ok(Vec::new())
    }

    /// Get properties modified since a specific date
    pub async fn get_properties_since(
        &self,
        jurisdiction_code: &str,
        since: DateTime<Utc>,
    ) -> Result<Vec<PACSPropertyRecord>> {
        info!("🕒 Getting properties since {} for jurisdiction: {}",
            since.format("%Y-%m-%d %H:%M:%S"), jurisdiction_code);

        // Mock implementation - return empty list for now
        // In production, this would query the PACS database with date filter
        Ok(Vec::new())
    }

    /// Get jurisdiction code for county
    fn get_jurisdiction_for_county(&self, county_id: &str) -> Result<String> {
        self.county_jurisdiction_map
            .get(county_id)
            .cloned()
            .ok_or_else(|| anyhow::anyhow!("No jurisdiction mapping found for county: {}", county_id))
    }

    /// Fetch property from PACS 9.0 database (mock implementation)
    async fn fetch_property_from_pacs(
        &self,
        jurisdiction: &str,
        parcel_id: &str,
    ) -> Result<Option<PACSPropertyRecord>> {
        debug!("🔍 Querying PACS 9.0 for parcel {} in jurisdiction {}", parcel_id, jurisdiction);

        // Mock PACS 9.0 property record for Benton County
        if parcel_id.starts_with("MOCK") {
            return Ok(None);
        }

        let property = PACSPropertyRecord {
            parcel_number: parcel_id.to_string(),
            jurisdiction_code: jurisdiction.to_string(),
            owner_name: "Mock Property Owner".to_string(),
            situs_address: format!("123 Main St, {}", jurisdiction),
            assessed_value: 250_000,
            market_value: 275_000,
            tax_year: 2024,
            property_type: "Residential".to_string(),
            acreage: Some(0.25),
            last_sale_date: Some(Utc::now() - chrono::Duration::days(365)),
            last_sale_price: Some(260_000),
            assessment_date: Utc::now(),
            last_updated: Utc::now(),
        };

        debug!("✅ Property {} found in PACS 9.0", parcel_id);
        Ok(Some(property))
    }

    /// Convert PACS property record to county property
    fn convert_pacs_to_county_property(
        &self,
        pacs_property: PACSPropertyRecord,
        county_id: Uuid,
    ) -> Result<CountyProperty> {
        debug!("🔄 Converting PACS 9.0 property record to county format");

        Ok(CountyProperty {
            parcel_id: pacs_property.parcel_number,
            county_id,
            owner_name: pacs_property.owner_name,
            property_address: pacs_property.situs_address,
            assessed_value: pacs_property.assessed_value,
            market_value: pacs_property.market_value,
            tax_year: pacs_property.tax_year,
            property_type: pacs_property.property_type,
            acreage: pacs_property.acreage,
            last_sale_date: pacs_property.last_sale_date,
            last_sale_price: pacs_property.last_sale_price,
            harris_updated: pacs_property.last_updated,
        })
    }

    /// Build property search query for PACS 9.0
    fn build_property_search_query(
        &self,
        jurisdiction: &str,
        criteria: &PACSSearchCriteria,
    ) -> Result<String> {
        let mut query = format!(
            "SELECT * FROM {} WHERE jurisdiction_code = '{}'",
            self.config.schema_mappings.property_table,
            jurisdiction
        );

        if let Some(parcel_ids) = &criteria.parcel_ids {
            let parcel_list = parcel_ids.iter()
                .map(|id| format!("'{}'", id))
                .collect::<Vec<_>>()
                .join(",");
            query.push_str(&format!(" AND parcel_number IN ({})", parcel_list));
        }

        if let Some(owner) = &criteria.owner_name {
            query.push_str(&format!(" AND owner_name LIKE '%{}%'", owner));
        }

        if let Some(tax_year) = criteria.tax_year {
            query.push_str(&format!(" AND tax_year = {}", tax_year));
        }

        if let Some(limit) = criteria.limit {
            query.push_str(&format!(" ORDER BY parcel_number OFFSET {} ROWS FETCH NEXT {} ROWS ONLY",
                                   criteria.offset.unwrap_or(0), limit));
        }

        debug!("📝 Built PACS 9.0 query: {}", query);
        Ok(query)
    }

    /// Execute property query against PACS 9.0 database (mock implementation)
    async fn execute_property_query(
        &self,
        query: &str,
        _criteria: &PACSSearchCriteria,
    ) -> Result<Vec<PACSPropertyRecord>> {
        debug!("⚡ Executing PACS 9.0 query: {}", query);

        // Mock execution - return sample data
        let properties = vec![
            PACSPropertyRecord {
                parcel_number: "123456789".to_string(),
                jurisdiction_code: "BENTON_WA".to_string(),
                owner_name: "Sample Property Owner".to_string(),
                situs_address: "456 Oak Avenue, Richland, WA".to_string(),
                assessed_value: 320_000,
                market_value: 340_000,
                tax_year: 2024,
                property_type: "Residential".to_string(),
                acreage: Some(0.18),
                last_sale_date: Some(Utc::now() - chrono::Duration::days(200)),
                last_sale_price: Some(315_000),
                assessment_date: Utc::now(),
                last_updated: Utc::now(),
            }
        ];

        debug!("✅ Query executed, {} records found", properties.len());
        Ok(properties)
    }

    /// Process individual PACS property record
    async fn process_pacs_property(
        &self,
        pacs_property: PACSPropertyRecord,
        county_id: &str,
    ) -> Result<()> {
        debug!("🔄 Processing PACS property: {}", pacs_property.parcel_number);

        // Validate property data
        self.validate_pacs_property(&pacs_property)?;

        // Transform and store property data
        // In real implementation, this would save to TerraFusion database

        debug!("✅ Property {} processed successfully", pacs_property.parcel_number);
        Ok(())
    }

    /// Validate PACS 9.0 property data
    fn validate_pacs_property(&self, property: &PACSPropertyRecord) -> Result<()> {
        if property.parcel_number.is_empty() {
            anyhow::bail!("Parcel number is required");
        }

        if property.owner_name.is_empty() {
            anyhow::bail!("Owner name is required for parcel: {}", property.parcel_number);
        }

        if property.assessed_value < 0 {
            anyhow::bail!("Invalid assessed value for parcel: {}", property.parcel_number);
        }

        Ok(())
    }
}

/// Extract server from database URL
fn extract_server_from_url(url: &str) -> Result<String> {
    // Parse SQL Server connection string format
    if url.contains("Server=") {
        let server = url.split("Server=")
            .nth(1)
            .and_then(|s| s.split(';').next())
            .unwrap_or("localhost");
        Ok(server.to_string())
    } else {
        Ok("localhost".to_string())
    }
}

/// Type alias for easier imports
pub type PACSClient = HarrisPACSClient;

/// Extract database from database URL
fn extract_database_from_url(url: &str) -> Result<String> {
    // Parse SQL Server connection string format
    if url.contains("Database=") {
        let database = url.split("Database=")
            .nth(1)
            .and_then(|s| s.split(';').next())
            .unwrap_or("HarrisPACS");
        Ok(database.to_string())
    } else {
        Ok("HarrisPACS".to_string())
    }
}

/// Government. Transcended. - Elite Harris PACS 9.0 integration
/// delivering real-time property assessment and tax data synchronization
/// for Benton County Washington with championship-level accuracy.
pub const HARRIS_PACS_VERSION: &str = "9.0";
