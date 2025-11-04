import os
import json
import logging
import pandas as pd
from datetime import datetime

# Configure logger
logger = logging.getLogger(__name__)

def create_export_directory():
    """
    Create directories for exported files if they don't exist.
    
    Returns:
        str: Path to the export directory
    """
    export_dir = "output/exports"
    if not os.path.exists(export_dir):
        os.makedirs(export_dir, exist_ok=True)
        logger.info(f"Created export directory at {export_dir}")
    return export_dir

def export_to_csv(data, filename=None):
    """
    Export data to CSV format.
    
    Args:
        data (list): List of dictionaries containing data to export
        filename (str, optional): Custom filename for the exported file
        
    Returns:
        str: Path to the exported file
    """
    if not data:
        logger.warning("No data to export to CSV")
        return None
        
    try:
        # Create export directory
        export_dir = create_export_directory()
        
        # Generate filename if not provided
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"narrpr_export_{timestamp}.csv"
        
        # Ensure filename has .csv extension
        if not filename.endswith('.csv'):
            filename += '.csv'
            
        # Create full file path
        file_path = os.path.join(export_dir, filename)
        
        # Convert data to DataFrame and export
        df = pd.DataFrame(data)
        df.to_csv(file_path, index=False)
        
        logger.info(f"Data exported to CSV: {file_path}")
        return file_path
        
    except Exception as e:
        logger.error(f"Error exporting data to CSV: {str(e)}")
        return None

def export_to_json(data, filename=None):
    """
    Export data to JSON format.
    
    Args:
        data (list): List of dictionaries containing data to export
        filename (str, optional): Custom filename for the exported file
        
    Returns:
        str: Path to the exported file
    """
    if not data:
        logger.warning("No data to export to JSON")
        return None
        
    try:
        # Create export directory
        export_dir = create_export_directory()
        
        # Generate filename if not provided
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"narrpr_export_{timestamp}.json"
        
        # Ensure filename has .json extension
        if not filename.endswith('.json'):
            filename += '.json'
            
        # Create full file path
        file_path = os.path.join(export_dir, filename)
        
        # Export data to JSON
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=4)
        
        logger.info(f"Data exported to JSON: {file_path}")
        return file_path
        
    except Exception as e:
        logger.error(f"Error exporting data to JSON: {str(e)}")
        return None

def export_to_excel(data, filename=None):
    """
    Export data to Excel format.
    
    Args:
        data (list): List of dictionaries containing data to export
        filename (str, optional): Custom filename for the exported file
        
    Returns:
        str: Path to the exported file
    """
    if not data:
        logger.warning("No data to export to Excel")
        return None
        
    try:
        # Create export directory
        export_dir = create_export_directory()
        
        # Generate filename if not provided
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"narrpr_export_{timestamp}.xlsx"
        
        # Ensure filename has .xlsx extension
        if not filename.endswith('.xlsx'):
            filename += '.xlsx'
            
        # Create full file path
        file_path = os.path.join(export_dir, filename)
        
        # Convert data to DataFrame
        df = pd.DataFrame(data)
        
        # Export to Excel with formatting
        with pd.ExcelWriter(file_path, engine='xlsxwriter') as writer:
            df.to_excel(writer, sheet_name='NARRPR Reports', index=False)
            
            # Get the xlsxwriter workbook and worksheet objects
            workbook = writer.book
            worksheet = writer.sheets['NARRPR Reports']
            
            # Add a header format
            header_format = workbook.add_format({
                'bold': True,
                'text_wrap': True,
                'valign': 'top',
                'bg_color': '#D9E1F2',
                'border': 1
            })
            
            # Apply the header format to the header row
            for col_num, value in enumerate(df.columns.values):
                worksheet.write(0, col_num, value, header_format)
                
            # Set column widths
            for i, col in enumerate(df.columns):
                # Set column width based on max content length
                max_len = max(df[col].astype(str).map(len).max(), len(col)) + 2
                worksheet.set_column(i, i, max_len)
        
        logger.info(f"Data exported to Excel: {file_path}")
        return file_path
        
    except Exception as e:
        logger.error(f"Error exporting data to Excel: {str(e)}")
        return None

def get_export_formats():
    """
    Get list of available export formats.
    
    Returns:
        list: List of available export formats with info
    """
    return [
        {'id': 'csv', 'name': 'CSV', 'extension': '.csv', 'description': 'Common text format compatible with spreadsheet applications'},
        {'id': 'json', 'name': 'JSON', 'extension': '.json', 'description': 'Structured format for data interchange and API integration'},
        {'id': 'excel', 'name': 'Excel', 'extension': '.xlsx', 'description': 'Microsoft Excel format with formatting and multiple sheets'},
    ]