use crate::template::Template;
use crate::fieldmap::FieldMap;
use serde_json::json;
use std::fs::File;
use std::io::{BufReader, Write};
use anyhow::{Result, anyhow};

pub async fn run_conversion_agent(template_path: &str, input_path: &str, output_path: Option<&str>) -> Result<()> {
    // Load XML mapping template
    let template: Template = {
        let file = File::open(template_path)?;
        serde_xml_rs::from_reader(BufReader::new(file))?
    };

    // Build the field map
    let field_map = FieldMap::from_template(&template);

    // Set delimiter and header config
    let delimiter = template.settings.source_delimiter.as_bytes()[0];
    let has_header = template.settings.source_has_header.eq_ignore_ascii_case("true");

    // Read input file using CSV crate
    let mut rdr = csv::ReaderBuilder::new()
        .delimiter(delimiter)
        .has_headers(has_header)
        .from_path(input_path)?;

    // Prepare output vector
    let mut mapped_records = vec![];

    for result in rdr.records() {
        let record = result?;
        let mut mapped = serde_json::Map::new();
        for (src_idx, dest_key) in field_map.src_index_to_dest.iter() {
            let val = record.get(*src_idx).unwrap_or("").to_string();
            if let Some(split) = &field_map.split_delim {
                for (i, part) in val.split(split).enumerate() {
                    mapped.insert(format!("{}_{}", dest_key, i + 1), json!(part.trim()));
                }
            } else {
                mapped.insert(dest_key.clone(), json!(val));
            }
        }
        mapped_records.push(json!(mapped));
    }

    // Output to JSON or stdout
    let out_json = json!(mapped_records);
    match output_path {
        Some(path) => {
            let mut f = File::create(path)?;
            f.write_all(serde_json::to_string_pretty(&out_json)?.as_bytes())?;
        }
        None => {
            println!("{}", serde_json::to_string_pretty(&out_json)?);
        }
    }

    Ok(())
}