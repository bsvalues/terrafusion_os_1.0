use crate::template::{Template, Field};
use std::collections::HashMap;

pub struct FieldMap {
    pub src_index_to_dest: HashMap<usize, String>,
    pub split_delim: Option<String>,
}

impl FieldMap {
    pub fn from_template(template: &Template) -> Self {
        let mut src_index_to_dest = HashMap::new();
        for (i, src_field) in template.primary_fields.fields.iter().enumerate() {
            if let Some(dest_field) = template.secondary_fields.fields.get(i) {
                src_index_to_dest.insert(src_field.index, dest_field.key.clone());
            }
        }
        let split_delim = if template.split_option.trim().is_empty() {
            None
        } else {
            Some(template.split_option.clone())
        };
        FieldMap { src_index_to_dest, split_delim }
    }
}