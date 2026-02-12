# Data Processor Plugin

A powerful plugin for CodeAgent that provides tools for processing and transforming various data formats including CSV, JSON, and XML.

## Installation

```bash
# Install from local directory
codeagent plugin --install /path/to/data-processor

# Install from repository (if available)
codeagent plugin --install git+https://github.com/codeagent/data-processor-plugin.git
```

## Features

- **CSV Parsing**: Parse CSV files into structured data
- **JSON Transformation**: Transform JSON data using JavaScript expressions
- **XML Processing**: Process and convert XML data to JSON
- **Data Context**: Automatically adds data context to relevant commands
- **Data Summaries**: Generate summaries of data processing operations

## Tools

### CSV Parser

Parse CSV files into structured data.

```bash
codeagent ask "Parse the sales.csv file using data_processor_csv_parser"
```

Parameters:

- `file`: Path to the CSV file (required)
- `delimiter`: CSV delimiter character (default: ',')
- `headers`: Whether the CSV has headers (default: true)
- `outputFormat`: Output format (json or array) (default: 'json')

Example:

```bash
codeagent ask "Use data_processor_csv_parser to parse customer_data.csv with delimiter=';'"
```

### JSON Transformer

Transform JSON data using JavaScript expressions.

```bash
codeagent ask "Transform data.json using data_processor_json_transformer"
```

Parameters:

- `input`: JSON string or path to JSON file (required)
- `transform`: JavaScript transform expression (e.g., "item => ({ ...item, processed: true })") (required)
- `filter`: JavaScript filter expression (e.g., "item => item.value > 10") (optional)
- `output`: Output file path (optional)

Example:

```bash
codeagent ask "Use data_processor_json_transformer to transform users.json with transform='item => ({ name: item.name, email: item.email })' and filter='item => item.active === true' and output='active_users.json'"
```

### XML Processor

Process and convert XML data to JSON (implementation pending).

## Hooks

### Data Context Hook

Automatically adds data context to relevant commands. This hook:

1. Detects data-related commands based on keywords
2. Adds context including allowed formats, output format, and other settings
3. Scans for data files in the current directory (when applicable)

### Data Summary Hook

Generates summaries of data processing operations. This hook:

1. Detects when data processing results are available
2. Generates a summary including record counts, fields, and file sizes
3. Adds verbose information when enabled in settings

## Settings

This plugin can be configured using the settings manager:

```bash
codeagent plugin-settings --edit data-processor
```

Available settings:

- `maxFileSize`: Maximum file size in bytes (default: 10485760 - 10MB)
- `allowedFormats`: Array of allowed file formats (default: ["csv", "json", "xml"])
- `outputFormat`: Default output format (default: "json")
- `verbose`: Whether to show verbose output (default: false)
- `tempDirectory`: Directory for temporary files (default: "./temp")
- `validation`: Validation settings:
  - `enabled`: Whether validation is enabled (default: true)
  - `strictMode`: Whether to use strict validation (default: false)
  - `maxErrors`: Maximum number of validation errors (default: 10)

## Examples

### Process and Transform Sales Data

```bash
# Parse a CSV file
codeagent ask "Parse sales.csv using data_processor_csv_parser"

# Transform the data
codeagent ask "Use data_processor_json_transformer with input='sales_data.json' and transform='item => ({ ...item, revenue: item.price * item.quantity })' and output='sales_with_revenue.json'"
```

### Batch Process Multiple Files

```bash
# First, add data context to find available files
codeagent ask "Find data files in ./data directory"

# Process each CSV file in the directory
codeagent ask "Process all CSV files in data directory and transform them to JSON"
```

## Development

This plugin was created with the CodeAgent Plugin Configuration Wizard. To modify the plugin:

1. Edit the configuration:

```bash
codeagent plugin --wizard data-processor
```

2. Modify the settings:

```bash
codeagent plugin-settings --edit data-processor
```

3. Reinstall the plugin:

```bash
codeagent plugin --install /path/to/data-processor
```

## Author

CodeAgent Team

## Repository

https://github.com/codeagent/data-processor-plugin
