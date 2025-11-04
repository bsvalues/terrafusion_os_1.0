"""
Report Generator Module

This module provides functionality for generating reports from templates
and geospatial data for the Benton County Assessor's Office.
"""

import os
import json
import logging
import datetime
import uuid
import zipfile
import tempfile
from typing import Dict, List, Any, Optional, Union, Tuple, BinaryIO, Set

import geopandas as gpd
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from matplotlib.figure import Figure
from matplotlib.backends.backend_pdf import PdfPages
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, 
    Image, PageBreak, KeepTogether, ListFlowable, ListItem
)
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.linecharts import LineChart
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.widgets.markers import makeMarker

from reports.report_templates import ReportTemplate, template_manager

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class ReportGenerator:
    """
    Generator for reports based on templates and geospatial data.
    """
    
    def __init__(self, output_directory: str = "reports/output"):
        """
        Initialize the report generator.
        
        Args:
            output_directory: Directory to store generated reports
        """
        self.output_directory = output_directory
        
        # Create output directory if it doesn't exist
        os.makedirs(self.output_directory, exist_ok=True)
        
        # Available export formats
        self.export_formats = {
            "pdf": self._generate_pdf,
            "html": self._generate_html,
            "csv": self._generate_csv,
            "json": self._generate_json,
            "geojson": self._generate_geojson,
            "xlsx": self._generate_excel
        }
    
    def generate_report(self, template_id: str, data: Dict[str, Any], 
                      export_format: str = "pdf", 
                      report_title: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate a report from a template and data.
        
        Args:
            template_id: Template ID
            data: Report data
            export_format: Export format (pdf, html, csv, json, geojson, xlsx)
            report_title: Optional report title
            
        Returns:
            Report information
        """
        # Get template
        template = template_manager.get_template(template_id)
        if not template:
            raise ValueError(f"Template not found: {template_id}")
        
        # Generate report ID and create report info
        report_id = str(uuid.uuid4())
        timestamp = datetime.datetime.now()
        
        report_info = {
            "report_id": report_id,
            "template_id": template_id,
            "template_name": template.name,
            "template_type": template.template_type,
            "created_at": timestamp.isoformat(),
            "title": report_title or template.name,
            "export_format": export_format,
            "file_path": None,
            "file_size": 0,
            "status": "generating"
        }
        
        try:
            # Prepare data for the report
            prepared_data = self._prepare_data(template, data)
            
            # Generate report in the specified format
            if export_format in self.export_formats:
                file_path = self.export_formats[export_format](template, prepared_data, report_id, report_info["title"])
                
                # Update report info
                report_info["file_path"] = file_path
                report_info["file_size"] = os.path.getsize(file_path)
                report_info["status"] = "completed"
                
                logger.info(f"Generated {export_format} report: {report_id}")
                
            else:
                raise ValueError(f"Unsupported export format: {export_format}")
            
        except Exception as e:
            # Update report info with error
            report_info["status"] = "failed"
            report_info["error"] = str(e)
            
            logger.error(f"Error generating report: {str(e)}")
        
        return report_info
    
    def generate_geospatial_report(self, template_id: str, geospatial_data: Dict[str, Any],
                                 export_format: str = "pdf", 
                                 report_title: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate a geospatial report from a template and geospatial data.
        
        Args:
            template_id: Template ID
            geospatial_data: Geospatial data for the report
            export_format: Export format (pdf, html, csv, json, geojson, xlsx)
            report_title: Optional report title
            
        Returns:
            Report information
        """
        # Add geospatial metadata to the data
        data = {
            "geospatial_data": geospatial_data,
            "metadata": {
                "report_type": "geospatial",
                "generation_time": datetime.datetime.now().isoformat(),
                "data_sources": geospatial_data.get("metadata", {}).get("sources", [])
            }
        }
        
        # Generate report
        return self.generate_report(template_id, data, export_format, report_title)
    
    def export_multiple_formats(self, template_id: str, data: Dict[str, Any],
                              formats: List[str], 
                              report_title: Optional[str] = None) -> Dict[str, Any]:
        """
        Export a report in multiple formats.
        
        Args:
            template_id: Template ID
            data: Report data
            formats: List of export formats
            report_title: Optional report title
            
        Returns:
            Report information
        """
        # Generate report ID and create report info
        report_id = str(uuid.uuid4())
        timestamp = datetime.datetime.now()
        
        # Get template
        template = template_manager.get_template(template_id)
        if not template:
            raise ValueError(f"Template not found: {template_id}")
        
        # Create multi-format report info
        report_info = {
            "report_id": report_id,
            "template_id": template_id,
            "template_name": template.name,
            "template_type": template.template_type,
            "created_at": timestamp.isoformat(),
            "title": report_title or template.name,
            "formats": formats,
            "files": {},
            "zip_path": None,
            "zip_size": 0,
            "status": "generating"
        }
        
        try:
            # Prepare data for the report
            prepared_data = self._prepare_data(template, data)
            
            # Generate reports in each format
            for export_format in formats:
                if export_format in self.export_formats:
                    file_path = self.export_formats[export_format](template, prepared_data, report_id, report_info["title"])
                    
                    # Add file info
                    report_info["files"][export_format] = {
                        "file_path": file_path,
                        "file_size": os.path.getsize(file_path)
                    }
            
            # Create ZIP archive of all generated files
            zip_path = os.path.join(self.output_directory, f"{report_id}.zip")
            with zipfile.ZipFile(zip_path, 'w') as zip_file:
                for export_format, file_info in report_info["files"].items():
                    file_path = file_info["file_path"]
                    if os.path.exists(file_path):
                        zip_file.write(
                            file_path, 
                            arcname=f"{report_id}.{export_format}"
                        )
            
            # Update report info
            report_info["zip_path"] = zip_path
            report_info["zip_size"] = os.path.getsize(zip_path)
            report_info["status"] = "completed"
            
            logger.info(f"Generated multi-format report: {report_id}")
            
        except Exception as e:
            # Update report info with error
            report_info["status"] = "failed"
            report_info["error"] = str(e)
            
            logger.error(f"Error generating multi-format report: {str(e)}")
        
        return report_info
    
    def batch_export_properties(self, template_id: str, property_ids: List[str],
                               export_format: str = "pdf") -> Dict[str, Any]:
        """
        Generate reports for multiple properties.
        
        Args:
            template_id: Template ID
            property_ids: List of property IDs
            export_format: Export format
            
        Returns:
            Batch report information
        """
        # Generate batch ID and create batch info
        batch_id = str(uuid.uuid4())
        timestamp = datetime.datetime.now()
        
        # Get template
        template = template_manager.get_template(template_id)
        if not template:
            raise ValueError(f"Template not found: {template_id}")
        
        # Create batch info
        batch_info = {
            "batch_id": batch_id,
            "template_id": template_id,
            "template_name": template.name,
            "created_at": timestamp.isoformat(),
            "export_format": export_format,
            "property_count": len(property_ids),
            "completed_count": 0,
            "failed_count": 0,
            "reports": {},
            "zip_path": None,
            "zip_size": 0,
            "status": "processing"
        }
        
        try:
            # Process each property
            for property_id in property_ids:
                try:
                    # Fetch property data (in a real system, this would query the database)
                    property_data = self._fetch_property_data(property_id)
                    
                    # Generate report
                    report_info = self.generate_report(
                        template_id=template_id,
                        data={"property": property_data},
                        export_format=export_format,
                        report_title=f"Property Report: {property_data.get('address', property_id)}"
                    )
                    
                    # Add report info to batch
                    batch_info["reports"][property_id] = {
                        "report_id": report_info["report_id"],
                        "file_path": report_info["file_path"],
                        "status": report_info["status"]
                    }
                    
                    # Update counters
                    if report_info["status"] == "completed":
                        batch_info["completed_count"] += 1
                    else:
                        batch_info["failed_count"] += 1
                    
                except Exception as e:
                    logger.error(f"Error processing property {property_id}: {str(e)}")
                    
                    # Add failed report info
                    batch_info["reports"][property_id] = {
                        "status": "failed",
                        "error": str(e)
                    }
                    
                    batch_info["failed_count"] += 1
            
            # Create ZIP archive of all generated files
            zip_path = os.path.join(self.output_directory, f"batch_{batch_id}.zip")
            with zipfile.ZipFile(zip_path, 'w') as zip_file:
                for property_id, report_info in batch_info["reports"].items():
                    if report_info.get("status") == "completed":
                        file_path = report_info.get("file_path")
                        if file_path and os.path.exists(file_path):
                            zip_file.write(
                                file_path, 
                                arcname=f"{property_id}.{export_format}"
                            )
            
            # Update batch info
            batch_info["zip_path"] = zip_path
            batch_info["zip_size"] = os.path.getsize(zip_path)
            batch_info["status"] = "completed"
            
            logger.info(f"Completed batch export: {batch_id} ({batch_info['completed_count']}/{batch_info['property_count']} successful)")
            
        except Exception as e:
            # Update batch info with error
            batch_info["status"] = "failed"
            batch_info["error"] = str(e)
            
            logger.error(f"Error in batch export: {str(e)}")
        
        return batch_info
    
    def _prepare_data(self, template: ReportTemplate, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Prepare data for report generation.
        
        Args:
            template: Report template
            data: Raw report data
            
        Returns:
            Prepared data
        """
        # Create a copy of the data
        prepared_data = data.copy()
        
        # Add report metadata
        if "metadata" not in prepared_data:
            prepared_data["metadata"] = {}
        
        prepared_data["metadata"]["generation_time"] = datetime.datetime.now().isoformat()
        prepared_data["metadata"]["template_id"] = template.template_id
        prepared_data["metadata"]["template_name"] = template.name
        
        # Process different data types based on template type
        if template.template_type == "property_assessment":
            # Add property assessment specific metadata
            if "property" in prepared_data:
                # Calculate additional fields if needed
                property_data = prepared_data["property"]
                
                # Calculate value change percent if needed
                if "assessed_value" in property_data and "previous_value" in property_data:
                    if property_data["previous_value"] > 0:
                        value_change = (property_data["assessed_value"] - property_data["previous_value"]) / property_data["previous_value"] * 100
                        property_data["value_change_percent"] = round(value_change, 2)
        
        elif template.template_type == "geospatial_analysis":
            # Add geospatial analysis specific metadata
            if "geospatial_data" in prepared_data:
                # Aggregate data as needed
                geospatial_data = prepared_data["geospatial_data"]
                
                # Calculate statistics by area if needed
                if "properties" in geospatial_data and "areas" in geospatial_data:
                    area_stats = {}
                    
                    # Group properties by area
                    for prop in geospatial_data["properties"]:
                        area_id = prop.get("area_id")
                        if area_id:
                            if area_id not in area_stats:
                                area_stats[area_id] = {
                                    "properties": [],
                                    "values": []
                                }
                            
                            area_stats[area_id]["properties"].append(prop)
                            
                            if "assessed_value" in prop:
                                area_stats[area_id]["values"].append(prop["assessed_value"])
                    
                    # Calculate statistics for each area
                    area_summary = []
                    for area_id, stats in area_stats.items():
                        # Find area info
                        area_info = next((a for a in geospatial_data["areas"] if a.get("area_id") == area_id), {})
                        
                        # Calculate statistics
                        values = stats["values"]
                        if values:
                            area_summary.append({
                                "area_id": area_id,
                                "area_name": area_info.get("name", f"Area {area_id}"),
                                "property_count": len(stats["properties"]),
                                "min_value": min(values),
                                "max_value": max(values),
                                "avg_value": sum(values) / len(values),
                                "median_value": sorted(values)[len(values) // 2],
                                "std_dev": self._calculate_std_dev(values),
                                "anomaly_count": sum(1 for p in stats["properties"] if p.get("is_anomaly", False))
                            })
                    
                    # Add area summary to prepared data
                    prepared_data["area_summary"] = area_summary
        
        return prepared_data
    
    def _calculate_std_dev(self, values: List[float]) -> float:
        """
        Calculate standard deviation.
        
        Args:
            values: List of values
            
        Returns:
            Standard deviation
        """
        if not values:
            return 0
        
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        return (variance ** 0.5)
    
    def _fetch_property_data(self, property_id: str) -> Dict[str, Any]:
        """
        Fetch property data (placeholder implementation).
        
        Args:
            property_id: Property ID
            
        Returns:
            Property data
        """
        # In a real implementation, this would query the database
        # For now, return mock data
        return {
            "property_id": property_id,
            "address": "123 Main St, Kennewick, WA 99336",
            "owner_name": "John Doe",
            "parcel_id": "123-4567-890",
            "property_type": "residential",
            "year_built": 1985,
            "square_footage": 2400,
            "lot_size": 0.25,
            "assessed_value": 350000,
            "land_value": 100000,
            "improvement_value": 250000,
            "market_value": 375000,
            "previous_value": 325000,
            "latitude": 46.2087,
            "longitude": -119.1361
        }
    
    def _generate_pdf(self, template: ReportTemplate, data: Dict[str, Any], 
                     report_id: str, report_title: str) -> str:
        """
        Generate PDF report.
        
        Args:
            template: Report template
            data: Report data
            report_id: Report ID
            report_title: Report title
            
        Returns:
            Path to generated file
        """
        file_path = os.path.join(self.output_directory, f"{report_id}.pdf")
        
        # Create PDF document
        doc = SimpleDocTemplate(
            file_path,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )
        
        # Get styles
        styles = getSampleStyleSheet()
        title_style = styles['Title']
        heading1_style = styles['Heading1']
        heading2_style = styles['Heading2']
        normal_style = styles['Normal']
        
        # Create list of flowables for the document
        elements = []
        
        # Add title
        elements.append(Paragraph(report_title, title_style))
        elements.append(Spacer(1, 12))
        
        # Process each section
        for section in template.sections:
            section_type = section.get("section_type", "")
            section_title = section.get("title", "")
            section_content = section.get("content", {})
            
            # Add section heading
            elements.append(Paragraph(section_title, heading1_style))
            elements.append(Spacer(1, 6))
            
            # Process section based on type
            if section_type == "header":
                # Add subtitle if present
                subtitle = section_content.get("subtitle")
                if subtitle:
                    elements.append(Paragraph(subtitle, heading2_style))
                    elements.append(Spacer(1, 6))
                
                # Add date if requested
                if section_content.get("include_date", False):
                    date_str = datetime.datetime.now().strftime("%B %d, %Y")
                    elements.append(Paragraph(f"Generated on: {date_str}", normal_style))
                    elements.append(Spacer(1, 12))
            
            elif section_type == "text":
                # Add text content
                text = section_content.get("text", "")
                format_type = section_content.get("format", "paragraph")
                
                if format_type == "paragraph":
                    elements.append(Paragraph(text, normal_style))
                    elements.append(Spacer(1, 12))
                elif format_type == "bullet_list":
                    # Split text into bullet points
                    bullet_points = text.split('\n')
                    for point in bullet_points:
                        if point.strip():
                            elements.append(ListItem(Paragraph(point.strip(), normal_style)))
                    elements.append(Spacer(1, 12))
            
            elif section_type == "property_info":
                # Add property information
                if "property" in data:
                    property_data = data["property"]
                    fields = section_content.get("fields", [])
                    
                    # Create table data
                    table_data = []
                    for field in fields:
                        if field in property_data:
                            field_name = field.replace('_', ' ').title()
                            field_value = str(property_data[field])
                            table_data.append([field_name, field_value])
                    
                    # Create table
                    if table_data:
                        table = Table(table_data, colWidths=[200, 250])
                        table.setStyle(TableStyle([
                            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
                            ('TEXTCOLOR', (0, 0), (0, -1), colors.black),
                            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
                            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                        ]))
                        elements.append(table)
                        elements.append(Spacer(1, 12))
            
            elif section_type == "valuation":
                # Add valuation information
                if "property" in data:
                    property_data = data["property"]
                    fields = section_content.get("fields", [])
                    
                    # Create table data
                    table_data = []
                    for field in fields:
                        if field in property_data:
                            field_name = field.replace('_', ' ').title()
                            field_value = str(property_data[field])
                            if field.endswith('_percent'):
                                field_value = f"{field_value}%"
                            elif field.endswith('_value'):
                                field_value = f"${field_value:,}"
                            table_data.append([field_name, field_value])
                    
                    # Create table
                    if table_data:
                        table = Table(table_data, colWidths=[200, 250])
                        table.setStyle(TableStyle([
                            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
                            ('TEXTCOLOR', (0, 0), (0, -1), colors.black),
                            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
                            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                        ]))
                        elements.append(table)
                        elements.append(Spacer(1, 12))
                    
                    # Add chart if requested
                    if section_content.get("include_chart", False) and all(
                        k in property_data for k in ["land_value", "improvement_value"]
                    ):
                        # Create bar chart for value components
                        drawing = Drawing(400, 200)
                        
                        data = [
                            [property_data["land_value"], property_data["improvement_value"]]
                        ]
                        
                        chart = VerticalBarChart()
                        chart.x = 50
                        chart.y = 50
                        chart.height = 125
                        chart.width = 300
                        chart.data = data
                        chart.bars[0].fillColor = colors.lightblue
                        
                        chart.valueAxis.valueMin = 0
                        chart.valueAxis.valueMax = max(data[0]) * 1.2
                        chart.valueAxis.valueStep = max(data[0]) / 5
                        
                        chart.categoryAxis.labels.boxAnchor = 'ne'
                        chart.categoryAxis.labels.dx = 8
                        chart.categoryAxis.labels.dy = -2
                        chart.categoryAxis.labels.angle = 30
                        chart.categoryAxis.categoryNames = ['Land Value', 'Improvement Value']
                        
                        drawing.add(chart)
                        elements.append(drawing)
                        elements.append(Spacer(1, 12))
            
            elif section_type == "table":
                # Add generic table
                columns = section_content.get("columns", [])
                data_key = section_content.get("data_key", "")
                
                if data_key in data and columns:
                    table_data = []
                    
                    # Add header row
                    header_row = [col.replace('_', ' ').title() for col in columns]
                    table_data.append(header_row)
                    
                    # Add data rows
                    for row in data[data_key]:
                        table_row = []
                        for col in columns:
                            value = row.get(col, "")
                            table_row.append(str(value))
                        table_data.append(table_row)
                    
                    # Create table
                    table = Table(table_data)
                    table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, 0), 10),
                        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                        ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
                        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                        ('FONTSIZE', (0, 1), (-1, -1), 8),
                        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
                        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                    ]))
                    elements.append(table)
                    elements.append(Spacer(1, 12))
                    
                    # Add page break after large tables
                    if len(table_data) > 10:
                        elements.append(PageBreak())
            
            elif section_type == "chart":
                # Add generic chart
                chart_type = section_content.get("chart_type", "bar")
                data_field = section_content.get("data_field", "")
                group_by = section_content.get("group_by", "")
                
                # Check if we have the necessary data
                if "geospatial_data" in data and "properties" in data["geospatial_data"]:
                    properties = data["geospatial_data"]["properties"]
                    
                    if chart_type == "bar" and group_by and data_field:
                        # Group data by the specified field
                        grouped_data = {}
                        for prop in properties:
                            if group_by in prop and data_field in prop:
                                group_value = prop[group_by]
                                if group_value not in grouped_data:
                                    grouped_data[group_value] = []
                                grouped_data[group_value].append(prop[data_field])
                        
                        # Calculate aggregated value for each group
                        chart_data = []
                        for group, values in grouped_data.items():
                            aggregate = section_content.get("aggregate", "avg")
                            if aggregate == "avg":
                                value = sum(values) / len(values)
                            elif aggregate == "sum":
                                value = sum(values)
                            elif aggregate == "max":
                                value = max(values)
                            elif aggregate == "min":
                                value = min(values)
                            else:
                                value = sum(values) / len(values)
                            
                            chart_data.append((group, value))
                        
                        # Sort data if requested
                        sort_by = section_content.get("sort_by", "")
                        sort_direction = section_content.get("sort_direction", "asc")
                        
                        if sort_by == "value":
                            reverse = sort_direction == "desc"
                            chart_data.sort(key=lambda x: x[1], reverse=reverse)
                        elif sort_by == "name":
                            reverse = sort_direction == "desc"
                            chart_data.sort(key=lambda x: x[0], reverse=reverse)
                        
                        # Create bar chart
                        drawing = Drawing(400, 200)
                        
                        data = [[d[1] for d in chart_data]]
                        
                        chart = VerticalBarChart()
                        chart.x = 50
                        chart.y = 50
                        chart.height = 125
                        chart.width = 300
                        chart.data = data
                        chart.bars[0].fillColor = colors.lightblue
                        
                        chart.valueAxis.valueMin = 0
                        chart.valueAxis.valueMax = max(data[0]) * 1.2 if data[0] else 100
                        chart.valueAxis.valueStep = max(data[0]) / 5 if data[0] else 20
                        
                        chart.categoryAxis.labels.boxAnchor = 'ne'
                        chart.categoryAxis.labels.dx = 8
                        chart.categoryAxis.labels.dy = -2
                        chart.categoryAxis.labels.angle = 30
                        chart.categoryAxis.categoryNames = [str(d[0]) for d in chart_data]
                        
                        drawing.add(chart)
                        elements.append(drawing)
                        elements.append(Spacer(1, 12))
                    
                    elif chart_type == "pie" and group_by:
                        # Group data by the specified field
                        grouped_data = {}
                        for prop in properties:
                            if group_by in prop:
                                group_value = prop[group_by]
                                if group_value not in grouped_data:
                                    grouped_data[group_value] = 0
                                grouped_data[group_value] += 1
                        
                        # Create pie chart
                        drawing = Drawing(400, 200)
                        
                        pie = Pie()
                        pie.x = 150
                        pie.y = 65
                        pie.width = 100
                        pie.height = 100
                        pie.data = [grouped_data[k] for k in grouped_data]
                        pie.labels = [str(k) for k in grouped_data]
                        pie.slices.strokeWidth = 0.5
                        
                        drawing.add(pie)
                        elements.append(drawing)
                        elements.append(Spacer(1, 12))
            
            elif section_type == "footer":
                # Add footer content
                elements.append(Spacer(1, 12))
                
                # Add disclaimer if requested
                if section_content.get("include_disclaimer", False):
                    disclaimer = (
                        "Disclaimer: This report is generated for informational purposes only. "
                        "The information provided is based on current data and may not reflect "
                        "recent changes or updates. Please contact the Benton County Assessor's "
                        "Office for the most current information."
                    )
                    elements.append(Paragraph(disclaimer, styles["Italic"]))
                    elements.append(Spacer(1, 12))
                
                # Add contact information if requested
                if section_content.get("include_contact", False):
                    contact = (
                        "For questions or more information, please contact:\n"
                        "Benton County Assessor's Office\n"
                        "Phone: (555) 555-5555\n"
                        "Email: assessor@bentoncounty.gov"
                    )
                    elements.append(Paragraph(contact, normal_style))
                    elements.append(Spacer(1, 12))
                
                # Add generation date if requested
                if section_content.get("include_generated_date", False):
                    date_str = datetime.datetime.now().strftime("%B %d, %Y %H:%M:%S")
                    elements.append(Paragraph(f"Generated on: {date_str}", styles["Italic"]))
            
            # Add spacer between sections
            elements.append(Spacer(1, 12))
        
        # Build the PDF document
        doc.build(elements)
        
        return file_path
    
    def _generate_html(self, template: ReportTemplate, data: Dict[str, Any], 
                      report_id: str, report_title: str) -> str:
        """
        Generate HTML report.
        
        Args:
            template: Report template
            data: Report data
            report_id: Report ID
            report_title: Report title
            
        Returns:
            Path to generated file
        """
        file_path = os.path.join(self.output_directory, f"{report_id}.html")
        
        # Start building HTML
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{report_title}</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
        }}
        .container {{
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }}
        h1 {{
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }}
        h2 {{
            color: #2c3e50;
            margin-top: 30px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }}
        th, td {{
            padding: 12px 15px;
            border: 1px solid #ddd;
        }}
        th {{
            background-color: #f2f2f2;
            font-weight: bold;
            text-align: left;
        }}
        tr:nth-child(even) {{
            background-color: #f9f9f9;
        }}
        .footer {{
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 0.9em;
            color: #777;
        }}
        .chart-container {{
            width: 100%;
            max-width: 600px;
            margin: 20px auto;
        }}
        .disclaimer {{
            font-style: italic;
            font-size: 0.9em;
            color: #777;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>{report_title}</h1>
"""
        
        # Process each section
        for section in template.sections:
            section_type = section.get("section_type", "")
            section_title = section.get("title", "")
            section_content = section.get("content", {})
            
            # Add section heading
            html += f"<h2>{section_title}</h2>\n"
            
            # Process section based on type
            if section_type == "header":
                # Add subtitle if present
                subtitle = section_content.get("subtitle")
                if subtitle:
                    html += f"<h3>{subtitle}</h3>\n"
                
                # Add date if requested
                if section_content.get("include_date", False):
                    date_str = datetime.datetime.now().strftime("%B %d, %Y")
                    html += f"<p>Generated on: {date_str}</p>\n"
            
            elif section_type == "text":
                # Add text content
                text = section_content.get("text", "")
                format_type = section_content.get("format", "paragraph")
                
                if format_type == "paragraph":
                    html += f"<p>{text}</p>\n"
                elif format_type == "bullet_list":
                    # Split text into bullet points
                    bullet_points = text.split('\n')
                    html += "<ul>\n"
                    for point in bullet_points:
                        if point.strip():
                            html += f"<li>{point.strip()}</li>\n"
                    html += "</ul>\n"
            
            elif section_type == "property_info":
                # Add property information
                if "property" in data:
                    property_data = data["property"]
                    fields = section_content.get("fields", [])
                    
                    html += "<table>\n"
                    for field in fields:
                        if field in property_data:
                            field_name = field.replace('_', ' ').title()
                            field_value = str(property_data[field])
                            html += f"<tr><th>{field_name}</th><td>{field_value}</td></tr>\n"
                    html += "</table>\n"
            
            elif section_type == "valuation":
                # Add valuation information
                if "property" in data:
                    property_data = data["property"]
                    fields = section_content.get("fields", [])
                    
                    html += "<table>\n"
                    for field in fields:
                        if field in property_data:
                            field_name = field.replace('_', ' ').title()
                            field_value = str(property_data[field])
                            if field.endswith('_percent'):
                                field_value = f"{field_value}%"
                            elif field.endswith('_value'):
                                field_value = f"${field_value:,}"
                            html += f"<tr><th>{field_name}</th><td>{field_value}</td></tr>\n"
                    html += "</table>\n"
                    
                    # Add chart if requested
                    if section_content.get("include_chart", False) and all(
                        k in property_data for k in ["land_value", "improvement_value"]
                    ):
                        # We'll just add a placeholder for a chart
                        # In a real implementation, you might use a JavaScript charting library
                        html += """
<div class="chart-container">
    <img src="chart-placeholder.png" alt="Value Components Chart" style="width:100%;">
    <p style="text-align:center;color:#777;">Value Components Chart</p>
</div>
"""
            
            elif section_type == "table":
                # Add generic table
                columns = section_content.get("columns", [])
                data_key = section_content.get("data_key", "")
                
                if data_key in data and columns:
                    html += "<table>\n<tr>\n"
                    
                    # Add header row
                    for col in columns:
                        header = col.replace('_', ' ').title()
                        html += f"<th>{header}</th>\n"
                    html += "</tr>\n"
                    
                    # Add data rows
                    for row in data[data_key]:
                        html += "<tr>\n"
                        for col in columns:
                            value = row.get(col, "")
                            html += f"<td>{value}</td>\n"
                        html += "</tr>\n"
                    
                    html += "</table>\n"
            
            elif section_type == "chart":
                # Add generic chart placeholder
                chart_type = section_content.get("chart_type", "bar")
                chart_title = section_content.get("chart_title", f"{chart_type.title()} Chart")
                
                # We'll just add a placeholder for a chart
                html += f"""
<div class="chart-container">
    <img src="chart-placeholder.png" alt="{chart_title}" style="width:100%;">
    <p style="text-align:center;color:#777;">{chart_title}</p>
</div>
"""
            
            elif section_type == "footer":
                # Add footer content
                html += "<div class='footer'>\n"
                
                # Add disclaimer if requested
                if section_content.get("include_disclaimer", False):
                    disclaimer = (
                        "Disclaimer: This report is generated for informational purposes only. "
                        "The information provided is based on current data and may not reflect "
                        "recent changes or updates. Please contact the Benton County Assessor's "
                        "Office for the most current information."
                    )
                    html += f"<p class='disclaimer'>{disclaimer}</p>\n"
                
                # Add contact information if requested
                if section_content.get("include_contact", False):
                    contact = (
                        "For questions or more information, please contact:<br>\n"
                        "Benton County Assessor's Office<br>\n"
                        "Phone: (555) 555-5555<br>\n"
                        "Email: assessor@bentoncounty.gov"
                    )
                    html += f"<p>{contact}</p>\n"
                
                # Add generation date if requested
                if section_content.get("include_generated_date", False):
                    date_str = datetime.datetime.now().strftime("%B %d, %Y %H:%M:%S")
                    html += f"<p><em>Generated on: {date_str}</em></p>\n"
                
                html += "</div>\n"
        
        # Finish HTML
        html += """
    </div>
</body>
</html>
"""
        
        # Write HTML to file
        with open(file_path, 'w') as f:
            f.write(html)
        
        return file_path
    
    def _generate_csv(self, template: ReportTemplate, data: Dict[str, Any], 
                     report_id: str, report_title: str) -> str:
        """
        Generate CSV report.
        
        Args:
            template: Report template
            data: Report data
            report_id: Report ID
            report_title: Report title
            
        Returns:
            Path to generated file
        """
        file_path = os.path.join(self.output_directory, f"{report_id}.csv")
        
        # Data to be exported
        export_data = []
        
        # Find relevant data for CSV export based on template type
        if template.template_type == "property_assessment" and "property" in data:
            # Export property data as a single row
            property_data = data["property"]
            export_data = [property_data]
        
        elif template.template_type == "geospatial_analysis" and "geospatial_data" in data and "properties" in data["geospatial_data"]:
            # Export properties data as rows
            export_data = data["geospatial_data"]["properties"]
        
        elif "table" in template.template_type.lower() and "data" in data:
            # Export generic table data
            export_data = data["data"]
        
        # If we found data to export, write it to CSV
        if export_data:
            try:
                # Create DataFrame and export to CSV
                df = pd.DataFrame(export_data)
                df.to_csv(file_path, index=False)
            except Exception as e:
                logger.error(f"Error creating CSV: {str(e)}")
                
                # Fallback to manual CSV creation
                headers = set()
                for row in export_data:
                    headers.update(row.keys())
                
                headers = sorted(list(headers))
                
                with open(file_path, 'w') as f:
                    # Write header
                    f.write(','.join(headers) + '\n')
                    
                    # Write data rows
                    for row in export_data:
                        values = []
                        for header in headers:
                            value = row.get(header, '')
                            # Handle values with commas
                            if isinstance(value, str) and (',' in value or '"' in value):
                                value = '"' + value.replace('"', '""') + '"'
                            values.append(str(value))
                        
                        f.write(','.join(values) + '\n')
        else:
            # Create an empty file with just a header
            with open(file_path, 'w') as f:
                f.write(f"# {report_title}\n# Generated: {datetime.datetime.now().isoformat()}\n")
        
        return file_path
    
    def _generate_json(self, template: ReportTemplate, data: Dict[str, Any], 
                      report_id: str, report_title: str) -> str:
        """
        Generate JSON report.
        
        Args:
            template: Report template
            data: Report data
            report_id: Report ID
            report_title: Report title
            
        Returns:
            Path to generated file
        """
        file_path = os.path.join(self.output_directory, f"{report_id}.json")
        
        # Prepare JSON export
        json_data = {
            "report_id": report_id,
            "title": report_title,
            "template_id": template.template_id,
            "template_name": template.name,
            "template_type": template.template_type,
            "generated_at": datetime.datetime.now().isoformat(),
            "data": data
        }
        
        # Write JSON to file
        with open(file_path, 'w') as f:
            json.dump(json_data, f, indent=2)
        
        return file_path
    
    def _generate_geojson(self, template: ReportTemplate, data: Dict[str, Any], 
                         report_id: str, report_title: str) -> str:
        """
        Generate GeoJSON report.
        
        Args:
            template: Report template
            data: Report data
            report_id: Report ID
            report_title: Report title
            
        Returns:
            Path to generated file
        """
        file_path = os.path.join(self.output_directory, f"{report_id}.geojson")
        
        # Check if we have geospatial data
        if "geospatial_data" in data and "properties" in data["geospatial_data"]:
            properties = data["geospatial_data"]["properties"]
            
            # Prepare GeoJSON feature collection
            geojson = {
                "type": "FeatureCollection",
                "features": [],
                "metadata": {
                    "report_id": report_id,
                    "title": report_title,
                    "template_id": template.template_id,
                    "template_name": template.name,
                    "template_type": template.template_type,
                    "generated_at": datetime.datetime.now().isoformat()
                }
            }
            
            # Create GeoJSON features
            for prop in properties:
                # Check if we have coordinates
                if "latitude" in prop and "longitude" in prop:
                    # Create feature
                    feature = {
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [prop["longitude"], prop["latitude"]]
                        },
                        "properties": {k: v for k, v in prop.items() if k not in ["latitude", "longitude"]}
                    }
                    
                    # Add to features
                    geojson["features"].append(feature)
            
            # Write GeoJSON to file
            with open(file_path, 'w') as f:
                json.dump(geojson, f, indent=2)
        
        else:
            # Create an empty GeoJSON feature collection
            geojson = {
                "type": "FeatureCollection",
                "features": [],
                "metadata": {
                    "report_id": report_id,
                    "title": report_title,
                    "template_id": template.template_id,
                    "template_name": template.name,
                    "template_type": template.template_type,
                    "generated_at": datetime.datetime.now().isoformat(),
                    "message": "No geospatial data available"
                }
            }
            
            # Write empty GeoJSON to file
            with open(file_path, 'w') as f:
                json.dump(geojson, f, indent=2)
        
        return file_path
    
    def _generate_excel(self, template: ReportTemplate, data: Dict[str, Any], 
                       report_id: str, report_title: str) -> str:
        """
        Generate Excel report.
        
        Args:
            template: Report template
            data: Report data
            report_id: Report ID
            report_title: Report title
            
        Returns:
            Path to generated file
        """
        file_path = os.path.join(self.output_directory, f"{report_id}.xlsx")
        
        # Create Excel writer
        writer = pd.ExcelWriter(file_path, engine='xlsxwriter')
        
        # Gather tables to export based on template sections
        tables = {}
        
        for section in template.sections:
            section_type = section.get("section_type", "")
            section_title = section.get("title", "")
            section_content = section.get("content", {})
            
            # Process section based on type to extract tabular data
            if section_type == "property_info" and "property" in data:
                # Property information as a table
                property_data = data["property"]
                fields = section_content.get("fields", [])
                
                table_data = []
                for field in fields:
                    if field in property_data:
                        field_name = field.replace('_', ' ').title()
                        field_value = property_data[field]
                        table_data.append([field_name, field_value])
                
                if table_data:
                    tables["Property Information"] = pd.DataFrame(table_data, columns=["Field", "Value"])
            
            elif section_type == "valuation" and "property" in data:
                # Valuation information as a table
                property_data = data["property"]
                fields = section_content.get("fields", [])
                
                table_data = []
                for field in fields:
                    if field in property_data:
                        field_name = field.replace('_', ' ').title()
                        field_value = property_data[field]
                        table_data.append([field_name, field_value])
                
                if table_data:
                    tables["Valuation Summary"] = pd.DataFrame(table_data, columns=["Field", "Value"])
            
            elif section_type == "table":
                # Generic table
                columns = section_content.get("columns", [])
                data_key = section_content.get("data_key", "")
                
                if data_key in data and columns:
                    # Extract data for the table
                    table_data = []
                    for row in data[data_key]:
                        table_row = []
                        for col in columns:
                            table_row.append(row.get(col, ""))
                        table_data.append(table_row)
                    
                    if table_data:
                        # Create column headers
                        headers = [col.replace('_', ' ').title() for col in columns]
                        tables[section_title] = pd.DataFrame(table_data, columns=headers)
            
            elif section_type == "comparable_properties" and "comparable_properties" in data:
                # Comparable properties table
                properties = data["comparable_properties"]
                fields = section_content.get("fields", [])
                
                if properties and fields:
                    # Extract data for the table
                    table_data = []
                    for prop in properties:
                        table_row = []
                        for field in fields:
                            table_row.append(prop.get(field, ""))
                        table_data.append(table_row)
                    
                    if table_data:
                        # Create column headers
                        headers = [field.replace('_', ' ').title() for field in fields]
                        tables["Comparable Properties"] = pd.DataFrame(table_data, columns=headers)
        
        # If no tables from sections, check for common data structures
        if not tables:
            if "property" in data:
                # Add property data as a table
                property_df = pd.DataFrame([data["property"]])
                tables["Property"] = property_df
            
            if "geospatial_data" in data and "properties" in data["geospatial_data"]:
                # Add properties as a table
                properties_df = pd.DataFrame(data["geospatial_data"]["properties"])
                tables["Properties"] = properties_df
                
                # Add areas as a table if available
                if "areas" in data["geospatial_data"]:
                    areas_df = pd.DataFrame(data["geospatial_data"]["areas"])
                    tables["Areas"] = areas_df
            
            if "area_summary" in data:
                # Add area summary as a table
                area_summary_df = pd.DataFrame(data["area_summary"])
                tables["Area Summary"] = area_summary_df
        
        # If we have tables, write them to Excel
        if tables:
            for sheet_name, df in tables.items():
                # Write dataframe to Excel
                df.to_excel(writer, sheet_name=sheet_name, index=False)
                
                # Get worksheet and workbook objects
                workbook = writer.book
                worksheet = writer.sheets[sheet_name]
                
                # Add auto-filter to the header row
                worksheet.autofilter(0, 0, 0, len(df.columns) - 1)
                
                # Set column widths
                for i, col in enumerate(df.columns):
                    # Set width based on column contents
                    max_len = max(
                        df[col].astype(str).map(len).max(),
                        len(str(col))
                    ) + 2
                    worksheet.set_column(i, i, max_len)
        
        else:
            # Create a metadata sheet
            metadata = {
                "Report ID": [report_id],
                "Title": [report_title],
                "Template ID": [template.template_id],
                "Template Name": [template.name],
                "Template Type": [template.template_type],
                "Generated At": [datetime.datetime.now().isoformat()]
            }
            metadata_df = pd.DataFrame(metadata)
            metadata_df.to_excel(writer, sheet_name="Metadata", index=False)
        
        # Save the workbook
        writer.save()
        
        return file_path


# Create singleton instance
report_generator = ReportGenerator()