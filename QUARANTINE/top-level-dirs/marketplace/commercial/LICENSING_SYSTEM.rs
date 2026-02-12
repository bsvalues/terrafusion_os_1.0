// TerraFusion Licensing & Activation System
// Controls data access while maintaining full functionality
// Everyone gets the same platform - license determines data access

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc, Duration};
use sha2::{Sha256, Digest};
use aes_gcm::{Aes256Gcm, Key, Nonce};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LicenseType {
    Government {
        county: String,
        state: String,
        full_private_access: bool,
    },
    Commercial {
        tier: CommercialTier,
        counties: Vec<String>,
        data_level: DataAccessLevel,
    },
    Trial {
        expires: DateTime<Utc>,
        limited_properties: u32,
    },
    Developer {
        sandbox_mode: bool,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CommercialTier {
    Starter,      // Single county public data
    Professional, // Regional public data
    Enterprise,   // Multi-state public data
    Ultimate,     // National public data
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DataAccessLevel {
    PublicOnly,           // Published public records
    PublicEnhanced,       // Public + purchased datasets
    PublicRealtime,       // Public with real-time updates
    AnonymizedPrivate,    // Anonymized government data
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct License {
    pub id: String,
    pub license_type: LicenseType,
    pub organization: String,
    pub issued_date: DateTime<Utc>,
    pub expiry_date: Option<DateTime<Utc>>,
    pub features: LicenseFeatures,
    pub signature: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LicenseFeatures {
    // Core features - ALWAYS enabled for everyone
    pub all_14_modules: bool,          // Always true
    pub costforge_ai: bool,            // Always true
    pub hot_swappable: bool,           // Always true
    pub ai_swarm: bool,                // Always true
    pub full_interoperability: bool,   // Always true
    
    // Data features - varies by license
    pub max_properties: Option<u64>,
    pub counties_accessible: Vec<String>,
    pub data_refresh_rate: DataRefreshRate,
    pub api_calls_per_month: Option<u64>,
    pub concurrent_users: u32,
    
    // Advanced features
    pub data_export: bool,
    pub custom_models: bool,
    pub white_label: bool,
    pub marketplace_access: bool,
    pub can_purchase_counties: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DataRefreshRate {
    Realtime,
    Daily,
    Weekly,
    Monthly,
    Quarterly,
}

pub struct LicenseManager {
    private_key: Vec<u8>,
    public_key: Vec<u8>,
    activated_licenses: HashMap<String, License>,
    data_packages: HashMap<String, DataPackage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataPackage {
    pub package_id: String,
    pub counties: Vec<CountyData>,
    pub total_properties: u64,
    pub last_updated: DateTime<Utc>,
    pub access_level: DataAccessLevel,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CountyData {
    pub county_name: String,
    pub state: String,
    pub property_count: u64,
    pub data_fields: Vec<String>,
    pub is_private: bool,
}

impl LicenseManager {
    pub fn new() -> Self {
        Self {
            private_key: Self::generate_key(),
            public_key: Self::generate_key(),
            activated_licenses: HashMap::new(),
            data_packages: HashMap::new(),
        }
    }
    
    // Generate license for new customer
    pub fn generate_license(&self, customer: CustomerInfo) -> Result<License, String> {
        let license_id = Self::generate_license_id(&customer);
        
        let features = match customer.license_type {
            LicenseType::Government { .. } => {
                // Government gets everything including private data
                LicenseFeatures {
                    all_14_modules: true,
                    costforge_ai: true,
                    hot_swappable: true,
                    ai_swarm: true,
                    full_interoperability: true,
                    max_properties: None, // Unlimited
                    counties_accessible: vec![customer.county.clone()],
                    data_refresh_rate: DataRefreshRate::Realtime,
                    api_calls_per_month: None, // Unlimited
                    concurrent_users: 1000,
                    data_export: true,
                    custom_models: true,
                    white_label: true,
                    marketplace_access: true,
                    can_purchase_counties: false, // They own their data
                }
            },
            LicenseType::Commercial { ref tier, ref counties, .. } => {
                // Commercial gets full platform but public data only
                let (max_props, api_calls, users) = match tier {
                    CommercialTier::Starter => (Some(100_000), Some(100_000), 10),
                    CommercialTier::Professional => (Some(500_000), Some(500_000), 50),
                    CommercialTier::Enterprise => (Some(2_000_000), Some(2_000_000), 200),
                    CommercialTier::Ultimate => (None, None, 1000),
                };
                
                LicenseFeatures {
                    all_14_modules: true,           // Same modules
                    costforge_ai: true,             // Same AI engine
                    hot_swappable: true,            // Same architecture
                    ai_swarm: true,                 // Same swarm
                    full_interoperability: true,    // Can work with gov
                    max_properties: max_props,
                    counties_accessible: counties.clone(),
                    data_refresh_rate: match tier {
                        CommercialTier::Ultimate => DataRefreshRate::Daily,
                        CommercialTier::Enterprise => DataRefreshRate::Weekly,
                        _ => DataRefreshRate::Monthly,
                    },
                    api_calls_per_month: api_calls,
                    concurrent_users: users,
                    data_export: matches!(tier, CommercialTier::Enterprise | CommercialTier::Ultimate),
                    custom_models: matches!(tier, CommercialTier::Ultimate),
                    white_label: matches!(tier, CommercialTier::Ultimate),
                    marketplace_access: true,
                    can_purchase_counties: true,    // Can buy more counties
                }
            },
            _ => return Err("Unsupported license type".to_string()),
        };
        
        let license = License {
            id: license_id,
            license_type: customer.license_type,
            organization: customer.organization,
            issued_date: Utc::now(),
            expiry_date: customer.expiry_date,
            features,
            signature: self.sign_license(&license_id),
        };
        
        Ok(license)
    }
    
    // Activate license and load appropriate data
    pub fn activate_license(&mut self, license_key: &str) -> Result<ActivationResult, String> {
        // Verify license signature
        if !self.verify_license(license_key) {
            return Err("Invalid license key".to_string());
        }
        
        // Decode license
        let license = self.decode_license(license_key)?;
        
        // Check expiry
        if let Some(expiry) = license.expiry_date {
            if expiry < Utc::now() {
                return Err("License expired".to_string());
            }
        }
        
        // Load appropriate data package based on license
        let data_package = self.load_data_package(&license)?;
        
        // Store activated license
        self.activated_licenses.insert(license.id.clone(), license.clone());
        self.data_packages.insert(license.id.clone(), data_package.clone());
        
        Ok(ActivationResult {
            success: true,
            license_id: license.id,
            organization: license.organization,
            features_enabled: license.features,
            data_loaded: DataLoadedInfo {
                total_properties: data_package.total_properties,
                counties: data_package.counties.len(),
                access_level: data_package.access_level,
            },
        })
    }
    
    // Load appropriate data based on license type
    fn load_data_package(&self, license: &License) -> Result<DataPackage, String> {
        match &license.license_type {
            LicenseType::Government { county, state, .. } => {
                // Load full private data for the county
                Ok(DataPackage {
                    package_id: format!("gov_{}_{}", state, county),
                    counties: vec![CountyData {
                        county_name: county.clone(),
                        state: state.clone(),
                        property_count: 94_149, // Benton County example
                        data_fields: vec![
                            "all_private_fields".to_string(),
                            "owner_information".to_string(),
                            "assessment_notes".to_string(),
                            "confidential_data".to_string(),
                        ],
                        is_private: true,
                    }],
                    total_properties: 94_149,
                    last_updated: Utc::now(),
                    access_level: DataAccessLevel::PublicOnly, // Actually private
                })
            },
            LicenseType::Commercial { counties, data_level, .. } => {
                // Load public data for specified counties
                let county_data: Vec<CountyData> = counties.iter().map(|county| {
                    CountyData {
                        county_name: county.clone(),
                        state: "WA".to_string(), // Example
                        property_count: 50_000, // Public subset
                        data_fields: vec![
                            "public_parcel_id".to_string(),
                            "address".to_string(),
                            "public_value".to_string(),
                            "zoning".to_string(),
                        ],
                        is_private: false,
                    }
                }).collect();
                
                Ok(DataPackage {
                    package_id: format!("commercial_{}", license.id),
                    counties: county_data.clone(),
                    total_properties: county_data.iter().map(|c| c.property_count).sum(),
                    last_updated: Utc::now(),
                    access_level: data_level.clone(),
                })
            },
            _ => Err("Unsupported license type for data loading".to_string()),
        }
    }
    
    // Check if feature is available for current license
    pub fn is_feature_available(&self, license_id: &str, feature: &str) -> bool {
        if let Some(license) = self.activated_licenses.get(license_id) {
            match feature {
                // These are ALWAYS available to everyone
                "all_14_modules" | "costforge_ai" | "hot_swappable" | 
                "ai_swarm" | "full_interoperability" => true,
                
                // These depend on license
                "private_data" => matches!(license.license_type, LicenseType::Government { .. }),
                "export_data" => license.features.data_export,
                "custom_models" => license.features.custom_models,
                "purchase_counties" => license.features.can_purchase_counties,
                _ => false,
            }
        } else {
            false
        }
    }
    
    // Add new county data to commercial license
    pub fn purchase_county_data(&mut self, license_id: &str, county: &str) -> Result<(), String> {
        let license = self.activated_licenses.get_mut(license_id)
            .ok_or("License not found")?;
        
        match &mut license.license_type {
            LicenseType::Commercial { counties, .. } => {
                if !counties.contains(&county.to_string()) {
                    counties.push(county.to_string());
                    license.features.counties_accessible.push(county.to_string());
                    
                    // Update data package
                    if let Some(package) = self.data_packages.get_mut(license_id) {
                        package.counties.push(CountyData {
                            county_name: county.to_string(),
                            state: "WA".to_string(),
                            property_count: 50_000,
                            data_fields: vec!["public_fields".to_string()],
                            is_private: false,
                        });
                        package.total_properties += 50_000;
                    }
                    
                    Ok(())
                } else {
                    Err("County already purchased".to_string())
                }
            },
            _ => Err("Only commercial licenses can purchase additional counties".to_string()),
        }
    }
    
    // Generate unique license ID
    fn generate_license_id(customer: &CustomerInfo) -> String {
        let mut hasher = Sha256::new();
        hasher.update(customer.organization.as_bytes());
        hasher.update(Utc::now().to_string().as_bytes());
        format!("TF-{}", hex::encode(&hasher.finalize()[..8]))
    }
    
    // Sign license for verification
    fn sign_license(&self, license_id: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(license_id.as_bytes());
        hasher.update(&self.private_key);
        hex::encode(hasher.finalize())
    }
    
    // Verify license signature
    fn verify_license(&self, license_key: &str) -> bool {
        // Verification logic here
        true // Simplified for example
    }
    
    // Decode license from key
    fn decode_license(&self, license_key: &str) -> Result<License, String> {
        // Decoding logic here
        // For now, return example license
        Ok(License {
            id: "TF-12345678".to_string(),
            license_type: LicenseType::Commercial {
                tier: CommercialTier::Professional,
                counties: vec!["Benton".to_string()],
                data_level: DataAccessLevel::PublicEnhanced,
            },
            organization: "Example Corp".to_string(),
            issued_date: Utc::now(),
            expiry_date: Some(Utc::now() + Duration::days(365)),
            features: LicenseFeatures {
                all_14_modules: true,
                costforge_ai: true,
                hot_swappable: true,
                ai_swarm: true,
                full_interoperability: true,
                max_properties: Some(500_000),
                counties_accessible: vec!["Benton".to_string()],
                data_refresh_rate: DataRefreshRate::Weekly,
                api_calls_per_month: Some(500_000),
                concurrent_users: 50,
                data_export: false,
                custom_models: false,
                white_label: false,
                marketplace_access: true,
                can_purchase_counties: true,
            },
            signature: "signature".to_string(),
        })
    }
    
    fn generate_key() -> Vec<u8> {
        // Generate cryptographic key
        vec![0u8; 32] // Simplified
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomerInfo {
    pub organization: String,
    pub license_type: LicenseType,
    pub county: String,
    pub expiry_date: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivationResult {
    pub success: bool,
    pub license_id: String,
    pub organization: String,
    pub features_enabled: LicenseFeatures,
    pub data_loaded: DataLoadedInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataLoadedInfo {
    pub total_properties: u64,
    pub counties: usize,
    pub access_level: DataAccessLevel,
}

// API endpoints for license management
pub mod api {
    use super::*;
    use actix_web::{web, HttpResponse};
    
    pub async fn activate_license(
        license_key: web::Json<String>,
        manager: web::Data<std::sync::Arc<std::sync::Mutex<LicenseManager>>>,
    ) -> HttpResponse {
        let mut manager = manager.lock().unwrap();
        match manager.activate_license(&license_key) {
            Ok(result) => HttpResponse::Ok().json(result),
            Err(e) => HttpResponse::BadRequest().json(serde_json::json!({
                "error": e
            })),
        }
    }
    
    pub async fn check_feature(
        params: web::Path<(String, String)>,
        manager: web::Data<std::sync::Arc<std::sync::Mutex<LicenseManager>>>,
    ) -> HttpResponse {
        let (license_id, feature) = params.into_inner();
        let manager = manager.lock().unwrap();
        let available = manager.is_feature_available(&license_id, &feature);
        HttpResponse::Ok().json(serde_json::json!({
            "feature": feature,
            "available": available
        }))
    }
    
    pub async fn purchase_county(
        params: web::Path<(String, String)>,
        manager: web::Data<std::sync::Arc<std::sync::Mutex<LicenseManager>>>,
    ) -> HttpResponse {
        let (license_id, county) = params.into_inner();
        let mut manager = manager.lock().unwrap();
        match manager.purchase_county_data(&license_id, &county) {
            Ok(_) => HttpResponse::Ok().json(serde_json::json!({
                "success": true,
                "message": format!("County {} added to license", county)
            })),
            Err(e) => HttpResponse::BadRequest().json(serde_json::json!({
                "error": e
            })),
        }
    }
}