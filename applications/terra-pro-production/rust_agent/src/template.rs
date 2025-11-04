use serde::Deserialize;
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
pub struct Template {
    #[serde(rename = "PrimaryFields")]
    pub primary_fields: Fields,
    #[serde(rename = "SecondaryFields")]
    pub secondary_fields: Fields,
    #[serde(rename = "Direction")]
    pub direction: String,
    #[serde(rename = "MappingOption")]
    pub mapping_option: String,
    #[serde(rename = "SplitOption")]
    pub split_option: String,
    #[serde(rename = "TemplateSettings")]
    pub settings: TemplateSettings,
    #[serde(rename = "PrimaryConverterName")]
    pub primary_converter: String,
    #[serde(rename = "SecondaryConverterName")]
    pub secondary_converter: String,
    #[serde(rename = "CustomerNumber")]
    pub customer_number: String,
    #[serde(rename = "TemplateName")]
    pub template_name: String,
    #[serde(rename = "Description")]
    pub description: String,
}

#[derive(Debug, Deserialize)]
pub struct Fields {
    #[serde(rename = "Field", default)]
    pub fields: Vec<Field>,
}

#[derive(Debug, Deserialize)]
pub struct Field {
    #[serde(rename = "Index")]
    pub index: usize,
    #[serde(rename = "FriendlyName")]
    pub friendly_name: String,
    #[serde(rename = "DataType")]
    pub data_type: String,
    #[serde(rename = "Key")]
    pub key: String,
}

#[derive(Debug, Deserialize)]
pub struct TemplateSettings {
    #[serde(rename = "SourceFilePath")]
    pub source_file_path: String,
    #[serde(rename = "SourceDelimiter")]
    pub source_delimiter: String,
    #[serde(rename = "SourceHasHeader")]
    pub source_has_header: String,
}