use reqwest::{Client, Error as ReqwestError};
use serde::{Deserialize, Serialize};
use serde_json::{Value, Map};
use std::collections::HashMap;
use tokio::time::{sleep, Duration};
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CountyConfig {
    pub name: String,
    pub state: String,
    pub population: u32,
    pub data_sources: Vec<DataSource>,
    pub demo_customizations: DemoCustomizations,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataSource {
    pub source_type: SourceType,
    pub url: String,
    pub name: String,
    pub layer_id: Option<u32>,
    pub fields_mapping: HashMap<String, String>,
    pub rate_limit_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SourceType {
    ArcGISFeatureServer,
    ArcGISMapServer,
    OpenDataHub,
    RestAPI,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DemoCustomizations {
    pub primary_color: String,
    pub secondary_color: String,
    pub logo_url: Option<String>,
    pub contact_info: ContactInfo,
    pub key_metrics: Vec<String>,
    pub demo_scenarios: Vec<DemoScenario>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContactInfo {
    pub department: String,
    pub phone: String,
    pub email: String,
    pub website: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DemoScenario {
    pub name: String,
    pub description: String,
    pub data_points: Vec<String>,
    pub expected_outcome: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScrapedData {
    pub county: String,
    pub timestamp: DateTime<Utc>,
    pub source: String,
    pub total_records: usize,
    pub sample_records: Vec<Map<String, Value>>,
    pub field_analysis: FieldAnalysis,
    pub data_quality_score: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FieldAnalysis {
    pub total_fields: usize,
    pub field_types: HashMap<String, String>,
    pub completeness_scores: HashMap<String, f64>,
    pub unique_values_sample: HashMap<String, Vec<String>>,
}

pub struct CountyDataScraper {
    client: Client,
    counties: Vec<CountyConfig>,
}

impl CountyDataScraper {
    pub fn new() -> Self {
        let counties = vec![
            CountyConfig {
                name: "Walla Walla County".to_string(),
                state: "Washington".to_string(),
                population: 60760,
                data_sources: vec![
                    DataSource {
                        source_type: SourceType::ArcGISFeatureServer,
                        url: "https://services8.arcgis.com/COL6rRPkF9w28VGX/arcgis/rest/services/Tax_Parcels/FeatureServer/0".to_string(),
                        name: "Tax Parcels".to_string(),
                        layer_id: Some(0),
                        fields_mapping: [
                            ("PARCEL_ID".to_string(), "parcel_number".to_string()),
                            ("OWNER_NAME".to_string(), "owner".to_string()),
                            ("ASSESSED_VALUE".to_string(), "assessed_value".to_string()),
                            ("PROPERTY_ADDRESS".to_string(), "address".to_string()),
                        ].iter().cloned().collect(),
                        rate_limit_ms: 100,
                    }
                ],
                demo_customizations: DemoCustomizations {
                    primary_color: "#2E5984".to_string(),
                    secondary_color: "#8BB8E8".to_string(),
                    logo_url: None,
                    contact_info: ContactInfo {
                        department: "Walla Walla County Assessor".to_string(),
                        phone: "(509) 524-2530".to_string(),
                        email: "assessor@co.walla-walla.wa.us".to_string(),
                        website: "https://www.co.walla-walla.wa.us".to_string(),
                    },
                    key_metrics: vec![
                        "Total Properties".to_string(),
                        "Average Assessed Value".to_string(),
                        "Tax Revenue Potential".to_string(),
                    ],
                    demo_scenarios: vec![
                        DemoScenario {
                            name: "Property Value Analysis".to_string(),
                            description: "Analyze property values across different districts".to_string(),
                            data_points: vec!["assessed_value".to_string(), "property_type".to_string()],
                            expected_outcome: "Identify undervalued properties and tax optimization opportunities".to_string(),
                        }
                    ],
                },
            },
            CountyConfig {
                name: "Cowlitz County".to_string(),
                state: "Washington".to_string(),
                population: 110730,
                data_sources: vec![
                    DataSource {
                        source_type: SourceType::ArcGISMapServer,
                        url: "https://cowlitzgis.net/ccserver/rest/services/Cadastral/Parcels/MapServer".to_string(),
                        name: "Cadastral Parcels".to_string(),
                        layer_id: Some(0),
                        fields_mapping: HashMap::new(),
                        rate_limit_ms: 150,
                    }
                ],
                demo_customizations: DemoCustomizations {
                    primary_color: "#1B4D3E".to_string(),
                    secondary_color: "#4A9B8E".to_string(),
                    logo_url: None,
                    contact_info: ContactInfo {
                        department: "Cowlitz County GIS Department".to_string(),
                        phone: "(360) 577-3030".to_string(),
                        email: "gis@co.cowlitz.wa.us".to_string(),
                        website: "https://www.co.cowlitz.wa.us".to_string(),
                    },
                    key_metrics: vec![
                        "Parcel Count".to_string(),
                        "Land Use Distribution".to_string(),
                        "Development Potential".to_string(),
                    ],
                    demo_scenarios: vec![
                        DemoScenario {
                            name: "Land Use Optimization".to_string(),
                            description: "Optimize land use planning and zoning decisions".to_string(),
                            data_points: vec!["zoning".to_string(), "land_use".to_string()],
                            expected_outcome: "Improve development planning and regulatory compliance".to_string(),
                        }
                    ],
                },
            },
            CountyConfig {
                name: "Yakima County".to_string(),
                state: "Washington".to_string(),
                population: 249670,
                data_sources: vec![
                    DataSource {
                        source_type: SourceType::OpenDataHub,
                        url: "https://gis-yakimacounty.opendata.arcgis.com/api/v1/datasets".to_string(),
                        name: "Open Data Hub".to_string(),
                        layer_id: None,
                        fields_mapping: HashMap::new(),
                        rate_limit_ms: 200,
                    }
                ],
                demo_customizations: DemoCustomizations {
                    primary_color: "#8B4513".to_string(),
                    secondary_color: "#D2691E".to_string(),
                    logo_url: None,
                    contact_info: ContactInfo {
                        department: "Yakima County Information Services".to_string(),
                        phone: "(509) 574-1500".to_string(),
                        email: "gis@co.yakima.wa.us".to_string(),
                        website: "https://www.yakimacounty.us".to_string(),
                    },
                    key_metrics: vec![
                        "Agricultural Land Value".to_string(),
                        "Urban Growth Analysis".to_string(),
                        "Water Rights Assessment".to_string(),
                    ],
                    demo_scenarios: vec![
                        DemoScenario {
                            name: "Agricultural Assessment".to_string(),
                            description: "Comprehensive agricultural land and water rights analysis".to_string(),
                            data_points: vec!["crop_type".to_string(), "irrigation_status".to_string()],
                            expected_outcome: "Optimize agricultural taxation and resource allocation".to_string(),
                        }
                    ],
                },
            },
            CountyConfig {
                name: "Island County".to_string(),
                state: "Washington".to_string(),
                population: 86857,
                data_sources: vec![
                    DataSource {
                        source_type: SourceType::OpenDataHub,
                        url: "https://data-islandcountygis.opendata.arcgis.com/api/v1/datasets".to_string(),
                        name: "Island County Open Data".to_string(),
                        layer_id: None,
                        fields_mapping: HashMap::new(),
                        rate_limit_ms: 120,
                    }
                ],
                demo_customizations: DemoCustomizations {
                    primary_color: "#2E8B57".to_string(),
                    secondary_color: "#90EE90".to_string(),
                    logo_url: None,
                    contact_info: ContactInfo {
                        department: "Island County GIS".to_string(),
                        phone: "(360) 679-7354".to_string(),
                        email: "gis@islandcounty.net".to_string(),
                        website: "https://www.islandcounty.net".to_string(),
                    },
                    key_metrics: vec![
                        "Waterfront Properties".to_string(),
                        "Environmental Impact".to_string(),
                        "Tourism Revenue Potential".to_string(),
                    ],
                    demo_scenarios: vec![
                        DemoScenario {
                            name: "Coastal Property Management".to_string(),
                            description: "Manage coastal and waterfront property assessments".to_string(),
                            data_points: vec!["shoreline_distance".to_string(), "environmental_zone".to_string()],
                            expected_outcome: "Balance environmental protection with property taxation".to_string(),
                        }
                    ],
                },
            },
        ];

        Self {
            client: Client::new(),
            counties,
        }
    }

    pub async fn scrape_all_counties(&self) -> Result<Vec<ScrapedData>, ReqwestError> {
        let mut results = Vec::new();
        
        for county in &self.counties {
            println!("Scraping data for {}", county.name);
            
            for data_source in &county.data_sources {
                match self.scrape_data_source(county, data_source).await {
                    Ok(scraped_data) => {
                        results.push(scraped_data);
                        println!("✅ Successfully scraped {} from {}", data_source.name, county.name);
                    }
                    Err(e) => {
                        eprintln!("❌ Failed to scrape {} from {}: {}", data_source.name, county.name, e);
                    }
                }
                
                sleep(Duration::from_millis(data_source.rate_limit_ms)).await;
            }
        }
        
        Ok(results)
    }

    async fn scrape_data_source(&self, county: &CountyConfig, source: &DataSource) -> Result<ScrapedData, ReqwestError> {
        match source.source_type {
            SourceType::ArcGISFeatureServer => self.scrape_feature_server(county, source).await,
            SourceType::ArcGISMapServer => self.scrape_map_server(county, source).await,
            SourceType::OpenDataHub => self.scrape_open_data_hub(county, source).await,
            SourceType::RestAPI => self.scrape_rest_api(county, source).await,
        }
    }

    async fn scrape_feature_server(&self, county: &CountyConfig, source: &DataSource) -> Result<ScrapedData, ReqwestError> {
        let query_url = format!("{}?where=1%3D1&outFields=*&returnGeometry=false&f=json&resultRecordCount=1000", source.url);
        
        let response = self.client.get(&query_url).send().await?;
        let json_response: Value = response.json().await?;
        
        let features = json_response["features"].as_array().unwrap_or(&vec![]);
        let sample_records: Vec<Map<String, Value>> = features
            .iter()
            .take(100)
            .filter_map(|f| f["attributes"].as_object().cloned())
            .collect();

        let field_analysis = self.analyze_fields(&sample_records);
        let data_quality_score = self.calculate_data_quality_score(&field_analysis);

        Ok(ScrapedData {
            county: county.name.clone(),
            timestamp: Utc::now(),
            source: source.name.clone(),
            total_records: features.len(),
            sample_records,
            field_analysis,
            data_quality_score,
        })
    }

    async fn scrape_map_server(&self, county: &CountyConfig, source: &DataSource) -> Result<ScrapedData, ReqwestError> {
        let layer_url = format!("{}/{}", source.url, source.layer_id.unwrap_or(0));
        let query_url = format!("{}/query?where=1%3D1&outFields=*&returnGeometry=false&f=json&resultRecordCount=1000", layer_url);
        
        let response = self.client.get(&query_url).send().await?;
        let json_response: Value = response.json().await?;
        
        let features = json_response["features"].as_array().unwrap_or(&vec![]);
        let sample_records: Vec<Map<String, Value>> = features
            .iter()
            .take(100)
            .filter_map(|f| f["attributes"].as_object().cloned())
            .collect();

        let field_analysis = self.analyze_fields(&sample_records);
        let data_quality_score = self.calculate_data_quality_score(&field_analysis);

        Ok(ScrapedData {
            county: county.name.clone(),
            timestamp: Utc::now(),
            source: source.name.clone(),
            total_records: features.len(),
            sample_records,
            field_analysis,
            data_quality_score,
        })
    }

    async fn scrape_open_data_hub(&self, county: &CountyConfig, source: &DataSource) -> Result<ScrapedData, ReqwestError> {
        let response = self.client.get(&source.url).send().await?;
        let json_response: Value = response.json().await?;
        
        let datasets = json_response["data"].as_array().unwrap_or(&vec![]);
        
        let mut all_sample_records = Vec::new();
        let mut total_records = 0;

        for dataset in datasets.iter().take(5) {
            if let Some(dataset_id) = dataset["id"].as_str() {
                let data_url = format!("https://services.arcgis.com/server/rest/services/{}/FeatureServer/0/query?where=1%3D1&outFields=*&f=json&resultRecordCount=200", dataset_id);
                
                if let Ok(data_response) = self.client.get(&data_url).send().await {
                    if let Ok(data_json) = data_response.json::<Value>().await {
                        if let Some(features) = data_json["features"].as_array() {
                            total_records += features.len();
                            let sample: Vec<Map<String, Value>> = features
                                .iter()
                                .take(20)
                                .filter_map(|f| f["attributes"].as_object().cloned())
                                .collect();
                            all_sample_records.extend(sample);
                        }
                    }
                }
                
                sleep(Duration::from_millis(source.rate_limit_ms)).await;
            }
        }

        let field_analysis = self.analyze_fields(&all_sample_records);
        let data_quality_score = self.calculate_data_quality_score(&field_analysis);

        Ok(ScrapedData {
            county: county.name.clone(),
            timestamp: Utc::now(),
            source: source.name.clone(),
            total_records,
            sample_records: all_sample_records,
            field_analysis,
            data_quality_score,
        })
    }

    async fn scrape_rest_api(&self, county: &CountyConfig, source: &DataSource) -> Result<ScrapedData, ReqwestError> {
        let response = self.client.get(&source.url).send().await?;
        let json_response: Value = response.json().await?;
        
        let sample_records = if let Some(data_array) = json_response.as_array() {
            data_array.iter()
                .take(100)
                .filter_map(|item| item.as_object().cloned())
                .collect()
        } else if let Some(data_object) = json_response.as_object() {
            vec![data_object.clone()]
        } else {
            vec![]
        };

        let field_analysis = self.analyze_fields(&sample_records);
        let data_quality_score = self.calculate_data_quality_score(&field_analysis);

        Ok(ScrapedData {
            county: county.name.clone(),
            timestamp: Utc::now(),
            source: source.name.clone(),
            total_records: sample_records.len(),
            sample_records,
            field_analysis,
            data_quality_score,
        })
    }

    fn analyze_fields(&self, records: &[Map<String, Value>]) -> FieldAnalysis {
        if records.is_empty() {
            return FieldAnalysis {
                total_fields: 0,
                field_types: HashMap::new(),
                completeness_scores: HashMap::new(),
                unique_values_sample: HashMap::new(),
            };
        }

        let mut field_types = HashMap::new();
        let mut field_completeness = HashMap::new();
        let mut unique_values = HashMap::new();

        for record in records {
            for (field_name, field_value) in record {
                let field_type = match field_value {
                    Value::String(_) => "String",
                    Value::Number(_) => "Number", 
                    Value::Bool(_) => "Boolean",
                    Value::Array(_) => "Array",
                    Value::Object(_) => "Object",
                    Value::Null => "Null",
                };

                field_types.insert(field_name.clone(), field_type.to_string());

                let is_complete = !field_value.is_null() && 
                    !(field_value.is_string() && field_value.as_str().unwrap_or("").is_empty());

                let completeness_entry = field_completeness.entry(field_name.clone()).or_insert((0, 0));
                completeness_entry.1 += 1;
                if is_complete {
                    completeness_entry.0 += 1;
                }

                if let Some(str_value) = field_value.as_str() {
                    let unique_entry = unique_values.entry(field_name.clone()).or_insert_with(Vec::new);
                    if !unique_entry.contains(&str_value.to_string()) && unique_entry.len() < 10 {
                        unique_entry.push(str_value.to_string());
                    }
                }
            }
        }

        let completeness_scores: HashMap<String, f64> = field_completeness
            .into_iter()
            .map(|(field, (complete, total))| (field, complete as f64 / total as f64))
            .collect();

        FieldAnalysis {
            total_fields: field_types.len(),
            field_types,
            completeness_scores,
            unique_values_sample: unique_values,
        }
    }

    fn calculate_data_quality_score(&self, analysis: &FieldAnalysis) -> f64 {
        if analysis.completeness_scores.is_empty() {
            return 0.0;
        }

        let avg_completeness: f64 = analysis.completeness_scores.values().sum::<f64>() / analysis.completeness_scores.len() as f64;
        let field_diversity_score = (analysis.total_fields as f64).min(20.0) / 20.0;
        
        (avg_completeness * 0.7 + field_diversity_score * 0.3) * 100.0
    }

    pub fn get_county_config(&self, county_name: &str) -> Option<&CountyConfig> {
        self.counties.iter().find(|c| c.name == county_name)
    }

    pub async fn generate_demo_data(&self, scraped_data: &ScrapedData) -> DemoData {
        let county_config = self.get_county_config(&scraped_data.county).unwrap();
        
        DemoData {
            id: Uuid::new_v4().to_string(),
            county: scraped_data.county.clone(),
            generated_at: Utc::now(),
            customizations: county_config.demo_customizations.clone(),
            sample_properties: self.generate_sample_properties(&scraped_data.sample_records, county_config),
            analytics: self.generate_analytics(&scraped_data.sample_records),
            recommendations: self.generate_recommendations(scraped_data, county_config),
        }
    }

    fn generate_sample_properties(&self, records: &[Map<String, Value>], config: &CountyConfig) -> Vec<DemoProperty> {
        records.iter().take(50).map(|record| {
            DemoProperty {
                id: Uuid::new_v4().to_string(),
                address: self.extract_field_value(record, &["address", "property_address", "site_addr", "full_address"]).unwrap_or_else(|| format!("{} Main St", rand::random::<u16>() % 9999 + 1)),
                assessed_value: self.extract_numeric_value(record, &["assessed_value", "total_value", "market_value"]).unwrap_or(rand::random::<u32>() % 500000 + 100000) as f64,
                owner: self.extract_field_value(record, &["owner", "owner_name", "taxpayer_name"]).unwrap_or("Sample Owner".to_string()),
                property_type: self.extract_field_value(record, &["property_type", "land_use", "use_code"]).unwrap_or("Residential".to_string()),
                square_footage: self.extract_numeric_value(record, &["sqft", "square_feet", "building_area"]).unwrap_or(rand::random::<u32>() % 3000 + 1000) as f64,
                year_built: self.extract_numeric_value(record, &["year_built", "construction_year", "built_year"]).unwrap_or(rand::random::<u32>() % 50 + 1970) as i32,
            }
        }).collect()
    }

    fn extract_field_value(&self, record: &Map<String, Value>, possible_fields: &[&str]) -> Option<String> {
        for field in possible_fields {
            if let Some(value) = record.get(*field) {
                if let Some(str_val) = value.as_str() {
                    if !str_val.is_empty() {
                        return Some(str_val.to_string());
                    }
                }
            }
        }
        None
    }

    fn extract_numeric_value(&self, record: &Map<String, Value>, possible_fields: &[&str]) -> Option<u32> {
        for field in possible_fields {
            if let Some(value) = record.get(*field) {
                if let Some(num) = value.as_u64() {
                    return Some(num as u32);
                }
                if let Some(str_val) = value.as_str() {
                    if let Ok(num) = str_val.parse::<u32>() {
                        return Some(num);
                    }
                }
            }
        }
        None
    }

    fn generate_analytics(&self, records: &[Map<String, Value>]) -> DemoAnalytics {
        let total_properties = records.len();
        let avg_value = records.iter()
            .filter_map(|r| self.extract_numeric_value(r, &["assessed_value", "total_value", "market_value"]))
            .map(|v| v as f64)
            .sum::<f64>() / total_properties as f64;

        DemoAnalytics {
            total_properties,
            average_assessed_value: avg_value,
            total_assessed_value: avg_value * total_properties as f64,
            property_type_distribution: HashMap::new(),
            value_distribution: HashMap::new(),
            growth_trends: vec![],
        }
    }

    fn generate_recommendations(&self, scraped_data: &ScrapedData, config: &CountyConfig) -> Vec<DemoRecommendation> {
        vec![
            DemoRecommendation {
                id: Uuid::new_v4().to_string(),
                title: format!("Optimize {} Property Assessments", config.name),
                description: format!("Based on analysis of {} properties, we identified potential assessment optimization opportunities", scraped_data.total_records),
                impact: "High".to_string(),
                estimated_revenue_increase: 150000.0,
                implementation_complexity: "Medium".to_string(),
            },
            DemoRecommendation {
                id: Uuid::new_v4().to_string(),
                title: "Implement Automated Valuation Models".to_string(),
                description: "Deploy AI-powered property valuation to improve assessment accuracy".to_string(),
                impact: "Very High".to_string(),
                estimated_revenue_increase: 500000.0,
                implementation_complexity: "High".to_string(),
            },
        ]
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DemoData {
    pub id: String,
    pub county: String,
    pub generated_at: DateTime<Utc>,
    pub customizations: DemoCustomizations,
    pub sample_properties: Vec<DemoProperty>,
    pub analytics: DemoAnalytics,
    pub recommendations: Vec<DemoRecommendation>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DemoProperty {
    pub id: String,
    pub address: String,
    pub assessed_value: f64,
    pub owner: String,
    pub property_type: String,
    pub square_footage: f64,
    pub year_built: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DemoAnalytics {
    pub total_properties: usize,
    pub average_assessed_value: f64,
    pub total_assessed_value: f64,
    pub property_type_distribution: HashMap<String, u32>,
    pub value_distribution: HashMap<String, u32>,
    pub growth_trends: Vec<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DemoRecommendation {
    pub id: String,
    pub title: String,
    pub description: String,
    pub impact: String,
    pub estimated_revenue_increase: f64,
    pub implementation_complexity: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let scraper = CountyDataScraper::new();
    
    println!("🚀 Starting TerraFusion County Data Scraping...");
    
    let scraped_results = scraper.scrape_all_counties().await?;
    
    println!("\n📊 Scraping Results:");
    for result in &scraped_results {
        println!("✅ {}: {} records scraped, Quality Score: {:.1}%", 
            result.county, result.total_records, result.data_quality_score);
    }
    
    println!("\n🎯 Generating Demo Data...");
    for scraped_data in &scraped_results {
        let demo_data = scraper.generate_demo_data(scraped_data).await;
        
        let output_file = format!("demo_data_{}_{}.json", 
            demo_data.county.replace(" ", "_").to_lowercase(),
            demo_data.generated_at.format("%Y%m%d_%H%M%S")
        );
        
        let json_output = serde_json::to_string_pretty(&demo_data)?;
        std::fs::write(&output_file, json_output)?;
        
        println!("✅ Demo data generated for {}: {}", demo_data.county, output_file);
    }
    
    println!("\n🏆 TerraFusion County Demo System Complete!");
    println!("Ready for government presentations and sales demonstrations.");
    
    Ok(())
}

