# -*- coding: utf-8 -*-

# This file contains global settings for Data Loading Tools.

# DataReference WorkSheets
SOURCE_TARGET = "SourceTargetMapping"
DATA_PATH = "DataPath"

# DataReference Columns
SOURCE = "Source"
DEFINITION_QUERY = "SourceDefinitionQuery"
TARGET = "Target"
DELETE_QUERY = "TargetDeleteQuery"
MAPPING_WORKBOOK = "MappingWorkbook"
ENABLED = "Enabled"
ATTACHMENTS = "MaintainAttachments"
GLOBALIDS = "PreserveGlobalIds"
TRANSFORMATIONS = "GeographicTransformations"

# Info Worksheet
INFO = "-Info-"
HELP = "https://links.esri.com/DataLoadingToolset"
HELP_TEXT = "Data Loading Tools Help"
GLOBAL_LOOKUP_WORKBOOK = "Global Lookup"

HIDDEN_SHEET = "-Lookup-"

# Info Sheet Columns
MAPPING_PROPERTY = "MappingProperty"
VALUE = "Value"
SOURCE_ST = "Source Subtype"

# Mapping Sheet
MAPPING = "-Mapping-"

# Mapping Sheet Columns
TARGET_FIELD = "TargetField"
FIELD_TYPE = "FieldType"
EXPRESSION = "Expression"
LOOKUP_SHEET = "LookupSheet"
LOOKUP_KEYS = "LookupKeys"
LOOKUP_VALUE = "LookupValue"
LOOKUP_DEFAULT = "LookupDefault"

# Schema Sheets
TARGET_SCHEMA = "-TargetSchema-"
SOURCE_SCHEMA = "-SourceSchema-"

# Schema Sheets Columns
SCHEMA_HEADER = ["Name", "Alias", "Type", "Length", "Domain", "Default", "Nullable", "Editable"]
COUNT = "Count"
FILL_FACTOR = "FillFactor"

# Subtype Sheets (keep for updating old DLW)
TARGET_SUBTYPES = "TargetSubtypes"
SOURCE_SUBTYPES = "SourceSubtypes"

# Subtype Sheets Columns
SUBTYPES_FIELD_NAME = "FieldName"

# Introduction Sheet
INTRO = "Introduction"

# Format Settings
MAX_ROWS = 150

# Folder names
WORKSPACE_FOLDER = "DataLoadingWorkspace"
MAPPING_FOLDER = "DataMapping"
DOMAINS_FOLDER = "Domains"
SCRIPTS_FOLDER = "Scripts"
GLOBAL_LOOKUP = "GlobalLookup"
