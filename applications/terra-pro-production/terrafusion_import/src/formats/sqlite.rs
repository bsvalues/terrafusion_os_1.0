use rusqlite::{Connection, Row};
use std::path::Path;
use uuid::Uuid;
use crate::core::importer::Importer;
use crate::core::schema::TerraFusionComp;
use crate::core::error::ImportError;

pub struct SqliteImporter;

impl SqliteImporter {
    fn row_to_comp(row: &Row, table: &str, source_file: &str) -> Result<TerraFusionComp, ImportError> {
        let mut comp = TerraFusionComp::default();
        
        comp.id = Some(Uuid::new_v4().to_string());
        comp.source_table = table.to_string();
        comp.source_file = source_file.to_string();
        
        let column_names = row.as_ref().column_names();
        
        for (index, &column_name) in column_names.iter().enumerate() {
            let column_lower = column_name.to_lowercase();
            
            match column_lower.as_str() {
                "address" | "property_address" | "street_address" => {
                    if let Ok(value) = row.get::<_, String>(index) {
                        comp.address = value;
                    }
                },
                "sale_price" | "price" | "sale_amount" | "selling_price" => {
                    if let Ok(value) = row.get::<_, f64>(index) {
                        comp.sale_price_usd = value;
                    } else if let Ok(value) = row.get::<_, i64>(index) {
                        comp.sale_price_usd = value as f64;
                    }
                },
                "gla" | "sqft" | "square_feet" | "living_area" | "gross_living_area" => {
                    if let Ok(value) = row.get::<_, u32>(index) {
                        comp.gla_sqft = value;
                    } else if let Ok(value) = row.get::<_, i64>(index) {
                        comp.gla_sqft = value as u32;
                    }
                },
                "sale_date" | "closing_date" | "date_sold" => {
                    if let Ok(value) = row.get::<_, String>(index) {
                        comp.sale_date = value;
                    }
                },
                "property_type" | "type" => {
                    if let Ok(value) = row.get::<_, String>(index) {
                        comp.property_type = Some(value);
                    }
                },
                "bedrooms" | "beds" | "bedroom_count" => {
                    if let Ok(value) = row.get::<_, u32>(index) {
                        comp.bedrooms = Some(value);
                    } else if let Ok(value) = row.get::<_, i64>(index) {
                        comp.bedrooms = Some(value as u32);
                    }
                },
                "bathrooms" | "baths" | "bathroom_count" => {
                    if let Ok(value) = row.get::<_, f32>(index) {
                        comp.bathrooms = Some(value);
                    } else if let Ok(value) = row.get::<_, f64>(index) {
                        comp.bathrooms = Some(value as f32);
                    }
                },
                "year_built" | "built_year" | "construction_year" => {
                    if let Ok(value) = row.get::<_, u32>(index) {
                        comp.year_built = Some(value);
                    } else if let Ok(value) = row.get::<_, i64>(index) {
                        comp.year_built = Some(value as u32);
                    }
                },
                "lot_size" | "lot_sqft" | "parcel_size" => {
                    if let Ok(value) = row.get::<_, f64>(index) {
                        comp.lot_size = Some(value);
                    }
                },
                "city" => {
                    if let Ok(value) = row.get::<_, String>(index) {
                        comp.city = Some(value);
                    }
                },
                "state" => {
                    if let Ok(value) = row.get::<_, String>(index) {
                        comp.state = Some(value);
                    }
                },
                "zip" | "zipcode" | "zip_code" | "postal_code" => {
                    if let Ok(value) = row.get::<_, String>(index) {
                        comp.zip_code = Some(value);
                    }
                },
                _ => {}
            }
        }
        
        if comp.address.is_empty() {
            return Err(ImportError::MappingError { 
                message: format!("No valid address found in table '{}'", table) 
            });
        }
        
        Ok(comp)
    }

    fn get_table_names(conn: &Connection) -> Result<Vec<String>, ImportError> {
        let mut stmt = conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")?;
        let table_names: Result<Vec<String>, rusqlite::Error> = stmt.query_map([], |row| row.get(0))?
            .collect();
        Ok(table_names?)
    }

    fn import_table(conn: &Connection, table: &str, source_file: &str, limit: Option<usize>) -> Result<Vec<TerraFusionComp>, ImportError> {
        let query = match limit {
            Some(limit_val) => format!("SELECT * FROM {} LIMIT {}", table, limit_val),
            None => format!("SELECT * FROM {}", table),
        };

        let mut stmt = conn.prepare(&query)?;
        let mut comps = Vec::new();

        let rows = stmt.query_map([], |row| {
            SqliteImporter::row_to_comp(row, table, source_file)
        })?;

        for row_result in rows {
            match row_result {
                Ok(comp) => comps.push(comp),
                Err(e) => {
                    eprintln!("Warning: Failed to parse row in table '{}': {}", table, e);
                    continue;
                }
            }
        }

        Ok(comps)
    }
}

impl Importer for SqliteImporter {
    fn detect(path: &Path) -> bool {
        if let Some(extension) = path.extension() {
            let ext = extension.to_string_lossy().to_lowercase();
            return ext == "sqlite" || ext == "db" || ext == "sqlite3";
        }
        false
    }

    fn import(path: &Path) -> Result<Vec<TerraFusionComp>, ImportError> {
        let source_file = path.file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();

        let conn = Connection::open(path)?;
        let table_names = Self::get_table_names(&conn)?;

        if table_names.is_empty() {
            return Err(ImportError::InvalidData { 
                details: "No valid tables found in SQLite database".to_string() 
            });
        }

        let mut all_comps = Vec::new();

        for table in table_names {
            match Self::import_table(&conn, &table, &source_file, Some(1000)) {
                Ok(mut comps) => {
                    all_comps.append(&mut comps);
                },
                Err(e) => {
                    eprintln!("Warning: Failed to import table '{}': {}", table, e);
                    continue;
                }
            }
        }

        if all_comps.is_empty() {
            return Err(ImportError::InvalidData { 
                details: "No valid property data found in any table".to_string() 
            });
        }

        Ok(all_comps)
    }

    fn get_format_name() -> &'static str {
        "SQLite Database"
    }

    fn get_supported_extensions() -> Vec<&'static str> {
        vec!["sqlite", "db", "sqlite3"]
    }
}