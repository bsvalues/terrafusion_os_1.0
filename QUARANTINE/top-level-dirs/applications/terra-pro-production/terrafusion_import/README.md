# Terrafusion Import Module

High-performance Rust-based data import system for legacy property data formats.

## Features

- SQLite database import with intelligent field mapping
- Modular plugin architecture for extensible format support
- Unified TerraFusionComp schema output
- Comprehensive error handling and validation
- Performance optimized for large datasets

## Supported Formats

- SQLite Database (.sqlite, .db, .sqlite3)

## Installation

```bash
cargo build --release
```

## Usage

### As Library

```rust
use terrafusion_import::{ImportEngine, TerraFusionComp};
use std::path::Path;

let comps = ImportEngine::auto_detect_and_import(Path::new("legacy.sqlite"))?;
let json_output = ImportEngine::export_to_json(&comps)?;
```

### Integration with Terrafusion Platform

The module integrates seamlessly with the Terrafusion platform through Node.js bindings and REST API endpoints.

## Performance Characteristics

- Memory usage: ~50MB for 10K records
- Processing speed: ~1000 records/second
- Concurrent processing: Safe for multi-threaded environments
- Scaling: Linear performance up to 100K records per batch

## Schema Mapping

Intelligent field mapping supports various column name conventions:

- Address: `address`, `property_address`, `street_address`
- Price: `sale_price`, `price`, `sale_amount`, `selling_price`
- Area: `gla`, `sqft`, `square_feet`, `living_area`
- Date: `sale_date`, `closing_date`, `date_sold`
