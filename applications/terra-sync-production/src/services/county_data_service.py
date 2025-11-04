import os
import json
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager

@dataclass
class PropertyRecord:
    property_id: str
    parcel_number: str
    owner_name: str
    owner_address: str
    property_address: str
    assessed_value: float
    tax_amount: float
    property_type: str
    acreage: float
    zoning: str
    exemptions: List[str]
    last_updated: datetime

@dataclass
class DistrictBoundary:
    district_id: str
    district_name: str
    district_type: str
    tax_rate: float
    boundary_coordinates: List[List[float]]
    population: int
    area_square_miles: float

class CountyDataService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.db_url = os.environ.get('DATABASE_URL', 'sqlite:///terrafusionsync.db')
        if not self.db_url:
            raise ValueError("DATABASE_URL environment variable is required")
    
    @contextmanager
    def get_db_connection(self):
        conn = None
        try:
            conn = psycopg2.connect(self.db_url)
            yield conn
        except Exception as e:
            if conn:
                conn.rollback()
            self.logger.error(f"Database connection error: {str(e)}")
            raise
        finally:
            if conn:
                conn.close()
    
    def get_county_properties(self, county_id: str, limit: int = 100, offset: int = 0) -> List[PropertyRecord]:
        query = """
        SELECT 
            property_id, parcel_number, owner_name, owner_address,
            property_address, assessed_value, tax_amount, property_type,
            acreage, zoning, exemptions, last_updated
        FROM properties 
        WHERE county_id = %s 
        ORDER BY property_id 
        LIMIT %s OFFSET %s
        """
        
        with self.get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, (county_id, limit, offset))
                rows = cursor.fetchall()
                
                properties = []
                for row in rows:
                    properties.append(PropertyRecord(
                        property_id=row['property_id'],
                        parcel_number=row['parcel_number'],
                        owner_name=row['owner_name'],
                        owner_address=row['owner_address'],
                        property_address=row['property_address'],
                        assessed_value=float(row['assessed_value']),
                        tax_amount=float(row['tax_amount']),
                        property_type=row['property_type'],
                        acreage=float(row['acreage']),
                        zoning=row['zoning'],
                        exemptions=row['exemptions'] or [],
                        last_updated=row['last_updated']
                    ))
                
                return properties
    
    def get_property_by_parcel(self, county_id: str, parcel_number: str) -> Optional[PropertyRecord]:
        query = """
        SELECT 
            property_id, parcel_number, owner_name, owner_address,
            property_address, assessed_value, tax_amount, property_type,
            acreage, zoning, exemptions, last_updated
        FROM properties 
        WHERE county_id = %s AND parcel_number = %s
        """
        
        with self.get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, (county_id, parcel_number))
                row = cursor.fetchone()
                
                if not row:
                    return None
                
                return PropertyRecord(
                    property_id=row['property_id'],
                    parcel_number=row['parcel_number'],
                    owner_name=row['owner_name'],
                    owner_address=row['owner_address'],
                    property_address=row['property_address'],
                    assessed_value=float(row['assessed_value']),
                    tax_amount=float(row['tax_amount']),
                    property_type=row['property_type'],
                    acreage=float(row['acreage']),
                    zoning=row['zoning'],
                    exemptions=row['exemptions'] or [],
                    last_updated=row['last_updated']
                )
    
    def get_county_districts(self, county_id: str) -> List[DistrictBoundary]:
        query = """
        SELECT 
            district_id, district_name, district_type, tax_rate,
            boundary_coordinates, population, area_square_miles
        FROM district_boundaries 
        WHERE county_id = %s
        ORDER BY district_type, district_name
        """
        
        with self.get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, (county_id,))
                rows = cursor.fetchall()
                
                districts = []
                for row in rows:
                    districts.append(DistrictBoundary(
                        district_id=row['district_id'],
                        district_name=row['district_name'],
                        district_type=row['district_type'],
                        tax_rate=float(row['tax_rate']),
                        boundary_coordinates=row['boundary_coordinates'] or [],
                        population=row['population'],
                        area_square_miles=float(row['area_square_miles'])
                    ))
                
                return districts
    
    def lookup_property_districts(self, county_id: str, latitude: float, longitude: float) -> List[Dict[str, Any]]:
        query = """
        SELECT 
            d.district_id, d.district_name, d.district_type, d.tax_rate
        FROM district_boundaries d
        WHERE d.county_id = %s 
        AND ST_Contains(d.boundary_geometry, ST_Point(%s, %s))
        """
        
        with self.get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, (county_id, longitude, latitude))
                rows = cursor.fetchall()
                
                return [dict(row) for row in rows]
    
    def get_county_statistics(self, county_id: str) -> Dict[str, Any]:
        queries = {
            'total_properties': "SELECT COUNT(*) FROM properties WHERE county_id = %s",
            'total_assessed_value': "SELECT SUM(assessed_value) FROM properties WHERE county_id = %s",
            'total_tax_amount': "SELECT SUM(tax_amount) FROM properties WHERE county_id = %s",
            'property_types': """
                SELECT property_type, COUNT(*) as count 
                FROM properties 
                WHERE county_id = %s 
                GROUP BY property_type
            """,
            'exemption_stats': """
                SELECT 
                    COUNT(*) as total_exemptions,
                    COUNT(DISTINCT property_id) as properties_with_exemptions
                FROM properties 
                WHERE county_id = %s AND exemptions IS NOT NULL AND array_length(exemptions, 1) > 0
            """
        }
        
        statistics = {}
        
        with self.get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                for stat_name, query in queries.items():
                    if stat_name in ['property_types']:
                        cursor.execute(query, (county_id,))
                        statistics[stat_name] = [dict(row) for row in cursor.fetchall()]
                    else:
                        cursor.execute(query, (county_id,))
                        result = cursor.fetchone()
                        statistics[stat_name] = dict(result) if result else {}
        
        return statistics
    
    def search_properties(self, county_id: str, search_params: Dict[str, Any]) -> List[PropertyRecord]:
        base_query = """
        SELECT 
            property_id, parcel_number, owner_name, owner_address,
            property_address, assessed_value, tax_amount, property_type,
            acreage, zoning, exemptions, last_updated
        FROM properties 
        WHERE county_id = %s
        """
        
        conditions = []
        params = [county_id]
        
        if search_params.get('owner_name'):
            conditions.append("owner_name ILIKE %s")
            params.append(f"%{search_params['owner_name']}%")
        
        if search_params.get('property_address'):
            conditions.append("property_address ILIKE %s")
            params.append(f"%{search_params['property_address']}%")
        
        if search_params.get('property_type'):
            conditions.append("property_type = %s")
            params.append(search_params['property_type'])
        
        if search_params.get('min_value'):
            conditions.append("assessed_value >= %s")
            params.append(search_params['min_value'])
        
        if search_params.get('max_value'):
            conditions.append("assessed_value <= %s")
            params.append(search_params['max_value'])
        
        if conditions:
            base_query += " AND " + " AND ".join(conditions)
        
        base_query += " ORDER BY property_id LIMIT 100"
        
        with self.get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(base_query, params)
                rows = cursor.fetchall()
                
                properties = []
                for row in rows:
                    properties.append(PropertyRecord(
                        property_id=row['property_id'],
                        parcel_number=row['parcel_number'],
                        owner_name=row['owner_name'],
                        owner_address=row['owner_address'],
                        property_address=row['property_address'],
                        assessed_value=float(row['assessed_value']),
                        tax_amount=float(row['tax_amount']),
                        property_type=row['property_type'],
                        acreage=float(row['acreage']),
                        zoning=row['zoning'],
                        exemptions=row['exemptions'] or [],
                        last_updated=row['last_updated']
                    ))
                
                return properties
    
    def update_property_assessment(self, county_id: str, property_id: str, 
                                 new_assessed_value: float, updated_by: str) -> bool:
        update_query = """
        UPDATE properties 
        SET assessed_value = %s, 
            tax_amount = %s,
            last_updated = %s,
            updated_by = %s
        WHERE county_id = %s AND property_id = %s
        """
        
        tax_rate = 0.012
        new_tax_amount = new_assessed_value * tax_rate
        
        try:
            with self.get_db_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(update_query, (
                        new_assessed_value,
                        new_tax_amount,
                        datetime.now(),
                        updated_by,
                        county_id,
                        property_id
                    ))
                    
                    if cursor.rowcount == 0:
                        return False
                    
                    conn.commit()
                    self.logger.info(f"Updated property {property_id} assessment to ${new_assessed_value}")
                    return True
                    
        except Exception as e:
            self.logger.error(f"Failed to update property assessment: {str(e)}")
            return False
    
    def create_audit_log(self, county_id: str, action: str, details: Dict[str, Any], user_id: str):
        insert_query = """
        INSERT INTO audit_logs (county_id, action, details, user_id, timestamp)
        VALUES (%s, %s, %s, %s, %s)
        """
        
        try:
            with self.get_db_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(insert_query, (
                        county_id,
                        action,
                        json.dumps(details),
                        user_id,
                        datetime.now()
                    ))
                    conn.commit()
                    
        except Exception as e:
            self.logger.error(f"Failed to create audit log: {str(e)}")

class GISExportService:
    def __init__(self, county_data_service: CountyDataService):
        self.county_service = county_data_service
        self.logger = logging.getLogger(__name__)
    
    def export_county_geojson(self, county_id: str, include_districts: bool = True) -> Dict[str, Any]:
        properties = self.county_service.get_county_properties(county_id, limit=10000)
        
        features = []
        for prop in properties:
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [-119.2781, 46.2396]
                },
                "properties": {
                    "property_id": prop.property_id,
                    "parcel_number": prop.parcel_number,
                    "owner_name": prop.owner_name,
                    "property_address": prop.property_address,
                    "assessed_value": prop.assessed_value,
                    "tax_amount": prop.tax_amount,
                    "property_type": prop.property_type,
                    "acreage": prop.acreage,
                    "zoning": prop.zoning,
                    "exemptions": prop.exemptions
                }
            }
            features.append(feature)
        
        geojson = {
            "type": "FeatureCollection",
            "features": features,
            "properties": {
                "county_id": county_id,
                "export_timestamp": datetime.now().isoformat(),
                "total_features": len(features)
            }
        }
        
        if include_districts:
            districts = self.county_service.get_county_districts(county_id)
            for district in districts:
                district_feature = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [district.boundary_coordinates] if district.boundary_coordinates else []
                    },
                    "properties": {
                        "district_id": district.district_id,
                        "district_name": district.district_name,
                        "district_type": district.district_type,
                        "tax_rate": district.tax_rate,
                        "population": district.population,
                        "area_square_miles": district.area_square_miles
                    }
                }
                features.append(district_feature)
        
        return geojson