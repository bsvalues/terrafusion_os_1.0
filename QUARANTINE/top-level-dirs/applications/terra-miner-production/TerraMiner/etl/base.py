"""
Base ETL module defining the interface for all ETL plugins.
"""
import logging
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Dict, Optional

# Configure logger
logger = logging.getLogger(__name__)

class BaseETL(ABC):
    """
    Abstract base class for all ETL plugins.
    
    Each ETL plugin must implement:
    - extract(): Fetch raw data from the source
    - transform(): Convert raw data into a format that can be loaded
    - load(): Store the processed data into the database
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the ETL plugin with optional configuration.
        
        Args:
            config (Dict[str, Any], optional): Configuration options for the ETL process
        """
        self.config = config or {}
        self.start_time = None
        self.end_time = None
        
    @abstractmethod
    def extract(self) -> Any:
        """
        Extract raw data from the source.
        
        Returns:
            Any: The raw data from the source
        """
        pass
    
    @abstractmethod
    def transform(self, raw_data: Any) -> Any:
        """
        Transform the raw data into a format that can be loaded.
        
        Args:
            raw_data (Any): The raw data from the extract step
            
        Returns:
            Any: The processed data ready for loading
        """
        pass
    
    @abstractmethod
    def load(self, processed_data: Any) -> Any:
        """
        Load the processed data into the destination (usually database).
        
        Args:
            processed_data (Any): The processed data from the transform step
            
        Returns:
            Any: Result of the load operation (e.g., success status, row count)
        """
        pass
    
    def run(self) -> Dict[str, Any]:
        """
        Execute the full ETL process.
        
        Returns:
            Dict[str, Any]: Result summary of the ETL process
        """
        result = {
            "success": False,
            "start_time": None,
            "end_time": None,
            "duration_seconds": 0,
            "records_processed": 0,
            "error": None
        }
        
        try:
            # Record start time
            self.start_time = datetime.now()
            result["start_time"] = self.start_time
            
            logger.info(f"Starting ETL process: {self.__class__.__name__}")
            
            # Extract
            logger.info(f"Extracting data from source...")
            raw_data = self.extract()
            
            # Transform
            logger.info(f"Transforming data...")
            processed_data = self.transform(raw_data)
            
            # Load
            logger.info(f"Loading data into destination...")
            load_result = self.load(processed_data)
            
            # Record end time
            self.end_time = datetime.now()
            result["end_time"] = self.end_time
            result["duration_seconds"] = (self.end_time - self.start_time).total_seconds()
            
            # Update result
            result["success"] = True
            if hasattr(load_result, "get"):
                result.update(load_result)
            
            logger.info(f"ETL process completed successfully in {result['duration_seconds']:.2f} seconds")
            return result
            
        except Exception as e:
            logger.exception(f"Error in ETL process: {str(e)}")
            self.end_time = datetime.now()
            
            # Update result with error information
            result["end_time"] = self.end_time
            result["duration_seconds"] = (self.end_time - self.start_time).total_seconds() if self.start_time else 0
            result["error"] = str(e)
            
            return result
    
    def __str__(self) -> str:
        """String representation of the ETL plugin."""
        return f"{self.__class__.__name__} ETL Plugin"