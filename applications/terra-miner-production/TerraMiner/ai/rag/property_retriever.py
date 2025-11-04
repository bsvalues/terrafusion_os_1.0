import logging
from typing import List, Dict, Any, Optional
import re
from db.database import Database

logger = logging.getLogger(__name__)

class PropertyRetriever:
    """
    Retriever for property data to support RAG-based AI responses.
    """
    
    def __init__(self):
        """Initialize the property retriever"""
        self.db = None
    
    def _connect_db(self):
        """Connect to database if not already connected"""
        if not self.db:
            self.db = Database()
    
    def _close_db(self):
        """Close database connection if open"""
        if self.db:
            self.db.close()
            self.db = None
    
    def retrieve_by_address(self, address: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieve properties by address
        
        Args:
            address (str): The address to search for (can be partial)
            limit (int): Maximum number of results to return
            
        Returns:
            List[Dict[str, Any]]: List of property records
        """
        try:
            self._connect_db()
            
            # Create a normalized version of the address for searching
            search_term = f"%{address.lower().strip()}%"
            
            query = f"""
                SELECT * FROM narrpr_reports 
                WHERE LOWER(address) LIKE '{search_term}'
                ORDER BY created_at DESC 
                LIMIT {limit}
            """
            
            results = self.db.execute_query(query)
            logger.info(f"Retrieved {len(results)} properties matching address '{address}'")
            return results
            
        except Exception as e:
            logger.error(f"Error retrieving properties by address: {str(e)}")
            return []
            
        finally:
            self._close_db()
    
    def retrieve_by_price_range(self, min_price: float, max_price: float, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Retrieve properties within a price range
        
        Args:
            min_price (float): Minimum price
            max_price (float): Maximum price
            limit (int): Maximum number of results to return
            
        Returns:
            List[Dict[str, Any]]: List of property records
        """
        try:
            self._connect_db()
            
            query = f"""
                SELECT * FROM narrpr_reports 
                WHERE price >= {min_price} AND price <= {max_price}
                ORDER BY created_at DESC 
                LIMIT {limit}
            """
            
            results = self.db.execute_query(query)
            logger.info(f"Retrieved {len(results)} properties in price range ${min_price} - ${max_price}")
            return results
            
        except Exception as e:
            logger.error(f"Error retrieving properties by price range: {str(e)}")
            return []
            
        finally:
            self._close_db()
    
    def retrieve_latest(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Retrieve the latest properties
        
        Args:
            limit (int): Maximum number of results to return
            
        Returns:
            List[Dict[str, Any]]: List of property records
        """
        try:
            self._connect_db()
            
            query = f"""
                SELECT * FROM narrpr_reports 
                ORDER BY created_at DESC 
                LIMIT {limit}
            """
            
            results = self.db.execute_query(query)
            logger.info(f"Retrieved {len(results)} latest properties")
            return results
            
        except Exception as e:
            logger.error(f"Error retrieving latest properties: {str(e)}")
            return []
            
        finally:
            self._close_db()
    
    def retrieve_with_filter(self, filters: Dict[str, Any], limit: int = 10) -> List[Dict[str, Any]]:
        """
        Retrieve properties with custom filters
        
        Args:
            filters (Dict[str, Any]): Dictionary of filters
                Keys are column names, values are the filter values
                Special keys: 'min_price', 'max_price', 'start_date', 'end_date'
            limit (int): Maximum number of results to return
            
        Returns:
            List[Dict[str, Any]]: List of property records
        """
        try:
            self._connect_db()
            
            # Start building the query
            query_parts = ["SELECT * FROM narrpr_reports"]
            where_clauses = []
            
            # Process filters
            for key, value in filters.items():
                if key == 'min_price':
                    where_clauses.append(f"price >= {float(value)}")
                elif key == 'max_price':
                    where_clauses.append(f"price <= {float(value)}")
                elif key == 'start_date':
                    where_clauses.append(f"date >= '{value}'")
                elif key == 'end_date':
                    where_clauses.append(f"date <= '{value}'")
                elif key == 'address' and value:
                    # For address, we use LIKE for partial matching
                    search_term = f"%{value.lower().strip()}%"
                    where_clauses.append(f"LOWER(address) LIKE '{search_term}'")
                elif value is not None:
                    # For other fields, we use exact matching
                    if isinstance(value, str):
                        where_clauses.append(f"{key} = '{value}'")
                    else:
                        where_clauses.append(f"{key} = {value}")
            
            # Combine WHERE clauses if any
            if where_clauses:
                query_parts.append("WHERE " + " AND ".join(where_clauses))
            
            # Add ordering and limit
            query_parts.append("ORDER BY created_at DESC")
            query_parts.append(f"LIMIT {limit}")
            
            # Execute the final query
            query = " ".join(query_parts)
            results = self.db.execute_query(query)
            
            logger.info(f"Retrieved {len(results)} properties with custom filters")
            return results
            
        except Exception as e:
            logger.error(f"Error retrieving properties with custom filters: {str(e)}")
            return []
            
        finally:
            self._close_db()
    
    def natural_language_search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Convert a natural language query to database filters
        
        Args:
            query (str): Natural language query like "find houses in Phoenix under $500,000"
            limit (int): Maximum number of results to return
            
        Returns:
            List[Dict[str, Any]]: List of property records
        """
        # Extract locations (city/state)
        locations = re.findall(r'in\s+([A-Za-z\s,]+)', query)
        location = locations[0].strip() if locations else None
        
        # Extract price constraints
        min_price_match = re.search(r'(?:above|over|more than)\s+\$?(\d[\d,]*)', query)
        min_price = float(min_price_match.group(1).replace(',', '')) if min_price_match else None
        
        max_price_match = re.search(r'(?:below|under|less than)\s+\$?(\d[\d,]*)', query)
        max_price = float(max_price_match.group(1).replace(',', '')) if max_price_match else None
        
        # Create filters
        filters = {}
        if location:
            filters['address'] = location
        if min_price:
            filters['min_price'] = min_price
        if max_price:
            filters['max_price'] = max_price
        
        # Default to latest if no filters found
        if not filters:
            logger.info(f"No specific filters found in query: '{query}', retrieving latest")
            return self.retrieve_latest(limit)
        
        # Retrieve with extracted filters
        return self.retrieve_with_filter(filters, limit)