"""
Benton District Lookup Service

A geospatial lookup backend for determining district assignments based on location data.
Integrates with the existing TerraFusion Platform county configuration system.
"""

import json
import logging
from typing import Dict, List, Optional, Tuple
from pathlib import Path

try:
    from shapely.geometry import Point, shape, Polygon
    GEOSPATIAL_AVAILABLE = True
except ImportError:
    # Fallback for environments without geospatial libraries
    GEOSPATIAL_AVAILABLE = False
    class Point:
        def __init__(self, x, y): 
            self.x, self.y = x, y
        def within(self, geom): 
            return True  # Simple fallback
    
    class Polygon:
        def __init__(self, coords):
            self.coords = coords
        def contains(self, point):
            return True  # Simple fallback
        def bounds(self):
            return [-120, 46, -119, 47]  # Benton County approximate bounds

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BentonDistrictLookup:
    """
    District lookup service for Benton County, WA.
    
    Provides programmatic access to determine which administrative or electoral 
    district a given address or coordinate belongs to.
    """
    
    def __init__(self, config_path: str = "county_configs/benton_wa/benton_wa_config.json"):
        """
        Initialize the district lookup service.
        
        Args:
            config_path: Path to the Benton County configuration file
        """
        self.config_path = config_path
        self.config = self._load_county_config()
        self.districts = {}
        self._load_district_boundaries()
    
    def _load_county_config(self) -> Dict:
        """Load the Benton County configuration."""
        try:
            with open(self.config_path, 'r') as f:
                config = json.load(f)
            logger.info(f"Loaded county config for {config.get('county_friendly_name', 'Unknown')}")
            return config
        except FileNotFoundError:
            logger.error(f"County config file not found: {self.config_path}")
            return {}
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON in county config: {self.config_path}")
            return {}
    
    def _load_district_boundaries(self):
        """Load district boundary data."""
        # Check for existing district boundary files
        district_data_dir = Path("county_configs/benton_wa/districts")
        
        if district_data_dir.exists():
            self._load_from_files(district_data_dir)
        else:
            self._create_sample_districts()
    
    def _load_from_files(self, data_dir: Path):
        """Load district boundaries from GeoJSON files."""
        geojson_files = list(data_dir.glob("*.geojson"))
        
        for geojson_file in geojson_files:
            try:
                with open(geojson_file, 'r') as f:
                    geojson_data = json.load(f)
                
                district_type = geojson_file.stem
                self.districts[district_type] = []
                
                for feature in geojson_data.get('features', []):
                    district_info = {
                        'name': feature['properties'].get('name', 'Unknown'),
                        'id': feature['properties'].get('id', 'unknown'),
                        'geometry': shape(feature['geometry']),
                        'properties': feature['properties']
                    }
                    self.districts[district_type].append(district_info)
                
                logger.info(f"Loaded {len(self.districts[district_type])} {district_type} districts")
                
            except Exception as e:
                logger.error(f"Error loading {geojson_file}: {e}")
    
    def _create_sample_districts(self):
        """Create sample district boundaries for demonstration."""
        # Using the map extent from county config for realistic boundaries
        map_extent = self.config.get('ui_settings', {}).get('default_map_extent', {})
        min_lat = map_extent.get('min_lat', 46.0)
        max_lat = map_extent.get('max_lat', 46.5)
        min_lon = map_extent.get('min_lon', -120.0)
        max_lon = map_extent.get('max_lon', -119.0)
        
        # Create sample voting precincts
        voting_precincts = []
        lat_step = (max_lat - min_lat) / 4
        lon_step = (max_lon - min_lon) / 3
        
        precinct_id = 1
        for i in range(4):
            for j in range(3):
                # Create rectangular precinct boundaries
                bounds = [
                    [min_lon + j * lon_step, min_lat + i * lat_step],
                    [min_lon + (j + 1) * lon_step, min_lat + i * lat_step],
                    [min_lon + (j + 1) * lon_step, min_lat + (i + 1) * lat_step],
                    [min_lon + j * lon_step, min_lat + (i + 1) * lat_step],
                    [min_lon + j * lon_step, min_lat + i * lat_step]
                ]
                
                from shapely.geometry import Polygon
                geometry = Polygon(bounds)
                
                voting_precincts.append({
                    'name': f"Precinct {precinct_id:02d}",
                    'id': f"precinct_{precinct_id:02d}",
                    'geometry': geometry,
                    'properties': {
                        'precinct_number': f"{precinct_id:02d}",
                        'polling_location': f"Benton Community Center {precinct_id}",
                        'type': 'voting_precinct'
                    }
                })
                precinct_id += 1
        
        self.districts['voting_precincts'] = voting_precincts
        
        # Create sample fire districts
        fire_districts = [
            {
                'name': 'Benton Fire District 1',
                'id': 'fire_district_1',
                'geometry': Polygon([
                    [min_lon, min_lat], [min_lon + lon_step * 1.5, min_lat],
                    [min_lon + lon_step * 1.5, max_lat], [min_lon, max_lat], [min_lon, min_lat]
                ]),
                'properties': {
                    'station_number': '1',
                    'response_time_target': '8_minutes',
                    'type': 'fire_district'
                }
            },
            {
                'name': 'Benton Fire District 2',
                'id': 'fire_district_2',
                'geometry': Polygon([
                    [min_lon + lon_step * 1.5, min_lat], [max_lon, min_lat],
                    [max_lon, max_lat], [min_lon + lon_step * 1.5, max_lat],
                    [min_lon + lon_step * 1.5, min_lat]
                ]),
                'properties': {
                    'station_number': '2',
                    'response_time_target': '6_minutes',
                    'type': 'fire_district'
                }
            }
        ]
        
        self.districts['fire_districts'] = fire_districts
        
        # Create sample school districts
        school_districts = [
            {
                'name': 'Kennewick School District',
                'id': 'kennewick_sd',
                'geometry': Polygon([
                    [min_lon, min_lat], [min_lon + lon_step * 2, min_lat],
                    [min_lon + lon_step * 2, min_lat + lat_step * 2], 
                    [min_lon, min_lat + lat_step * 2], [min_lon, min_lat]
                ]),
                'properties': {
                    'district_code': 'KSD_17',
                    'superintendent': 'Dr. Smith',
                    'type': 'school_district'
                }
            },
            {
                'name': 'Richland School District',
                'id': 'richland_sd',
                'geometry': Polygon([
                    [min_lon + lon_step * 2, min_lat], [max_lon, min_lat],
                    [max_lon, max_lat], [min_lon + lon_step * 2, max_lat],
                    [min_lon + lon_step * 2, min_lat]
                ]),
                'properties': {
                    'district_code': 'RSD_400',
                    'superintendent': 'Dr. Johnson',
                    'type': 'school_district'
                }
            }
        ]
        
        self.districts['school_districts'] = school_districts
        
        logger.info(f"Created sample districts: {len(voting_precincts)} precincts, "
                   f"{len(fire_districts)} fire districts, {len(school_districts)} school districts")
    
    def lookup_by_coordinates(self, latitude: float, longitude: float) -> Dict:
        """
        Lookup districts by latitude and longitude coordinates.
        
        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            
        Returns:
            Dictionary containing district assignments
        """
        point = Point(longitude, latitude)
        results = {
            'coordinates': {'latitude': latitude, 'longitude': longitude},
            'districts': {},
            'found_any': False
        }
        
        for district_type, districts in self.districts.items():
            for district in districts:
                if district['geometry'].contains(point):
                    results['districts'][district_type] = {
                        'name': district['name'],
                        'id': district['id'],
                        'properties': district['properties']
                    }
                    results['found_any'] = True
                    break
            
            # If no district found for this type, mark as unknown
            if district_type not in results['districts']:
                results['districts'][district_type] = {
                    'name': 'Outside county boundaries',
                    'id': 'unknown',
                    'properties': {'type': district_type}
                }
        
        return results
    
    def lookup_by_address(self, address: str) -> Dict:
        """
        Lookup districts by street address (requires geocoding).
        
        Args:
            address: Street address to lookup
            
        Returns:
            Dictionary containing district assignments
        """
        # For demo purposes, we'll use a simple geocoding approach
        # In production, you'd want to integrate with a proper geocoding service
        try:
            coordinates = self._geocode_address(address)
            if coordinates:
                lat, lon = coordinates
                result = self.lookup_by_coordinates(lat, lon)
                result['address'] = address
                return result
            else:
                return {
                    'address': address,
                    'error': 'Could not geocode address',
                    'districts': {},
                    'found_any': False
                }
        except Exception as e:
            logger.error(f"Error geocoding address {address}: {e}")
            return {
                'address': address,
                'error': str(e),
                'districts': {},
                'found_any': False
            }
    
    def _geocode_address(self, address: str) -> Optional[Tuple[float, float]]:
        """
        Simple geocoding function. In production, integrate with a proper service.
        
        Args:
            address: Address to geocode
            
        Returns:
            Tuple of (latitude, longitude) or None if not found
        """
        # For demo purposes, return coordinates within Benton County for any address
        # containing "Benton" or common city names
        address_lower = address.lower()
        
        if any(city in address_lower for city in ['kennewick', 'richland', 'pasco', 'benton']):
            # Return a point within our sample area
            map_extent = self.config.get('ui_settings', {}).get('default_map_extent', {})
            lat = (map_extent.get('min_lat', 46.0) + map_extent.get('max_lat', 46.5)) / 2
            lon = (map_extent.get('min_lon', -120.0) + map_extent.get('max_lon', -119.0)) / 2
            
            # Add some randomness to simulate different addresses
            import random
            lat += random.uniform(-0.1, 0.1)
            lon += random.uniform(-0.2, 0.2)
            
            return (lat, lon)
        
        return None
    
    def list_districts(self, district_type: Optional[str] = None) -> Dict:
        """
        List available districts.
        
        Args:
            district_type: Optional filter by district type
            
        Returns:
            Dictionary of available districts
        """
        if district_type and district_type in self.districts:
            return {district_type: [
                {
                    'name': d['name'],
                    'id': d['id'],
                    'properties': d['properties']
                } for d in self.districts[district_type]
            ]}
        else:
            return {
                dtype: [
                    {
                        'name': d['name'],
                        'id': d['id'],
                        'properties': d['properties']
                    } for d in districts
                ] for dtype, districts in self.districts.items()
            }
    
    def get_district_info(self, district_type: str, district_id: str) -> Optional[Dict]:
        """
        Get detailed information about a specific district.
        
        Args:
            district_type: Type of district
            district_id: District identifier
            
        Returns:
            District information or None if not found
        """
        if district_type not in self.districts:
            return None
        
        for district in self.districts[district_type]:
            if district['id'] == district_id:
                return {
                    'name': district['name'],
                    'id': district['id'],
                    'type': district_type,
                    'properties': district['properties'],
                    'bounds': list(district['geometry'].bounds)  # [minx, miny, maxx, maxy]
                }
        
        return None


# CLI interface for the district lookup service
def main():
    """Main CLI interface for the Benton District Lookup service."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Benton County District Lookup Service')
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Lookup by coordinates
    coord_parser = subparsers.add_parser('lookup-coord', help='Lookup by coordinates')
    coord_parser.add_argument('--lat', type=float, required=True, help='Latitude')
    coord_parser.add_argument('--lon', type=float, required=True, help='Longitude')
    
    # Lookup by address
    addr_parser = subparsers.add_parser('lookup-addr', help='Lookup by address')
    addr_parser.add_argument('--address', required=True, help='Street address')
    
    # List districts
    list_parser = subparsers.add_parser('list', help='List available districts')
    list_parser.add_argument('--type', help='Filter by district type')
    
    # Get district info
    info_parser = subparsers.add_parser('info', help='Get district information')
    info_parser.add_argument('--type', required=True, help='District type')
    info_parser.add_argument('--id', required=True, help='District ID')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # Initialize the lookup service
    lookup = BentonDistrictLookup()
    
    if args.command == 'lookup-coord':
        result = lookup.lookup_by_coordinates(args.lat, args.lon)
    
    elif args.command == 'lookup-addr':
        result = lookup.lookup_by_address(args.address)
    
    elif args.command == 'list':
        result = lookup.list_districts(args.type)
    
    elif args.command == 'info':
        result = lookup.get_district_info(args.type, args.id)
        if result:
            print(json.dumps(result, indent=2))
        else:
            print(f"District not found: {args.type}/{args.id}")


if __name__ == '__main__':
    main()