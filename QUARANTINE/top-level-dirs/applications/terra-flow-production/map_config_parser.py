"""
Map Configuration Parser

This module handles parsing of XML configuration files for map settings,
data connections, and saved layouts.
"""
import os
import json
import xml.etree.ElementTree as ET
from typing import Dict, List, Any, Optional


def parse_esri_map_settings(xml_string: str) -> Dict[str, Any]:
    """
    Parse ESRI Map Module Settings XML.
    
    Args:
        xml_string: The XML string containing ESRI map settings
        
    Returns:
        Dictionary containing parsed map settings
    """
    try:
        # Parse XML
        root = ET.fromstring(xml_string)
        
        # Initialize settings dictionary
        settings = {
            "base_map": {},
            "base_layers": [],
            "viewable_layers": [],
            "custom_query_layers": [],
            "map_extent": {},
            "selection_style": {},
            "general": {}
        }
        
        # Parse base map settings
        base_map = root.find("BaseMap")
        if base_map is not None:
            settings["base_map"] = {
                "enable_selection": base_map.findtext("EnableSelection") == "true",
                "order": int(base_map.findtext("Order") or "0"),
                "visible": base_map.findtext("Visible") == "true",
                "type": base_map.findtext("Type") or ""
            }
        
        # Parse base layers
        for layer in root.findall("./BaseLayers/BaseLayerModel"):
            layer_data = {
                "name": layer.findtext("n") or "",
                "enable_selection": layer.findtext("EnableSelection") == "true",
                "order": int(layer.findtext("Order") or "0"),
                "visible": layer.findtext("Visible") == "true",
                "url": layer.findtext("URL") or "",
                "type": layer.findtext("Type") or "",
                "spatial_reference_id": int(layer.findtext("SpatialReferenceID") or "0")
            }
            settings["base_layers"].append(layer_data)
        
        # Parse viewable layers
        for layer in root.findall("./ViewableLayers/CciLayerModel"):
            layer_data = {
                "name": layer.findtext("n") or "",
                "enable_selection": layer.findtext("EnableSelection") == "true",
                "selection_layer_id": int(layer.findtext("SelectionLayerID") or "0"),
                "order": int(layer.findtext("Order") or "0"),
                "visible": layer.findtext("Visible") == "true",
                "url": layer.findtext("URL") or "",
                "type": layer.findtext("Type") or ""
            }
            settings["viewable_layers"].append(layer_data)
        
        # Parse map extent
        extent = root.find("MapExtent")
        if extent is not None:
            settings["map_extent"] = {
                "spatial_reference_wkid": int(extent.findtext("SpatialReferenceWKID") or "0"),
                "x_min": float(extent.findtext("XMin") or "0"),
                "y_min": float(extent.findtext("YMin") or "0"),
                "x_max": float(extent.findtext("XMax") or "0"),
                "y_max": float(extent.findtext("YMax") or "0")
            }
        
        # Parse selection and styling settings
        settings["selection_style"] = {
            "fill_opacity": float(root.findtext("SelectionFillOpacity") or "0.15"),
            "border_thickness": int(root.findtext("SelectedBorderThickness") or "1"),
            "border_color": root.findtext("SelectionBorderColor") or "0,255,255",
            "highlighted_border_color": root.findtext("HighlightedBorderColor") or "0,0,255",
            "highlighted_border_thickness": int(root.findtext("HighlightedBorderThickness") or "3"),
            "filtered_fill_opacity": float(root.findtext("FilteredFillOpacity") or "0.25"),
            "filtered_fill_color": root.findtext("FilteredFillColor") or "200,0,0",
            "filtered_border_color": root.findtext("FilteredBorderColor") or "200,0,0",
            "filtered_border_thickness": int(root.findtext("FilteredBorderThickness") or "1")
        }
        
        # Parse general settings
        settings["general"] = {
            "geometry_server_url": root.findtext("ESRIGeometryServerURL") or "",
            "output_fields": root.findtext("EsriOutputFields") or "",
            "pin_field_name": root.findtext("GISPINFieldName") or "",
            "x_centroid_field_name": root.findtext("XCentroidFieldName") or "",
            "y_centroid_field_name": root.findtext("YCentroidFieldName") or "",
            "spatial_filter": root.findtext("SpatialFilter") or "",
            "convert_measure_to_projection": int(root.findtext("ConvertMeasureToProjection") or "0"),
            "show_scale_bar": root.findtext("ShowScaleBar") == "true",
            "fetch_partition_size": int(root.findtext("FetchPartitionSize") or "200"),
            "append_search": root.findtext("AppendSearch") == "true",
            "auto_select_max_records": int(root.findtext("AutoSelectMaxRecords") or "2000"),
            "legal_text": root.findtext("LegalText") or "",
            "map_title": root.findtext("MapTitle") or ""
        }
        
        return settings
    
    except Exception as e:
        print(f"Error parsing ESRI Map Settings XML: {e}")
        return {}


def parse_data_connections(xml_string: str) -> Dict[str, Any]:
    """
    Parse Data Connections XML.
    
    Args:
        xml_string: The XML string containing data connection settings
        
    Returns:
        Dictionary containing parsed data connection settings
    """
    try:
        # Parse XML
        root = ET.fromstring(xml_string)
        
        # Initialize connections list
        connections = []
        
        # Parse connections
        for conn in root.findall("./Connections/DataConnectionModel"):
            connection = {
                "name": conn.findtext("ConnectionName") or "",
                "type": conn.findtext("ConnectionType") or "",
                "path": conn.findtext("ConnectionPath") or "",
                "key_field": conn.findtext("KeyField") or "",
                "queries": []
            }
            
            # Parse queries
            for query in conn.findall("./Querys/QueryItemModel"):
                query_data = {
                    "name": query.findtext("n") or "",
                    "description": query.findtext("Description") or "",
                    "execute_immediate": query.findtext("ExecuteImmediate") == "true",
                    "query": query.findtext("Query") or "",
                    "type": query.findtext("Type") or ""
                }
                connection["queries"].append(query_data)
            
            connections.append(connection)
        
        return {"connections": connections}
    
    except Exception as e:
        print(f"Error parsing Data Connections XML: {e}")
        return {"connections": []}


def parse_shared_state(xml_string: str) -> Dict[str, Any]:
    """
    Parse Shared State Settings XML.
    
    Args:
        xml_string: The XML string containing shared state settings
        
    Returns:
        Dictionary containing parsed shared state settings
    """
    try:
        # Parse XML
        root = ET.fromstring(xml_string)
        
        # Initialize settings dictionary
        settings = {
            "base_layer_name": root.findtext("BaseLayerName") or "",
            "saved_locations": [],
            "map_user_settings": []
        }
        
        # Parse saved locations
        for location in root.findall("./SavedLocations/SavedLocationModel"):
            location_data = {
                "name": location.findtext("n") or "",
                "description": location.findtext("Discription") or "",  # Note typo in XML schema
                "spatial_reference_wkid": int(location.findtext("SpatialReferenceWKID") or "0"),
                "x_min": float(location.findtext("XMin") or "0"),
                "y_min": float(location.findtext("YMin") or "0"),
                "x_max": float(location.findtext("XMax") or "0"),
                "y_max": float(location.findtext("YMax") or "0")
            }
            settings["saved_locations"].append(location_data)
        
        # Parse map user settings
        for user_setting in root.findall("./MapUserSettings/MapUserSettingModel"):
            setting_data = {
                "name": user_setting.findtext("n") or "",
                "layout_name": user_setting.findtext("LayoutName") or "",
                "zoom_to_selected": user_setting.findtext("ZoomToSelected") == "true",
                "zoom_to_highlighted": user_setting.findtext("ZoomToHighlighted") == "true",
                "show_scale_bar": user_setting.findtext("ShowScaleBar") == "true",
                "show_legend": user_setting.findtext("ShowLegend") == "true",
                "show_layers": user_setting.findtext("ShowLayers") == "true",
                "show_legal": user_setting.findtext("ShowLegal") == "true",
                "show_title": user_setting.findtext("ShowTitle") == "true",
                "append_search": user_setting.findtext("AppendSearch") == "true",
                "layer_states": []
            }
            
            # Parse layer states
            for layer_state in user_setting.findall("./LayerStates/LayerItemStateModel"):
                state_data = {
                    "id": layer_state.findtext("Id") or "",
                    "is_enabled": layer_state.findtext("IsEnabled") == "true",
                    "is_expanded": layer_state.findtext("IsExpanded") == "true",
                    "child_layers": []
                }
                
                # Parse child layers
                for child_layer in layer_state.findall("./ChildLayers/LayerItemStateModel"):
                    child_data = {
                        "id": child_layer.findtext("Id") or "",
                        "is_enabled": child_layer.findtext("IsEnabled") == "true",
                        "is_expanded": child_layer.findtext("IsExpanded") == "true"
                    }
                    state_data["child_layers"].append(child_data)
                
                setting_data["layer_states"].append(state_data)
            
            settings["map_user_settings"].append(setting_data)
        
        return settings
    
    except Exception as e:
        print(f"Error parsing Shared State XML: {e}")
        return {}


def parse_matix_state(xml_string: str) -> Dict[str, Any]:
    """
    Parse Matix State XML.
    
    Args:
        xml_string: The XML string containing matix state settings
        
    Returns:
        Dictionary containing parsed matix state settings
    """
    try:
        # Parse XML
        root = ET.fromstring(xml_string)
        
        # Initialize settings dictionary
        settings = {
            "default_layout": root.findtext("DefaultLayout") or "",
            "saved_layouts": []
        }
        
        # Parse saved layouts
        for layout in root.findall("./SavedLayouts/SavedLayoutModel"):
            layout_data = {
                "name": layout.findtext("n") or "",
                "description": layout.findtext("Discription") or "",  # Note typo in XML schema
                "layout_xml": layout.findtext("Layout") or ""
            }
            settings["saved_layouts"].append(layout_data)
        
        return settings
    
    except Exception as e:
        print(f"Error parsing Matix State XML: {e}")
        return {}


def save_config_to_json(config: Dict[str, Any], filename: str) -> bool:
    """
    Save configuration dictionary to a JSON file.
    
    Args:
        config: Configuration dictionary
        filename: Output filename
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Ensure config directory exists
        os.makedirs("config", exist_ok=True)
        
        # Write to file
        filepath = os.path.join("config", filename)
        with open(filepath, 'w') as f:
            json.dump(config, f, indent=2)
        
        print(f"Configuration saved to {filepath}")
        return True
    
    except Exception as e:
        print(f"Error saving configuration to {filename}: {e}")
        return False


def load_config_from_json(filename: str) -> Dict[str, Any]:
    """
    Load configuration dictionary from a JSON file.
    
    Args:
        filename: Input filename
        
    Returns:
        Configuration dictionary
    """
    try:
        # Read from file
        filepath = os.path.join("config", filename)
        with open(filepath, 'r') as f:
            config = json.load(f)
        
        return config
    
    except Exception as e:
        print(f"Error loading configuration from {filename}: {e}")
        return {}


def process_xml_files() -> bool:
    """
    Process XML files and save configurations.
    
    Returns:
        True if all files processed successfully, False otherwise
    """
    try:
        # Paths to XML files
        esri_map_path = "attached_assets/Pasted--xml-version-1-0-encoding-utf-8-EsriMapModuleSettings-xmlns-xsi-http-www-w3-org-2001-XML-1745449165807.txt"
        data_conn_path = "attached_assets/Pasted--xml-version-1-0-encoding-utf-8-DataConnections-xmlns-xsi-http-www-w3-org-2001-XMLSchema-1745449153440.txt"
        shared_state_path = "attached_assets/Pasted--xml-version-1-0-encoding-utf-8-SharedStateSettings-xmlns-xsi-http-www-w3-org-2001-XMLSc-1745449173765.txt"
        matix_state_path = "attached_assets/Pasted--xml-version-1-0-encoding-utf-8-MatixState-xmlns-xsi-http-www-w3-org-2001-XMLSchema-inst-1745449205488.txt"
        
        # Read XML files
        with open(esri_map_path, 'r') as f:
            esri_map_xml = f.read()
        
        with open(data_conn_path, 'r') as f:
            data_conn_xml = f.read()
        
        with open(shared_state_path, 'r') as f:
            shared_state_xml = f.read()
        
        with open(matix_state_path, 'r') as f:
            matix_state_xml = f.read()
        
        # Parse XML files
        esri_map_config = parse_esri_map_settings(esri_map_xml)
        data_conn_config = parse_data_connections(data_conn_xml)
        shared_state_config = parse_shared_state(shared_state_xml)
        matix_state_config = parse_matix_state(matix_state_xml)
        
        # Save configurations
        success1 = save_config_to_json(esri_map_config, "esri_map_config.json")
        success2 = save_config_to_json(data_conn_config, "data_connections_config.json")
        success3 = save_config_to_json(shared_state_config, "shared_state_config.json")
        success4 = save_config_to_json(matix_state_config, "matix_state_config.json")
        
        return success1 and success2 and success3 and success4
    
    except Exception as e:
        print(f"Error processing XML files: {e}")
        return False


def is_configured() -> bool:
    """
    Check if configurations are already loaded.
    
    Returns:
        True if configurations exist, False otherwise
    """
    config_files = [
        "esri_map_config.json",
        "data_connections_config.json",
        "shared_state_config.json",
        "matix_state_config.json"
    ]
    
    return all(os.path.exists(os.path.join("config", f)) for f in config_files)


def generate_map_config_from_files() -> Dict[str, Any]:
    """
    Generate map configuration from parsed files.
    
    Returns:
        Map configuration dictionary
    """
    # Load configurations
    esri_map_config = load_config_from_json("esri_map_config.json")
    data_conn_config = load_config_from_json("data_connections_config.json")
    shared_state_config = load_config_from_json("shared_state_config.json")
    
    # Create unified map configuration
    unified_config = {
        # Map settings
        "defaultBaseLayer": shared_state_config.get("base_layer_name", "Imagery"),
        "baseLayers": [],
        "viewableLayers": [],
        "mapExtent": esri_map_config.get("map_extent", {}),
        "selectionStyle": esri_map_config.get("selection_style", {}),
        
        # PACS database settings
        "pacsDatabase": None,
        
        # Saved locations
        "savedLocations": shared_state_config.get("saved_locations", []),
        
        # User interface settings
        "ui": {
            "showScaleBar": esri_map_config.get("general", {}).get("show_scale_bar", False),
            "showLegalText": True,
            "legalText": esri_map_config.get("general", {}).get("legal_text", ""),
            "mapTitle": esri_map_config.get("general", {}).get("map_title", ""),
            "geometryServer": esri_map_config.get("general", {}).get("geometry_server_url", "")
        }
    }
    
    # Process base layers
    for layer in esri_map_config.get("base_layers", []):
        base_layer = {
            "name": layer.get("name", ""),
            "url": layer.get("url", ""),
            "type": layer.get("type", ""),
            "visible": layer.get("visible", False),
            "spatialReference": layer.get("spatial_reference_id", 0)
        }
        unified_config["baseLayers"].append(base_layer)
    
    # Process viewable layers
    for layer in esri_map_config.get("viewable_layers", []):
        viewable_layer = {
            "name": layer.get("name", ""),
            "url": layer.get("url", ""),
            "type": layer.get("type", ""),
            "visible": layer.get("visible", False),
            "selectable": layer.get("enable_selection", False),
            "selectionLayerId": layer.get("selection_layer_id", 0)
        }
        unified_config["viewableLayers"].append(viewable_layer)
    
    # Process PACS database
    for connection in data_conn_config.get("connections", []):
        if connection.get("name") == "PACS Database":
            pacs_db = {
                "name": connection.get("name", ""),
                "type": connection.get("type", ""),
                "connectionString": connection.get("path", ""),
                "keyField": connection.get("key_field", ""),
                "queries": []
            }
            
            # Process queries
            for query in connection.get("queries", []):
                pacs_query = {
                    "name": query.get("name", ""),
                    "description": query.get("description", ""),
                    "sql": query.get("query", ""),
                    "executeImmediate": query.get("execute_immediate", False),
                    "type": query.get("type", "")
                }
                pacs_db["queries"].append(pacs_query)
            
            unified_config["pacsDatabase"] = pacs_db
            break
    
    return unified_config


if __name__ == "__main__":
    if not is_configured():
        success = process_xml_files()
        print(f"XML processing {'successful' if success else 'failed'}")
    
    map_config = generate_map_config_from_files()
    save_config_to_json(map_config, "unified_map_config.json")
    print("Generated unified map configuration")