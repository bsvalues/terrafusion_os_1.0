#!/usr/bin/env python3
"""
Example script for using the TerraMiner File ETL plugins.

This script demonstrates how to use the file-based ETL plugins to process
various types of files and load the data into the database.
"""

import argparse
import json
import logging
import os
import sys
from typing import Dict, List, Any, Optional

# Add the parent directory to the path so we can import from the etl package
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from etl.__main__ import create_plugin_instance, discover_plugins

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def list_plugins():
    """List all available ETL plugins."""
    plugins = discover_plugins()
    
    print("\nAvailable ETL Plugins:")
    print("=====================")
    
    for plugin_class in plugins:
        name = plugin_class.__name__
        module = plugin_class.__module__
        description = plugin_class.__doc__ or "No description available"
        description = description.strip().split('\n')[0]
        
        print(f"{name} ({module})")
        print(f"  {description}")
        print()

def process_csv_file(file_path: str, table_name: str):
    """
    Process a CSV file using the CSVFileETL plugin.
    
    Args:
        file_path (str): Path to the CSV file
        table_name (str): Name of the database table to load data into
    """
    config = {
        'file_path': file_path,
        'table_name': table_name,
        'delimiter': ',',
        'has_header': True,
        'encoding': 'utf-8'
    }
    
    logger.info(f"Processing CSV file: {file_path}")
    
    # Create and run the plugin
    plugin = create_plugin_instance('CSVFileETL', config)
    result = plugin.run()
    
    logger.info(f"CSV file processed: {result}")
    return result

def process_excel_file(file_path: str, table_name: str, sheet_name: str = 'Sheet1'):
    """
    Process an Excel file using the ExcelFileETL plugin.
    
    Args:
        file_path (str): Path to the Excel file
        table_name (str): Name of the database table to load data into
        sheet_name (str): Name of the sheet to process
    """
    config = {
        'file_path': file_path,
        'table_name': table_name,
        'sheet_name': sheet_name,
        'has_header': True
    }
    
    logger.info(f"Processing Excel file: {file_path} (sheet: {sheet_name})")
    
    # Create and run the plugin
    plugin = create_plugin_instance('ExcelFileETL', config)
    result = plugin.run()
    
    logger.info(f"Excel file processed: {result}")
    return result

def process_json_file(file_path: str, table_name: str, json_path: Optional[str] = None):
    """
    Process a JSON file using the JSONFileETL plugin.
    
    Args:
        file_path (str): Path to the JSON file
        table_name (str): Name of the database table to load data into
        json_path (str, optional): Path to access data within the JSON
    """
    config = {
        'file_path': file_path,
        'table_name': table_name
    }
    
    if json_path:
        config['json_path'] = json_path
    
    logger.info(f"Processing JSON file: {file_path}")
    
    # Create and run the plugin
    plugin = create_plugin_instance('JSONFileETL', config)
    result = plugin.run()
    
    logger.info(f"JSON file processed: {result}")
    return result

def process_xml_file(file_path: str, table_name: str, xpath: Optional[str] = None):
    """
    Process an XML file using the XMLFileETL plugin.
    
    Args:
        file_path (str): Path to the XML file
        table_name (str): Name of the database table to load data into
        xpath (str, optional): XPath expression to extract data
    """
    config = {
        'file_path': file_path,
        'table_name': table_name
    }
    
    if xpath:
        config['xpath'] = xpath
    
    logger.info(f"Processing XML file: {file_path}")
    
    # Create and run the plugin
    plugin = create_plugin_instance('XMLFileETL', config)
    result = plugin.run()
    
    logger.info(f"XML file processed: {result}")
    return result

def main():
    """Main function."""
    parser = argparse.ArgumentParser(description='TerraMiner File ETL Example')
    
    parser.add_argument('--list-plugins', action='store_true', help='List all available ETL plugins')
    parser.add_argument('--file-path', help='Path to the file to process')
    parser.add_argument('--file-type', choices=['csv', 'excel', 'json', 'xml'], help='Type of file to process')
    parser.add_argument('--table-name', help='Name of the database table to load data into')
    parser.add_argument('--sheet-name', default='Sheet1', help='Sheet name for Excel files (default: Sheet1)')
    parser.add_argument('--json-path', help='Path to access data within JSON files')
    parser.add_argument('--xpath', help='XPath expression for XML files')
    
    args = parser.parse_args()
    
    if args.list_plugins:
        list_plugins()
        return
    
    if not args.file_path or not args.file_type or not args.table_name:
        parser.print_help()
        return
    
    # Process the file based on the type
    if args.file_type == 'csv':
        process_csv_file(args.file_path, args.table_name)
    elif args.file_type == 'excel':
        process_excel_file(args.file_path, args.table_name, args.sheet_name)
    elif args.file_type == 'json':
        process_json_file(args.file_path, args.table_name, args.json_path)
    elif args.file_type == 'xml':
        process_xml_file(args.file_path, args.table_name, args.xpath)
    else:
        logger.error(f"Unsupported file type: {args.file_type}")

if __name__ == '__main__':
    main()