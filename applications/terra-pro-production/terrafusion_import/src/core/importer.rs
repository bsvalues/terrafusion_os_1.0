use std::path::Path;
use crate::core::error::ImportError;
use crate::core::schema::TerraFusionComp;

pub trait Importer {
    fn detect(path: &Path) -> bool;
    fn import(path: &Path) -> Result<Vec<TerraFusionComp>, ImportError>;
    fn get_format_name() -> &'static str;
    fn get_supported_extensions() -> Vec<&'static str>;
}

pub struct ImportEngine;

impl ImportEngine {
    pub fn auto_detect_and_import(path: &Path) -> Result<Vec<TerraFusionComp>, ImportError> {
        use crate::formats::sqlite::SqliteImporter;
        
        if !path.exists() {
            return Err(ImportError::FileNotFound { 
                path: path.to_string_lossy().to_string() 
            });
        }

        if SqliteImporter::detect(path) {
            return SqliteImporter::import(path);
        }

        Err(ImportError::UnknownFormat { 
            path: path.to_string_lossy().to_string() 
        })
    }

    pub fn list_supported_formats() -> Vec<(&'static str, Vec<&'static str>)> {
        use crate::formats::sqlite::SqliteImporter;
        
        vec![
            (SqliteImporter::get_format_name(), SqliteImporter::get_supported_extensions()),
        ]
    }

    pub fn export_to_json(comps: &[TerraFusionComp]) -> Result<String, ImportError> {
        serde_json::to_string_pretty(comps).map_err(ImportError::from)
    }

    pub fn export_to_file(comps: &[TerraFusionComp], output_path: &Path) -> Result<(), ImportError> {
        let json_data = Self::export_to_json(comps)?;
        std::fs::write(output_path, json_data).map_err(ImportError::from)
    }
}