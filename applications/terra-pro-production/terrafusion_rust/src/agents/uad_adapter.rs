use crate::agents::base::{Agent, AgentHealth, create_success_response, create_error_response};
use crate::mcp::protocol::{MCPMessage, MCPResponseMessage};
use async_trait::async_trait;
use serde_json;
use tracing::{info, warn, error};
use quick_xml::{Reader, Writer, events::Event};
use std::io::Cursor;

#[derive(Default)]
pub struct UADAdapterAgent {
    pub schema_version: String,
    pub field_mappings: std::collections::HashMap<String, String>,
}

impl UADAdapterAgent {
    pub fn new() -> Self {
        let mut agent = Self {
            schema_version: "3.2".to_string(),
            field_mappings: std::collections::HashMap::new(),
        };
        agent.initialize_field_mappings();
        agent
    }

    fn initialize_field_mappings(&mut self) {
        self.field_mappings.insert("SubjectPropertyAddress".to_string(), "subject_address".to_string());
        self.field_mappings.insert("BorrowerName".to_string(), "borrower_name".to_string());
        self.field_mappings.insert("PropertyRightsAppraised".to_string(), "property_rights".to_string());
        self.field_mappings.insert("LegalDescription".to_string(), "legal_description".to_string());
        self.field_mappings.insert("AssessorParcelNumber".to_string(), "apn".to_string());
    }

    async fn parse_uad_xml(&self, xml_content: &str) -> Result<PropertyData, Box<dyn std::error::Error + Send + Sync>> {
        let mut reader = Reader::from_str(xml_content);
        reader.trim_text(true);
        
        let mut property_data = PropertyData::default();
        let mut current_field = String::new();
        
        loop {
            match reader.read_event() {
                Ok(Event::Start(ref e)) => {
                    current_field = String::from_utf8_lossy(e.name().as_ref()).to_string();
                }
                Ok(Event::Text(e)) => {
                    let value = e.unescape()?.to_string();
                    match current_field.as_str() {
                        "SubjectPropertyAddress" => property_data.subject_address = value,
                        "BorrowerName" => property_data.borrower_name = value,
                        "PropertyRightsAppraised" => property_data.property_rights = value,
                        "LegalDescription" => property_data.legal_description = value,
                        "AssessorParcelNumber" => property_data.apn = value,
                        _ => {}
                    }
                }
                Ok(Event::Eof) => break,
                Err(e) => return Err(format!("XML parsing error: {}", e).into()),
                _ => {}
            }
        }
        
        Ok(property_data)
    }

    async fn generate_uad_xml(&self, property_data: &PropertyData) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let mut writer = Writer::new(Cursor::new(Vec::new()));
        
        // This would be a complete UAD XML generation implementation
        let xml_content = format!(r#"<?xml version="1.0" encoding="UTF-8"?>
<AppraisalDataCollectionUniformAppraisalDataset>
    <SubjectPropertyAddress>{}</SubjectPropertyAddress>
    <BorrowerName>{}</BorrowerName>
    <PropertyRightsAppraised>{}</PropertyRightsAppraised>
    <LegalDescription>{}</LegalDescription>
    <AssessorParcelNumber>{}</AssessorParcelNumber>
</AppraisalDataCollectionUniformAppraisalDataset>"#,
            property_data.subject_address,
            property_data.borrower_name,
            property_data.property_rights,
            property_data.legal_description,
            property_data.apn
        );
        
        Ok(xml_content)
    }

    async fn validate_uad_data(&self, property_data: &PropertyData) -> Vec<ValidationError> {
        let mut errors = Vec::new();
        
        if property_data.subject_address.trim().is_empty() {
            errors.push(ValidationError {
                field: "SubjectPropertyAddress".to_string(),
                message: "Subject property address is required".to_string(),
                severity: "Critical".to_string(),
            });
        }
        
        if property_data.borrower_name.trim().is_empty() {
            errors.push(ValidationError {
                field: "BorrowerName".to_string(),
                message: "Borrower name is required".to_string(),
                severity: "Critical".to_string(),
            });
        }
        
        errors
    }
}

#[async_trait]
impl Agent for UADAdapterAgent {
    fn id(&self) -> &str {
        "uad-adapter-agent"
    }

    fn capabilities(&self) -> Vec<String> {
        vec![
            "uad-xml-parsing".to_string(),
            "uad-xml-generation".to_string(),
            "uad-validation".to_string(),
            "field-mapping".to_string(),
        ]
    }

    async fn health_check(&self) -> AgentHealth {
        AgentHealth::healthy("UAD adapter agent operational")
    }

    async fn handle(&mut self, msg: MCPMessage) -> MCPResponseMessage {
        info!("UADAdapterAgent processing message: {}", msg.content_type);

        match msg.content_type.as_str() {
            "uad-parse-request" => {
                let xml_content = msg.content.get("xml_content")
                    .and_then(|v| v.as_str())
                    .unwrap_or("");
                
                match self.parse_uad_xml(xml_content).await {
                    Ok(property_data) => {
                        let validation_errors = self.validate_uad_data(&property_data).await;
                        
                        let content = serde_json::json!({
                            "property_data": property_data,
                            "validation_errors": validation_errors,
                            "schema_version": self.schema_version,
                        });
                        create_success_response(self.id(), &msg, "uad-parse-response", content)
                    }
                    Err(e) => {
                        error!("UAD parsing failed: {}", e);
                        create_error_response(self.id(), &msg, &format!("UAD parsing failed: {}", e))
                    }
                }
            }
            "uad-generate-request" => {
                if let Ok(property_data) = serde_json::from_value::<PropertyData>(msg.content.clone()) {
                    match self.generate_uad_xml(&property_data).await {
                        Ok(xml_content) => {
                            let content = serde_json::json!({
                                "xml_content": xml_content,
                                "schema_version": self.schema_version,
                            });
                            create_success_response(self.id(), &msg, "uad-generate-response", content)
                        }
                        Err(e) => {
                            create_error_response(self.id(), &msg, &format!("UAD generation failed: {}", e))
                        }
                    }
                } else {
                    create_error_response(self.id(), &msg, "Invalid property data format")
                }
            }
            _ => {
                warn!("Unknown message type: {}", msg.content_type);
                create_error_response(self.id(), &msg, "Unknown message type")
            }
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, Default)]
pub struct PropertyData {
    pub subject_address: String,
    pub borrower_name: String,
    pub property_rights: String,
    pub legal_description: String,
    pub apn: String,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct ValidationError {
    pub field: String,
    pub message: String,
    pub severity: String,
}