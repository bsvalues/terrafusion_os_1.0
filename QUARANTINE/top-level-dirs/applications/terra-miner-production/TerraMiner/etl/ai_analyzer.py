"""
AI-powered data analysis module for ETL operations.

This module provides utilities for analyzing data using AI models,
including data classification, content summarization, sentiment analysis,
and entity extraction.
"""

import os
import json
import logging
from typing import Dict, List, Any, Union, Optional
from datetime import datetime

from app import db
from etl.base import BaseETL
from ai.models.model_factory import ModelFactory

# Configure logger
logger = logging.getLogger(__name__)

class AIDataAnalyzerETL(BaseETL):
    """
    ETL plugin for analyzing data using AI models.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the AI Data Analyzer ETL plugin.
        
        Args:
            config (Dict[str, Any], optional): Configuration options including:
                - data_source: Source of data to analyze (table name, other ETL job ID)
                - analysis_type: Type of analysis to perform
                - analysis_params: Parameters for the analysis
                - output_table: Table to store analysis results
                - api_key: OpenAI API key (default: from environment)
        """
        super().__init__(config)
        
        # Set default configuration values
        self.config.setdefault('data_source', None)
        self.config.setdefault('analysis_type', 'summarize')
        self.config.setdefault('analysis_params', {})
        self.config.setdefault('output_table', 'ai_analysis_results')
        self.config.setdefault('api_key', os.environ.get('OPENAI_API_KEY'))
        
        # Validate required config
        if not self.config['data_source']:
            raise ValueError("data_source is required for AI Data Analyzer ETL")
            
        # Set up OpenAI client
        self.api_key = self.config['api_key']
        if not self.api_key:
            raise ValueError("OpenAI API key is required for AI analysis")
    
    def extract(self) -> Any:
        """
        Extract data to analyze.
        
        Returns:
            Any: The raw data to analyze
        """
        try:
            data_source = self.config['data_source']
            logger.info(f"Extracting data from source: {data_source}")
            
            # Check if data source is a table name
            if isinstance(data_source, str):
                # Query the database
                from sqlalchemy import create_engine, text
                
                # Get database URL from environment
                database_url = os.environ.get('DATABASE_URL')
                if not database_url:
                    raise ValueError("DATABASE_URL environment variable is not set")
                
                engine = create_engine(database_url)
                
                query_params = self.config.get('query_params', {})
                limit = query_params.get('limit', 100)
                
                with engine.connect() as conn:
                    if query_params.get('custom_query'):
                        query = text(query_params['custom_query'])
                        result = conn.execute(query)
                    else:
                        fields = query_params.get('fields', '*')
                        field_str = ', '.join(fields) if isinstance(fields, list) else fields
                        
                        where_clause = ''
                        if 'where' in query_params:
                            where_clause = f"WHERE {query_params['where']}"
                            
                        order_by = query_params.get('order_by', '')
                        if order_by:
                            order_by = f"ORDER BY {order_by}"
                            
                        query = text(f"SELECT {field_str} FROM {data_source} {where_clause} {order_by} LIMIT {limit}")
                        result = conn.execute(query)
                    
                    # Convert to list of dictionaries
                    data = [dict(row) for row in result]
                
                logger.info(f"Extracted {len(data)} records from table {data_source}")
                return data
                
            # If data_source is already a data structure, use it directly
            elif isinstance(data_source, (list, dict)):
                return data_source
                
            else:
                raise ValueError(f"Unsupported data_source type: {type(data_source)}")
                
        except Exception as e:
            logger.exception(f"Error extracting data for AI analysis: {str(e)}")
            raise
    
    def transform(self, raw_data: Any) -> List[Dict[str, Any]]:
        """
        Analyze data using AI models.
        
        Args:
            raw_data (Any): The raw data to analyze
            
        Returns:
            List[Dict[str, Any]]: The analysis results
        """
        try:
            analysis_type = self.config['analysis_type']
            params = self.config.get('analysis_params', {})
            
            logger.info(f"Performing AI analysis of type: {analysis_type}")
            
            if analysis_type == 'summarize':
                return self._summarize_data(raw_data, params)
            elif analysis_type == 'classify':
                return self._classify_data(raw_data, params)
            elif analysis_type == 'sentiment':
                return self._analyze_sentiment(raw_data, params)
            elif analysis_type == 'extract_entities':
                return self._extract_entities(raw_data, params)
            else:
                raise ValueError(f"Unsupported analysis type: {analysis_type}")
                
        except Exception as e:
            logger.exception(f"Error analyzing data with AI: {str(e)}")
            raise
    
    def load(self, processed_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Store analysis results.
        
        Args:
            processed_data (List[Dict[str, Any]]): The analysis results
            
        Returns:
            Dict[str, Any]: Load result information
        """
        try:
            output_table = self.config['output_table']
            record_count = len(processed_data)
            
            # Check if any records to load
            if not record_count:
                logger.warning(f"No analysis results to store")
                return {
                    "records_processed": 0,
                    "table_name": output_table,
                    "success": True,
                    "message": "No analysis results to store"
                }
            
            # Create database engine and connection
            from sqlalchemy import create_engine, Table, Column, MetaData, insert
            from sqlalchemy import String, Integer, Float, Boolean, DateTime, Text, JSON
            
            # Get database URL from environment
            database_url = os.environ.get('DATABASE_URL')
            if not database_url:
                raise ValueError("DATABASE_URL environment variable is not set")
            
            # Create engine and metadata
            engine = create_engine(database_url)
            metadata = MetaData()
            
            # Create result table schema
            columns = [
                Column('id', Integer, primary_key=True),
                Column('analysis_type', String(50)),
                Column('created_at', DateTime, default=datetime.now),
                Column('source_id', String(255)),
                Column('result', JSON),
                Column('confidence', Float, nullable=True),
                Column('category', String(255), nullable=True),
                Column('entities', JSON, nullable=True),
                Column('summary', Text, nullable=True),
                Column('sentiment', Float, nullable=True),
                Column('metadata', JSON, nullable=True)
            ]
            
            # Create table if it doesn't exist
            analysis_table = Table(output_table, metadata, *columns)
            metadata.create_all(engine)
            
            # Transform data to match table schema
            records_to_insert = []
            analysis_type = self.config['analysis_type']
            
            for item in processed_data:
                record = {
                    'analysis_type': analysis_type,
                    'created_at': datetime.now(),
                    'result': item,
                    'source_id': str(item.get('id', '')),
                }
                
                # Add specific fields based on analysis type
                if analysis_type == 'summarize':
                    record['summary'] = item.get('summary')
                elif analysis_type == 'classify':
                    record['category'] = item.get('category')
                    record['confidence'] = item.get('confidence')
                elif analysis_type == 'sentiment':
                    record['sentiment'] = item.get('sentiment')
                    record['confidence'] = item.get('confidence')
                elif analysis_type == 'extract_entities':
                    record['entities'] = item.get('entities')
                
                # Add metadata
                metadata = {}
                for k, v in item.items():
                    if k not in ['id', 'summary', 'category', 'confidence', 'sentiment', 'entities']:
                        metadata[k] = v
                
                record['metadata'] = metadata
                records_to_insert.append(record)
            
            # Insert data
            with engine.connect() as conn:
                conn.execute(insert(analysis_table), records_to_insert)
                conn.commit()
            
            logger.info(f"Successfully stored {record_count} analysis results into table: {output_table}")
            
            return {
                "records_processed": record_count,
                "table_name": output_table,
                "success": True,
                "message": f"Stored {record_count} analysis results"
            }
            
        except Exception as e:
            logger.exception(f"Error storing analysis results: {str(e)}")
            raise
    
    def _summarize_data(self, data: Any, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Summarize data using the OpenAI API.
        
        Args:
            data (Any): Data to summarize
            params (Dict[str, Any]): Parameters for summarization
            
        Returns:
            List[Dict[str, Any]]: Summarization results
        """
        results = []
        
        # Determine what to summarize
        text_field = params.get('text_field')
        max_length = params.get('max_length', 200)
        
        # Process each record
        for i, item in enumerate(data):
            if i >= params.get('limit', 10):
                break
                
            summary = None
            text_to_summarize = None
            
            # Get text to summarize
            if text_field and text_field in item:
                text_to_summarize = item[text_field]
            elif isinstance(item, dict):
                # Summarize entire record
                text_to_summarize = json.dumps(item, default=str, indent=2)
            else:
                text_to_summarize = str(item)
            
            if not text_to_summarize:
                continue
            
            try:
                # Use the ModelFactory to get the OpenAI client
                model_factory = ModelFactory()
                openai_client = model_factory.get_client("openai")
                
                # Call OpenAI API through the client
                prompt = f"Summarize the following text concisely, in about {max_length} characters:\n\n{text_to_summarize}"
                summary = openai_client.generate_completion(prompt, max_tokens=250)
                
                # Add to results
                result = {
                    'id': item.get('id', i),
                    'summary': summary,
                    'original_length': len(text_to_summarize),
                    'summary_length': len(summary)
                }
                
                # Include original fields if requested
                if params.get('include_original', False):
                    for k, v in item.items():
                        result[f"original_{k}"] = v
                
                results.append(result)
                
            except Exception as e:
                logger.error(f"Error summarizing item {i}: {str(e)}")
                results.append({
                    'id': item.get('id', i),
                    'error': str(e),
                    'summary': None
                })
        
        return results
    
    def _classify_data(self, data: Any, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Classify data using the OpenAI API.
        
        Args:
            data (Any): Data to classify
            params (Dict[str, Any]): Parameters for classification
            
        Returns:
            List[Dict[str, Any]]: Classification results
        """
        results = []
        
        # Get classification parameters
        text_field = params.get('text_field')
        categories = params.get('categories', [])
        categories_str = ', '.join(categories) if categories else "suitable categories"
        
        # Process each record
        for i, item in enumerate(data):
            if i >= params.get('limit', 10):
                break
                
            text_to_classify = None
            
            # Get text to classify
            if text_field and text_field in item:
                text_to_classify = item[text_field]
            elif isinstance(item, dict):
                # Classify entire record
                text_to_classify = json.dumps(item, default=str)
            else:
                text_to_classify = str(item)
            
            if not text_to_classify:
                continue
            
            try:
                # Use the ModelFactory to get the OpenAI client
                model_factory = ModelFactory()
                openai_client = model_factory.get_client("openai")
                
                # Call OpenAI API through the client
                prompt = f"Classify the following text into one of these categories: {categories_str}.\n\nText: {text_to_classify}\n\nRespond with JSON in this format: {'{'}'category': string, 'confidence': number{'}'}."
                
                system_prompt = "You are a data classification expert."
                response_text = openai_client.generate_structured_completion(system_prompt, prompt)
                
                result_json = json.loads(response_text)
                
                # Add to results
                result = {
                    'id': item.get('id', i),
                    'category': result_json.get('category'),
                    'confidence': result_json.get('confidence')
                }
                
                # Include original fields if requested
                if params.get('include_original', False):
                    for k, v in item.items():
                        result[f"original_{k}"] = v
                
                results.append(result)
                
            except Exception as e:
                logger.error(f"Error classifying item {i}: {str(e)}")
                results.append({
                    'id': item.get('id', i),
                    'error': str(e),
                    'category': None,
                    'confidence': None
                })
        
        return results
    
    def _analyze_sentiment(self, data: Any, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Analyze sentiment in data using the OpenAI API.
        
        Args:
            data (Any): Data to analyze
            params (Dict[str, Any]): Parameters for sentiment analysis
            
        Returns:
            List[Dict[str, Any]]: Sentiment analysis results
        """
        results = []
        
        # Get sentiment analysis parameters
        text_field = params.get('text_field')
        
        # Process each record
        for i, item in enumerate(data):
            if i >= params.get('limit', 10):
                break
                
            text_to_analyze = None
            
            # Get text to analyze
            if text_field and text_field in item:
                text_to_analyze = item[text_field]
            elif isinstance(item, dict):
                # Analyze entire record
                text_to_analyze = json.dumps(item, default=str)
            else:
                text_to_analyze = str(item)
            
            if not text_to_analyze:
                continue
            
            try:
                # Use the ModelFactory to get the OpenAI client
                model_factory = ModelFactory()
                openai_client = model_factory.get_client("openai")
                
                # Call OpenAI API through the client
                prompt = f"Analyze the sentiment of the following text. Provide a score from -1.0 (very negative) to 1.0 (very positive), and a confidence score between 0 and 1.\n\nText: {text_to_analyze}\n\nRespond with JSON in this format: {'{'}'sentiment': number, 'confidence': number{'}'}."
                
                system_prompt = "You are a sentiment analysis expert."
                response_text = openai_client.generate_structured_completion(system_prompt, prompt)
                
                result_json = json.loads(response_text)
                
                # Add to results
                result = {
                    'id': item.get('id', i),
                    'sentiment': result_json.get('sentiment'),
                    'confidence': result_json.get('confidence')
                }
                
                # Include original fields if requested
                if params.get('include_original', False):
                    for k, v in item.items():
                        result[f"original_{k}"] = v
                
                results.append(result)
                
            except Exception as e:
                logger.error(f"Error analyzing sentiment for item {i}: {str(e)}")
                results.append({
                    'id': item.get('id', i),
                    'error': str(e),
                    'sentiment': None,
                    'confidence': None
                })
        
        return results
    
    def _extract_entities(self, data: Any, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract entities from data using the OpenAI API.
        
        Args:
            data (Any): Data to analyze
            params (Dict[str, Any]): Parameters for entity extraction
            
        Returns:
            List[Dict[str, Any]]: Entity extraction results
        """
        results = []
        
        # Get entity extraction parameters
        text_field = params.get('text_field')
        entity_types = params.get('entity_types', ['person', 'organization', 'location', 'date', 'product'])
        entity_types_str = ', '.join(entity_types)
        
        # Process each record
        for i, item in enumerate(data):
            if i >= params.get('limit', 10):
                break
                
            text_to_analyze = None
            
            # Get text to analyze
            if text_field and text_field in item:
                text_to_analyze = item[text_field]
            elif isinstance(item, dict):
                # Analyze entire record
                text_to_analyze = json.dumps(item, default=str)
            else:
                text_to_analyze = str(item)
            
            if not text_to_analyze:
                continue
            
            try:
                # Use the ModelFactory to get the OpenAI client
                model_factory = ModelFactory()
                openai_client = model_factory.get_client("openai")
                
                # Call OpenAI API through the client
                prompt = f"Extract the following entity types from this text: {entity_types_str}.\n\nText: {text_to_analyze}\n\nRespond with JSON in this format: {'{'}'entities': {'{'}'entity_type': [list of extracted entities]{'}'}{'}'}."
                
                system_prompt = "You are an entity extraction expert."
                response_text = openai_client.generate_structured_completion(system_prompt, prompt)
                
                result_json = json.loads(response_text)
                
                # Add to results
                result = {
                    'id': item.get('id', i),
                    'entities': result_json.get('entities', {})
                }
                
                # Include original fields if requested
                if params.get('include_original', False):
                    for k, v in item.items():
                        result[f"original_{k}"] = v
                
                results.append(result)
                
            except Exception as e:
                logger.error(f"Error extracting entities from item {i}: {str(e)}")
                results.append({
                    'id': item.get('id', i),
                    'error': str(e),
                    'entities': {}
                })
        
        return results