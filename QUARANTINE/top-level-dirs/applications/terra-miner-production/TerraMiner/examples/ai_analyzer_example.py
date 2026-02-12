#!/usr/bin/env python3
"""
Example script for using the TerraMiner AI Analyzer ETL plugin.

This script demonstrates how to use the AI-powered ETL plugin to
analyze text data using various AI models.
"""

import argparse
import json
import logging
import os
import sys
from typing import Dict, List, Any, Optional

# Add the parent directory to the path so we can import from the etl package
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from etl.__main__ import create_plugin_instance

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def summarize_data(data_source: str, text_field: str, output_table: str, max_length: int = 200, limit: int = 10):
    """
    Summarize text data using AI models.
    
    Args:
        data_source (str): Source table or data structure containing text to summarize
        text_field (str): Field name containing the text to summarize
        output_table (str): Table to store the summarized results
        max_length (int): Maximum length of the summary in characters
        limit (int): Maximum number of records to process
    """
    config = {
        'data_source': data_source,
        'analysis_type': 'summarize',
        'analysis_params': {
            'text_field': text_field,
            'max_length': max_length,
            'limit': limit,
            'include_original': True
        },
        'output_table': output_table
    }
    
    logger.info(f"Summarizing text data from {data_source}.{text_field}")
    
    # Create and run the plugin
    plugin = create_plugin_instance('AIDataAnalyzerETL', config)
    result = plugin.run()
    
    logger.info(f"Data summarization complete: {result}")
    return result

def classify_data(data_source: str, text_field: str, output_table: str, categories: List[str], limit: int = 10):
    """
    Classify text data using AI models.
    
    Args:
        data_source (str): Source table or data structure containing text to classify
        text_field (str): Field name containing the text to classify
        output_table (str): Table to store the classification results
        categories (List[str]): Categories for classification
        limit (int): Maximum number of records to process
    """
    config = {
        'data_source': data_source,
        'analysis_type': 'classify',
        'analysis_params': {
            'text_field': text_field,
            'categories': categories,
            'limit': limit,
            'include_original': True
        },
        'output_table': output_table
    }
    
    logger.info(f"Classifying text data from {data_source}.{text_field}")
    
    # Create and run the plugin
    plugin = create_plugin_instance('AIDataAnalyzerETL', config)
    result = plugin.run()
    
    logger.info(f"Data classification complete: {result}")
    return result

def analyze_sentiment(data_source: str, text_field: str, output_table: str, limit: int = 10):
    """
    Analyze sentiment in text data using AI models.
    
    Args:
        data_source (str): Source table or data structure containing text to analyze
        text_field (str): Field name containing the text to analyze
        output_table (str): Table to store the sentiment analysis results
        limit (int): Maximum number of records to process
    """
    config = {
        'data_source': data_source,
        'analysis_type': 'sentiment',
        'analysis_params': {
            'text_field': text_field,
            'limit': limit,
            'include_original': True
        },
        'output_table': output_table
    }
    
    logger.info(f"Analyzing sentiment in text data from {data_source}.{text_field}")
    
    # Create and run the plugin
    plugin = create_plugin_instance('AIDataAnalyzerETL', config)
    result = plugin.run()
    
    logger.info(f"Sentiment analysis complete: {result}")
    return result

def extract_entities(data_source: str, text_field: str, output_table: str, entity_types: List[str], limit: int = 10):
    """
    Extract entities from text data using AI models.
    
    Args:
        data_source (str): Source table or data structure containing text to analyze
        text_field (str): Field name containing the text to analyze
        output_table (str): Table to store the entity extraction results
        entity_types (List[str]): Types of entities to extract
        limit (int): Maximum number of records to process
    """
    config = {
        'data_source': data_source,
        'analysis_type': 'extract_entities',
        'analysis_params': {
            'text_field': text_field,
            'entity_types': entity_types,
            'limit': limit,
            'include_original': True
        },
        'output_table': output_table
    }
    
    logger.info(f"Extracting entities from text data in {data_source}.{text_field}")
    
    # Create and run the plugin
    plugin = create_plugin_instance('AIDataAnalyzerETL', config)
    result = plugin.run()
    
    logger.info(f"Entity extraction complete: {result}")
    return result

def main():
    """Main function."""
    parser = argparse.ArgumentParser(description='TerraMiner AI Analyzer ETL Example')
    
    parser.add_argument('--analysis-type', choices=['summarize', 'classify', 'sentiment', 'extract_entities'], 
                        required=True, help='Type of AI analysis to perform')
    parser.add_argument('--data-source', required=True, help='Source table or data structure')
    parser.add_argument('--text-field', required=True, help='Field containing the text to analyze')
    parser.add_argument('--output-table', required=True, help='Table to store the analysis results')
    parser.add_argument('--limit', type=int, default=10, help='Maximum number of records to process')
    parser.add_argument('--categories', help='Categories for classification (comma-separated)')
    parser.add_argument('--entity-types', help='Entity types to extract (comma-separated)')
    parser.add_argument('--max-length', type=int, default=200, help='Maximum length for summaries')
    
    args = parser.parse_args()
    
    # Perform the analysis based on the type
    if args.analysis_type == 'summarize':
        summarize_data(args.data_source, args.text_field, args.output_table, args.max_length, args.limit)
    elif args.analysis_type == 'classify':
        if not args.categories:
            parser.error("--categories is required for classification")
        categories = [c.strip() for c in args.categories.split(',')]
        classify_data(args.data_source, args.text_field, args.output_table, categories, args.limit)
    elif args.analysis_type == 'sentiment':
        analyze_sentiment(args.data_source, args.text_field, args.output_table, args.limit)
    elif args.analysis_type == 'extract_entities':
        if not args.entity_types:
            parser.error("--entity-types is required for entity extraction")
        entity_types = [e.strip() for e in args.entity_types.split(',')]
        extract_entities(args.data_source, args.text_field, args.output_table, entity_types, args.limit)
    else:
        logger.error(f"Unsupported analysis type: {args.analysis_type}")

if __name__ == '__main__':
    main()