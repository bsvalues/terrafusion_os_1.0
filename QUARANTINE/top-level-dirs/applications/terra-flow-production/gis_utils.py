import os
import json
import logging
from typing import Dict, Any, Optional
import tempfile
import zipfile
import shutil

logger = logging.getLogger(__name__)

try:
    import geopandas as gpd
    import shapely
    from shapely.geometry import shape
    HAS_GIS_LIBS = True
except ImportError:
    logger.warning("GIS libraries not available. Some functionality may be limited.")
    HAS_GIS_LIBS = False

def extract_gis_metadata(file_path: str, file_type: str) -> Optional[Dict[str, Any]]:
    """Extract metadata from GIS files based on file type"""
    metadata = {}
    
    try:
        if file_type in ['geojson', 'json']:
            return extract_geojson_metadata(file_path)
        elif file_type == 'shp':
            return extract_shapefile_metadata(file_path)
        elif file_type == 'dbf':
            return extract_dbf_metadata(file_path)
        elif file_type == 'xml':
            return extract_xml_metadata(file_path)
        elif file_type in ['zip'] and HAS_GIS_LIBS:
            # Check if zip contains shapefiles
            return extract_zipped_shapefile_metadata(file_path)
        elif file_type in ['kml', 'kmz'] and HAS_GIS_LIBS:
            return extract_kml_metadata(file_path)
        elif file_type in ['gpkg'] and HAS_GIS_LIBS:
            return extract_geopackage_metadata(file_path)
        elif file_type in ['gdb', 'mdb', 'sdf', 'sqlite', 'db', 'geopackage'] and HAS_GIS_LIBS:
            return extract_geodatabase_metadata(file_path, file_type)
    except Exception as e:
        logger.error(f"Error extracting metadata from {file_path}: {str(e)}")
    
    return None

def extract_geojson_metadata(file_path: str) -> Dict[str, Any]:
    """Extract metadata from GeoJSON file"""
    with open(file_path, 'r') as f:
        try:
            geojson = json.load(f)
            
            # Extract basic metadata
            metadata = {
                "type": "GeoJSON",
                "feature_count": len(geojson.get('features', [])),
                "geometry_types": set(),
                "properties": set(),
                "crs": geojson.get('crs', {}).get('properties', {}).get('name', 'Unknown')
            }
            
            # Extract geometry types and property fields
            for feature in geojson.get('features', []):
                if 'geometry' in feature and 'type' in feature['geometry']:
                    metadata['geometry_types'].add(feature['geometry']['type'])
                
                if 'properties' in feature:
                    for prop in feature['properties'].keys():
                        metadata['properties'].add(prop)
            
            # Convert sets to lists for JSON serialization
            metadata['geometry_types'] = list(metadata['geometry_types'])
            metadata['properties'] = list(metadata['properties'])
            
            # Calculate bounding box if using shapely
            if HAS_GIS_LIBS and len(geojson.get('features', [])) > 0:
                try:
                    # Create a list of shapely geometries
                    geometries = []
                    for feature in geojson['features']:
                        if feature.get('geometry'):
                            geom = shape(feature['geometry'])
                            geometries.append(geom)
                    
                    # Calculate union of all geometries and get bounding box
                    if geometries:
                        union = shapely.unary_union(geometries)
                        bounds = union.bounds
                        metadata['bounds'] = {
                            'minx': bounds[0],
                            'miny': bounds[1],
                            'maxx': bounds[2],
                            'maxy': bounds[3]
                        }
                except Exception as e:
                    logger.warning(f"Could not calculate bounds: {str(e)}")
            
            return metadata
        
        except json.JSONDecodeError:
            logger.error(f"Invalid GeoJSON file: {file_path}")
            return {"type": "GeoJSON", "error": "Invalid GeoJSON format"}

def extract_shapefile_metadata(file_path: str) -> Dict[str, Any]:
    """Extract metadata from Shapefile"""
    if not HAS_GIS_LIBS:
        return {"type": "Shapefile", "note": "GIS libraries not available for detailed metadata"}
    
    try:
        # Read shapefile with geopandas
        gdf = gpd.read_file(file_path)
        
        metadata = {
            "type": "Shapefile",
            "feature_count": len(gdf),
            "geometry_types": gdf.geom_type.unique().tolist(),
            "properties": gdf.columns.drop('geometry').tolist(),
            "crs": str(gdf.crs),
        }
        
        # Get bounding box
        bounds = gdf.total_bounds
        metadata['bounds'] = {
            'minx': bounds[0],
            'miny': bounds[1],
            'maxx': bounds[2],
            'maxy': bounds[3]
        }
        
        return metadata
    
    except Exception as e:
        logger.error(f"Error reading shapefile: {str(e)}")
        return {"type": "Shapefile", "error": str(e)}

def extract_zipped_shapefile_metadata(file_path: str) -> Dict[str, Any]:
    """Extract metadata from zipped shapefile"""
    if not HAS_GIS_LIBS:
        return {"type": "Zipped Shapefile", "note": "GIS libraries not available for detailed metadata"}
    
    # Create temporary directory to extract files
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Extract zip contents
        with zipfile.ZipFile(file_path, 'r') as zip_ref:
            zip_ref.extractall(temp_dir)
        
        # Find shapefile in the extracted directory
        shp_files = [f for f in os.listdir(temp_dir) if f.endswith('.shp')]
        
        if not shp_files:
            return {"type": "Zipped Archive", "contents": os.listdir(temp_dir)}
        
        # Get metadata from the first shapefile
        shapefile_path = os.path.join(temp_dir, shp_files[0])
        metadata = extract_shapefile_metadata(shapefile_path)
        metadata['type'] = "Zipped Shapefile"
        metadata['shapefile_name'] = shp_files[0]
        
        return metadata
    
    except Exception as e:
        logger.error(f"Error processing zipped shapefile: {str(e)}")
        return {"type": "Zipped Archive", "error": str(e)}
    
    finally:
        # Clean up temp directory
        shutil.rmtree(temp_dir)

def extract_kml_metadata(file_path: str) -> Dict[str, Any]:
    """Extract metadata from KML/KMZ file"""
    if not HAS_GIS_LIBS:
        return {"type": "KML/KMZ", "note": "GIS libraries not available for detailed metadata"}
    
    try:
        # For KMZ files, extract to temp directory first
        temp_dir = None
        kml_path = file_path
        
        if file_path.lower().endswith('.kmz'):
            temp_dir = tempfile.mkdtemp()
            with zipfile.ZipFile(file_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
            # Find main KML file
            kml_files = [f for f in os.listdir(temp_dir) if f.lower().endswith('.kml')]
            if kml_files:
                kml_path = os.path.join(temp_dir, kml_files[0])
        
        # Read KML with geopandas
        gdf = gpd.read_file(kml_path, driver='KML')
        
        metadata = {
            "type": "KML" if file_path.lower().endswith('.kml') else "KMZ",
            "feature_count": len(gdf),
            "geometry_types": gdf.geom_type.unique().tolist(),
            "properties": gdf.columns.drop('geometry').tolist()
        }
        
        # Get bounding box if there are features
        if len(gdf) > 0:
            bounds = gdf.total_bounds
            metadata['bounds'] = {
                'minx': bounds[0],
                'miny': bounds[1],
                'maxx': bounds[2],
                'maxy': bounds[3]
            }
        
        return metadata
    
    except Exception as e:
        logger.error(f"Error reading KML/KMZ file: {str(e)}")
        return {"type": "KML/KMZ", "error": str(e)}
    
    finally:
        # Clean up temp directory if created
        if temp_dir:
            shutil.rmtree(temp_dir)

def extract_geopackage_metadata(file_path: str) -> Dict[str, Any]:
    """Extract metadata from GeoPackage"""
    if not HAS_GIS_LIBS:
        return {"type": "GeoPackage", "note": "GIS libraries not available for detailed metadata"}
    
    try:
        # List all layers in the GeoPackage
        available_layers = fiona.listlayers(file_path)
        
        metadata = {
            "type": "GeoPackage",
            "layers": available_layers,
            "layer_details": []
        }
        
        # Extract information for each layer
        for layer in available_layers:
            gdf = gpd.read_file(file_path, layer=layer)
            
            layer_info = {
                "name": layer,
                "feature_count": len(gdf),
                "geometry_types": gdf.geom_type.unique().tolist(),
                "properties": gdf.columns.drop('geometry').tolist(),
                "crs": str(gdf.crs)
            }
            
            # Get bounding box
            if len(gdf) > 0:
                bounds = gdf.total_bounds
                layer_info['bounds'] = {
                    'minx': bounds[0],
                    'miny': bounds[1],
                    'maxx': bounds[2],
                    'maxy': bounds[3]
                }
            
            metadata['layer_details'].append(layer_info)
        
        return metadata
    
    except Exception as e:
        logger.error(f"Error reading GeoPackage: {str(e)}")
        return {"type": "GeoPackage", "error": str(e)}

def validate_geojson(file_path: str) -> bool:
    """Validate a GeoJSON file"""
    try:
        with open(file_path, 'r') as f:
            geojson = json.load(f)
            
        # Check required GeoJSON structure
        if 'type' not in geojson:
            return False
        
        if geojson['type'] == 'FeatureCollection' and 'features' not in geojson:
            return False
        
        return True
    except:
        return False

def extract_dbf_metadata(file_path: str) -> Dict[str, Any]:
    """Extract metadata from DBF file"""
    if not HAS_GIS_LIBS:
        return {"type": "DBF", "note": "GIS libraries not available for detailed metadata"}
    
    try:
        # Use geopandas to read the DBF file
        import pandas as pd
        from simpledbf import Dbf5
        
        try:
            # Try using simpledbf if available
            dbf = Dbf5(file_path)
            df = dbf.to_dataframe()
        except (ImportError, Exception) as e:
            # Fall back to geopandas if simpledbf is not available or fails
            # Geopandas can read DBF files as it uses fiona underneath
            df = gpd.read_file(file_path, driver='ESRI Shapefile')
        
        # Extract basic metadata
        metadata = {
            "type": "DBF",
            "record_count": len(df),
            "field_count": len(df.columns),
            "field_names": df.columns.tolist(),
            "field_types": {col: str(df[col].dtype) for col in df.columns}
        }
        
        # Sample data (first few rows, limited fields)
        if len(df) > 0:
            sample_data = df.head(5).to_dict(orient='records')
            if sample_data:
                metadata["sample_data"] = sample_data
        
        return metadata
    
    except Exception as e:
        logger.error(f"Error extracting DBF metadata: {str(e)}")
        return {"type": "DBF", "error": str(e)}

def extract_xml_metadata(file_path: str) -> Dict[str, Any]:
    """Extract metadata from XML file"""
    try:
        import xml.etree.ElementTree as ET
        
        # Parse the XML file
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        # Get namespace info
        namespaces = {}
        if root.tag.startswith('{'):
            ns_uri = root.tag[1:].split('}')[0]
            namespaces['default'] = ns_uri
        
        # Extract basic metadata
        metadata = {
            "type": "XML",
            "root_tag": root.tag,
            "namespaces": namespaces,
            "element_count": sum(1 for _ in tree.iter())
        }
        
        # Get child elements of root (first level structure)
        first_level = []
        for child in root:
            first_level.append(child.tag)
        
        metadata["first_level_elements"] = first_level
        
        # Look for GIS specific elements - common GIS XML formats
        gis_indicators = {
            "is_gml": any("gml" in str(elem.tag).lower() for elem in tree.iter()),
            "is_kml": any("kml" in str(elem.tag).lower() for elem in tree.iter()),
            "has_coordinates": any("coord" in str(elem.tag).lower() for elem in tree.iter()),
            "has_geometry": any("geom" in str(elem.tag).lower() for elem in tree.iter()),
            "has_feature": any("feature" in str(elem.tag).lower() for elem in tree.iter())
        }
        
        metadata["gis_indicators"] = gis_indicators
        
        # Try to determine if this is a GIS XML file
        metadata["is_likely_gis_xml"] = any(gis_indicators.values())
        
        # File size
        metadata["file_size_bytes"] = os.path.getsize(file_path)
        
        return metadata
    
    except Exception as e:
        logger.error(f"Error extracting XML metadata: {str(e)}")
        return {"type": "XML", "error": str(e)}

def get_shapefile_info(file_path: str) -> Dict[str, Any]:
    """Get information about a shapefile"""
    if not HAS_GIS_LIBS:
        return {"error": "GIS libraries not available"}
    
    try:
        gdf = gpd.read_file(file_path)
        
        return {
            "feature_count": len(gdf),
            "columns": gdf.columns.drop('geometry').tolist(),
            "geometry_type": gdf.geom_type.iloc[0] if len(gdf) > 0 else None,
            "crs": str(gdf.crs),
            "has_data": len(gdf) > 0
        }
    except Exception as e:
        return {"error": str(e)}

def extract_geodatabase_metadata(file_path: str, file_type: str) -> Dict[str, Any]:
    """Extract metadata from various geodatabase formats (File Geodatabase, SDF, etc.)"""
    if not HAS_GIS_LIBS:
        return {"type": f"{file_type.upper()} Geodatabase", "note": "GIS libraries not available for detailed metadata"}
    
    try:
        # Map file types to their proper names for display
        geodatabase_types = {
            'gdb': 'ESRI File Geodatabase',
            'mdb': 'ESRI Personal Geodatabase',
            'sdf': 'ESRI Spatial Data File',
            'sqlite': 'SQLite Spatial Database',
            'db': 'Database File',
            'geopackage': 'OGC GeoPackage'
        }
        
        db_type = geodatabase_types.get(file_type, f"{file_type.upper()} Database")
        
        metadata = {
            "type": db_type,
            "file_path": file_path,
            "file_size_bytes": os.path.getsize(file_path)
        }
        
        try:
            # Try to list layers with fiona
            driver_mapping = {
                'gdb': 'FileGDB',
                'sqlite': 'SQLite',
                'geopackage': 'GPKG',
                'db': 'SQLite'
            }
            
            driver = driver_mapping.get(file_type)
            
            if driver:
                try:
                    layers = fiona.listlayers(file_path, driver=driver)
                    metadata["layers"] = layers
                    metadata["layer_count"] = len(layers)
                except Exception as e:
                    logger.warning(f"Could not list layers with fiona: {str(e)}")
            
            # Try with geopandas for more detailed information if layers were found
            if "layers" in metadata and metadata["layers"]:
                layer_details = []
                
                for layer_name in metadata["layers"]:
                    try:
                        # Try to read the layer with geopandas
                        layer_driver = driver_mapping.get(file_type)
                        if layer_driver:
                            gdf = gpd.read_file(file_path, layer=layer_name, driver=layer_driver)
                        else:
                            gdf = gpd.read_file(file_path, layer=layer_name)
                            
                        layer_info = {
                            "name": layer_name,
                            "feature_count": len(gdf),
                            "columns": gdf.columns.tolist(),
                            "crs": str(gdf.crs)
                        }
                        
                        # Add geometry types if present
                        if 'geometry' in gdf.columns:
                            layer_info["geometry_types"] = gdf.geom_type.unique().tolist()
                            
                            # Calculate bounding box if there are geometries
                            try:
                                bounds = gdf.total_bounds
                                layer_info['bounds'] = {
                                    'minx': bounds[0],
                                    'miny': bounds[1],
                                    'maxx': bounds[2],
                                    'maxy': bounds[3]
                                }
                            except Exception as e:
                                logger.warning(f"Could not calculate bounds for layer {layer_name}: {str(e)}")
                        
                        layer_details.append(layer_info)
                    except Exception as e:
                        layer_details.append({"name": layer_name, "error": str(e)})
                        
                metadata["layer_details"] = layer_details
        
        except Exception as e:
            metadata["layer_error"] = str(e)
        
        # For SQLite/SDF/DB files, try to get table information using SQLAlchemy
        if file_type in ['sqlite', 'db', 'sdf']:
            try:
                import sqlite3
                conn = sqlite3.connect(file_path)
                cursor = conn.cursor()
                
                # Get list of tables
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                tables = [table[0] for table in cursor.fetchall()]
                
                metadata["tables"] = tables
                
                # Get schema for each table
                table_schemas = {}
                for table in tables:
                    cursor.execute(f"PRAGMA table_info({table});")
                    columns = cursor.fetchall()
                    table_schemas[table] = [
                        {"name": col[1], "type": col[2], "notnull": col[3], "pk": col[5]} 
                        for col in columns
                    ]
                
                metadata["table_schemas"] = table_schemas
                conn.close()
            except Exception as e:
                metadata["sqlite_error"] = str(e)
        
        return metadata
        
    except Exception as e:
        logger.error(f"Error extracting geodatabase metadata: {str(e)}")
        return {
            "type": f"{file_type.upper()} Geodatabase", 
            "error": str(e),
            "file_size_bytes": os.path.getsize(file_path) if os.path.exists(file_path) else 0
        }
