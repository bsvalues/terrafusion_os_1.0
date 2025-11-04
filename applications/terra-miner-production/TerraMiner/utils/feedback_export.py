"""
Utility functions for exporting AI feedback data in various formats.
"""
import csv
import io
import logging
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

import pandas as pd
from flask import Response

# Setup logger
logger = logging.getLogger(__name__)

def create_export_directory():
    """
    Create directories for exported feedback files if they don't exist.
    
    Returns:
        str: Path to the export directory
    """
    export_dir = os.path.join(os.getcwd(), 'output', 'feedback_exports')
    os.makedirs(export_dir, exist_ok=True)
    
    logger.info(f"Export directory created/confirmed at: {export_dir}")
    return export_dir

def format_feedback_data(feedback_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Format feedback data for export, ensuring consistent fields and format.
    
    Args:
        feedback_data (List[Dict[str, Any]]): Raw feedback data from database
        
    Returns:
        List[Dict[str, Any]]: Formatted feedback data
    """
    formatted_data = []
    
    for item in feedback_data:
        # Format dates
        created_at = item.get('created_at')
        if isinstance(created_at, str):
            try:
                # Parse ISO format date
                created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            except ValueError:
                # If parsing fails, keep the original
                pass
                
        formatted_item = {
            'id': item.get('id'),
            'agent_type': item.get('agent_type'),
            'rating': item.get('rating'),
            'comments': item.get('comments', ''),
            'session_id': item.get('session_id', ''),
            'created_at': created_at.strftime('%Y-%m-%d %H:%M:%S') if isinstance(created_at, datetime) else created_at,
            'query_data': item.get('query_data', ''),
            'response_data': item.get('response_data', '')
        }
        
        formatted_data.append(formatted_item)
    
    return formatted_data

def export_to_csv(feedback_data: List[Dict[str, Any]], filename: Optional[str] = None) -> str:
    """
    Export feedback data to CSV format.
    
    Args:
        feedback_data (List[Dict[str, Any]]): Feedback data to export
        filename (str, optional): Custom filename for the exported file
        
    Returns:
        str: Path to the exported file
    """
    export_dir = create_export_directory()
    
    if not filename:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"ai_feedback_export_{timestamp}.csv"
    
    file_path = os.path.join(export_dir, filename)
    
    # Format data for export
    formatted_data = format_feedback_data(feedback_data)
    
    try:
        # Write to CSV file
        with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
            if formatted_data:
                fieldnames = list(formatted_data[0].keys())
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                
                writer.writeheader()
                for row in formatted_data:
                    writer.writerow(row)
        
        logger.info(f"Feedback data exported to CSV: {file_path}")
        return file_path
    except Exception as e:
        logger.error(f"Error exporting feedback data to CSV: {e}")
        raise

def export_to_excel(feedback_data: List[Dict[str, Any]], filename: Optional[str] = None) -> str:
    """
    Export feedback data to Excel format.
    
    Args:
        feedback_data (List[Dict[str, Any]]): Feedback data to export
        filename (str, optional): Custom filename for the exported file
        
    Returns:
        str: Path to the exported file
    """
    export_dir = create_export_directory()
    
    if not filename:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"ai_feedback_export_{timestamp}.xlsx"
    
    file_path = os.path.join(export_dir, filename)
    
    # Format data for export
    formatted_data = format_feedback_data(feedback_data)
    
    try:
        # Create DataFrame and export to Excel
        df = pd.DataFrame(formatted_data)
        
        # Write to Excel file
        with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='AI Feedback')
            
            # Auto-adjust column widths
            worksheet = writer.sheets['AI Feedback']
            for i, col in enumerate(df.columns):
                max_width = max(df[col].astype(str).map(len).max(), len(col)) + 2
                worksheet.column_dimensions[worksheet.cell(1, i + 1).column_letter].width = max_width
        
        logger.info(f"Feedback data exported to Excel: {file_path}")
        return file_path
    except Exception as e:
        logger.error(f"Error exporting feedback data to Excel: {e}")
        raise

def generate_csv_response(feedback_data: List[Dict[str, Any]]) -> Response:
    """
    Generate a downloadable CSV response for web export.
    
    Args:
        feedback_data (List[Dict[str, Any]]): Feedback data to export
        
    Returns:
        Response: Flask response with CSV attachment
    """
    from flask import Response
    
    # Format data for export
    formatted_data = format_feedback_data(feedback_data)
    
    # Create in-memory string buffer
    si = io.StringIO()
    
    # Write to CSV string
    if formatted_data:
        fieldnames = list(formatted_data[0].keys())
        writer = csv.DictWriter(si, fieldnames=fieldnames)
        
        writer.writeheader()
        for row in formatted_data:
            writer.writerow(row)
    
    output = si.getvalue()
    si.close()
    
    # Generate filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"ai_feedback_export_{timestamp}.csv"
    
    # Create response
    response = Response(
        output,
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment;filename={filename}"}
    )
    
    return response

def generate_excel_response(feedback_data: List[Dict[str, Any]]) -> Response:
    """
    Generate a downloadable Excel response for web export.
    
    Args:
        feedback_data (List[Dict[str, Any]]): Feedback data to export
        
    Returns:
        Response: Flask response with Excel attachment
    """
    from flask import Response
    
    # Format data for export
    formatted_data = format_feedback_data(feedback_data)
    
    # Create DataFrame
    df = pd.DataFrame(formatted_data)
    
    # Create in-memory bytes buffer
    output = io.BytesIO()
    
    # Write to Excel
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='AI Feedback')
        
        # Auto-adjust column widths
        worksheet = writer.sheets['AI Feedback']
        for i, col in enumerate(df.columns):
            max_width = max(df[col].astype(str).map(len).max(), len(col)) + 2
            worksheet.column_dimensions[worksheet.cell(1, i + 1).column_letter].width = max_width
    
    # Reset buffer position
    output.seek(0)
    
    # Generate filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"ai_feedback_export_{timestamp}.xlsx"
    
    # Create response
    response = Response(
        output.getvalue(),
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment;filename={filename}"}
    )
    
    return response