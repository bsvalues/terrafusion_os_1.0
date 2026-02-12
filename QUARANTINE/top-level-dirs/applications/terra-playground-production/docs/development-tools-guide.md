# TaxI_AI Development Tools Guide

## Introduction

This guide covers the setup, installation, and usage of the TaxI_AI Development Platform tools, a comprehensive suite of tools designed for assessment agencies. The platform includes:

1. **Smart Code Snippets Library** - Create, manage, and reuse code snippets specific to assessment applications
2. **Data Visualization Workshop** - Create interactive data visualizations for assessment data
3. **UI Component Playground** - Build and share reusable UI components for assessment applications

## Table of Contents

- [Installation](#installation)
- [Setting Up the Database](#setting-up-the-database)
- [Using the Development Tools API](#using-the-development-tools-api)
- [Using the CLI](#using-the-cli)
- [Development Tools Features](#development-tools-features)
  - [Smart Code Snippets Library](#smart-code-snippets-library)
  - [Data Visualization Workshop](#data-visualization-workshop)
  - [UI Component Playground](#ui-component-playground)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

## Installation

To install and set up the TaxI_AI Development Platform, follow these steps:

1. Clone the repository and navigate to the project directory:

```bash
git clone https://github.com/benton-county/taxi-ai.git
cd taxi-ai
```

2. Install the required dependencies:

```bash
npm install
```

3. Install the CLI tool dependencies:

```bash
npm install -g commander chalk inquirer
```

## Setting Up the Database

The TaxI_AI Development Platform requires a PostgreSQL database. You can set up the necessary database tables using the provided setup script:

```bash
node setup-development-tools-db.js
```

This script will:

1. Create all necessary database tables for the development tools
2. Push the schema changes to the database
3. Verify that all required tables were created successfully

## Using the Development Tools API

The TaxI_AI Development Platform exposes several API endpoints that you can use to interact with the development tools programmatically. You can test these endpoints using the provided test script:

```bash
node test-development-tools-api.js
```

This script tests all the API endpoints for:

- Code snippets
- Data visualizations
- UI component templates

## Using the CLI

The TaxI_AI Development Platform comes with a command-line interface for managing development tools. You can use the CLI to perform various tasks without using the web interface:

```bash
node taxi-dev-tools-cli.js <command> [options]
```

### Available Commands

#### Code Snippets

```bash
# List all code snippets
node taxi-dev-tools-cli.js snippets:list

# Get a specific code snippet
node taxi-dev-tools-cli.js snippets:get <id>

# Export a code snippet to a file
node taxi-dev-tools-cli.js snippets:export <id> [filename]

# Create a new code snippet (interactive)
node taxi-dev-tools-cli.js snippets:create

# Delete a code snippet
node taxi-dev-tools-cli.js snippets:delete <id>

# Generate a code snippet with AI (interactive)
node taxi-dev-tools-cli.js snippets:generate
```

#### Data Visualizations

```bash
# List all data visualizations
node taxi-dev-tools-cli.js visualizations:list

# Get a specific data visualization
node taxi-dev-tools-cli.js visualizations:get <id>

# Export a data visualization to a JSON file
node taxi-dev-tools-cli.js visualizations:export <id> [filename]
```

#### UI Components

```bash
# List all UI component templates
node taxi-dev-tools-cli.js components:list

# Get a specific UI component template
node taxi-dev-tools-cli.js components:get <id>

# Export a UI component to a file
node taxi-dev-tools-cli.js components:export <id> [filename]

# Generate a UI component with AI (interactive)
node taxi-dev-tools-cli.js components:generate
```

## Development Tools Features

### Smart Code Snippets Library

The Smart Code Snippets Library allows you to create, manage, and reuse code snippets specific to assessment applications. Key features include:

- Create and manage code snippets in various languages
- Categorize snippets by type and language
- Tag snippets for easy search and filtering
- Use AI to generate code snippets based on natural language descriptions
- Import and export snippets to files

### Data Visualization Workshop

The Data Visualization Workshop allows you to create interactive data visualizations for assessment data. Key features include:

- Create and manage various types of visualizations (bar charts, line charts, pie charts, etc.)
- Configure visualization settings and appearance
- Connect visualizations to data sources
- Use AI to generate visualization configurations based on your data
- Export visualizations as JSON configurations

### UI Component Playground

The UI Component Playground allows you to build and share reusable UI components for assessment applications. Key features include:

- Create and manage UI components in various frameworks (React, Vue, Angular, etc.)
- Categorize components by type and framework
- Tag components for easy search and filtering
- Use AI to generate components based on natural language descriptions
- Import and export components to files

## API Reference

### Code Snippets API

| Endpoint                  | Method | Description                                                  |
| ------------------------- | ------ | ------------------------------------------------------------ |
| `/code-snippets`          | GET    | Get all code snippets with optional filtering                |
| `/code-snippets/:id`      | GET    | Get a single code snippet by ID                              |
| `/code-snippets`          | POST   | Create a new code snippet                                    |
| `/code-snippets/:id`      | PUT    | Update a code snippet                                        |
| `/code-snippets/:id`      | DELETE | Delete a code snippet                                        |
| `/code-snippets/generate` | POST   | Generate a code snippet with AI                              |
| `/code-snippets/metadata` | GET    | Get code snippet metadata (available languages, types, etc.) |

### Data Visualizations API

| Endpoint                               | Method | Description                                                        |
| -------------------------------------- | ------ | ------------------------------------------------------------------ |
| `/data-visualizations`                 | GET    | Get all data visualizations with optional filtering                |
| `/data-visualizations/:id`             | GET    | Get a single data visualization by ID                              |
| `/data-visualizations`                 | POST   | Create a new data visualization                                    |
| `/data-visualizations/:id`             | PUT    | Update a data visualization                                        |
| `/data-visualizations/:id`             | DELETE | Delete a data visualization                                        |
| `/data-visualizations/generate-config` | POST   | Generate a data visualization config with AI                       |
| `/data-visualizations/metadata`        | GET    | Get data visualization metadata (available types, libraries, etc.) |

### UI Component Templates API

| Endpoint                  | Method | Description                                                   |
| ------------------------- | ------ | ------------------------------------------------------------- |
| `/ui-components`          | GET    | Get all UI component templates with optional filtering        |
| `/ui-components/:id`      | GET    | Get a single UI component template by ID                      |
| `/ui-components`          | POST   | Create a new UI component template                            |
| `/ui-components/:id`      | PUT    | Update a UI component template                                |
| `/ui-components/:id`      | DELETE | Delete a UI component template                                |
| `/ui-components/generate` | POST   | Generate a UI component with AI                               |
| `/ui-components/metadata` | GET    | Get UI component metadata (available types, frameworks, etc.) |

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues, check:

1. Ensure the `DATABASE_URL` environment variable is set correctly
2. Verify that the PostgreSQL server is running
3. Check that the user has the necessary permissions to access the database

### API Request Failures

If API requests fail:

1. Ensure the server is running (`npm run dev`)
2. Check the server logs for any error messages
3. Verify that the request URLs and parameters are correct

### CLI Tool Issues

If the CLI tool doesn't work as expected:

1. Ensure you have installed all required dependencies
2. Check that the server is running
3. Verify that you're using the correct command syntax
