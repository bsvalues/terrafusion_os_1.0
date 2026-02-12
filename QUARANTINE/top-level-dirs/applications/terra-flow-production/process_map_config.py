"""
Process Map Configuration XML Files

This script processes the XML configuration files for the TerraFlow map module.
It parses the XML files, extracts the configuration settings, and applies them
to the map module.
"""

import os
import json
from map_config_parser import (
    process_xml_files,
    is_configured,
    generate_map_config_from_files,
    save_config_to_json
)

def main():
    """
    Main function to process XML configurations and apply settings
    """
    print("TerraFlow Map Configuration Processor")
    print("-" * 40)
    
    # Check if configuration files exist
    if not is_configured():
        print("Processing XML configuration files...")
        success = process_xml_files()
        if not success:
            print("Error processing XML files. Please check the log.")
            return
        print("XML files processed successfully.")
    else:
        print("Configuration files already exist. Using existing configurations.")
    
    # Generate unified map configuration
    print("Generating unified map configuration...")
    map_config = generate_map_config_from_files()
    save_config_to_json(map_config, "unified_map_config.json")
    print("Unified map configuration generated and saved.")
    
    # Create config directory if it doesn't exist
    os.makedirs("static/js/config", exist_ok=True)
    
    # Generate JavaScript configuration file for client-side use
    print("Generating JavaScript configuration file...")
    js_config_path = "static/js/config/map_config.js"
    with open(js_config_path, "w") as f:
        f.write("// TerraFlow Map Configuration\n")
        f.write("// Auto-generated from XML configuration files\n\n")
        f.write("const MapConfig = ")
        json.dump(map_config, f, indent=2)
        f.write(";\n\n")
        f.write("// Export for module use\n")
        f.write("if (typeof module !== 'undefined' && module.exports) {\n")
        f.write("    module.exports = { MapConfig };\n")
        f.write("}\n")
    
    print(f"JavaScript configuration saved to {js_config_path}")
    
    # Display configuration summary
    print("\nConfiguration Summary:")
    print(f"  Base Layers: {len(map_config.get('baseLayers', []))}")
    print(f"  Feature Layers: {len(map_config.get('viewableLayers', []))}")
    
    if map_config.get('pacsDatabase'):
        print("  PACS Database: Configured")
        print(f"    Queries: {len(map_config.get('pacsDatabase', {}).get('queries', []))}")
    else:
        print("  PACS Database: Not configured")
    
    print(f"  Saved Locations: {len(map_config.get('savedLocations', []))}")
    print("  UI Settings:")
    print(f"    Show Scale Bar: {map_config.get('ui', {}).get('showScaleBar', False)}")
    print(f"    Show Legal Text: {map_config.get('ui', {}).get('showLegalText', True)}")
    print(f"    Map Title: {map_config.get('ui', {}).get('mapTitle', '')}")
    
    print("\nMap configuration processing complete.")

if __name__ == "__main__":
    main()