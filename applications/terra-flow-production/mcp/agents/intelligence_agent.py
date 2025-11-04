"""
Intelligence Agent Module

This module implements a specialized agent for AI-powered analysis of GIS data,
natural language query processing, and automated report generation.
"""

import logging
import time
import os
import json
import tempfile
from typing import Dict, List, Any, Optional
import base64
import openai
from openai import OpenAI
from io import BytesIO

from .base_agent import BaseAgent
from ..core import mcp_instance

# Import GIS and visualization libraries only if available
try:
    import geopandas as gpd
    import matplotlib.pyplot as plt
    HAS_VIZ_LIBS = True
except ImportError:
    HAS_VIZ_LIBS = False

# Initialize OpenAI client
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
openai_client = OpenAI(api_key=OPENAI_API_KEY)

class IntelligenceAgent(BaseAgent):
    """
    Agent responsible for AI-powered GIS data analysis and intelligence
    """
    
    def __init__(self):
        """Initialize the intelligence agent"""
        super().__init__()
        self.capabilities = [
            "nlp_query_processing",
            "data_analysis",
            "pattern_recognition",
            "report_generation",
            "map_annotation"
        ]
        # Check OpenAI API key
        if not OPENAI_API_KEY:
            self.logger.warning("OPENAI_API_KEY not set, some functions will be limited")
            self.add_capability("limited_functionality")
        else:
            self.logger.info("OpenAI API key found")
        
        self.logger.info("Intelligence Agent initialized")
    
    def process_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process an intelligence task"""
        self.last_activity = time.time()
        
        if not task_data or "task_type" not in task_data:
            return {"error": "Invalid task data, missing task_type"}
        
        task_type = task_data["task_type"]
        
        if not OPENAI_API_KEY and task_type not in ["limited_functionality"]:
            return {"error": "OpenAI API key not set, cannot perform AI tasks"}
        
        if task_type == "nlp_query_processing":
            return self.process_nlp_query(task_data)
        elif task_type == "data_analysis":
            return self.analyze_data(task_data)
        elif task_type == "pattern_recognition":
            return self.recognize_patterns(task_data)
        elif task_type == "report_generation":
            return self.generate_report(task_data)
        elif task_type == "map_annotation":
            return self.annotate_map(task_data)
        else:
            return {"error": f"Unsupported task type: {task_type}"}
    
    def process_nlp_query(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process a natural language query about GIS data"""
        self.set_status("processing_query")
        
        # Required parameters
        if "query" not in task_data:
            return {"error": "Missing required parameter: query"}
        
        query = task_data["query"]
        
        # Optional parameters
        context = task_data.get("context", {})
        
        # Process query with OpenAI
        try:
            start_time = time.time()
            
            # Prepare context information
            context_str = ""
            if context:
                context_str = "Context information:\n"
                for key, value in context.items():
                    context_str += f"- {key}: {value}\n"
            
            # Create prompt for OpenAI
            prompt = f"""I need information about GIS data based on the following query:
            
Query: {query}

{context_str}

Please provide a detailed response focusing on GIS data analysis. 
Include spatial information, patterns, and relationships if relevant.
"""
            
            # Call OpenAI API
            response = openai_client.chat.completions.create(
                model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1024
            )
            
            answer = response.choices[0].message.content
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            return {
                "status": "success",
                "query": query,
                "answer": answer,
                "processing_time": processing_time
            }
            
        except Exception as e:
            self.logger.error(f"NLP query processing error: {str(e)}")
            return {"error": f"NLP query processing failed: {str(e)}"}
        finally:
            self.set_status("idle")
    
    def analyze_data(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze GIS data with AI assistance"""
        self.set_status("analyzing_data")
        
        # Required parameters
        if "input_file" not in task_data:
            return {"error": "Missing required parameter: input_file"}
        
        input_file = task_data["input_file"]
        
        # Optional parameters
        analysis_type = task_data.get("analysis_type", "general")
        questions = task_data.get("questions", [])
        
        # Validate parameters
        if not os.path.exists(input_file):
            return {"error": f"Input file does not exist: {input_file}"}
        
        # Perform analysis
        try:
            start_time = time.time()
            
            # Read the input data
            gdf = gpd.read_file(input_file)
            
            # Extract basic metadata
            file_name = os.path.basename(input_file)
            feature_count = len(gdf)
            geometry_types = list(gdf.geometry.type.unique())
            property_names = list(gdf.columns)
            
            # Generate data summary
            data_summary = {
                "file_name": file_name,
                "feature_count": feature_count,
                "geometry_types": geometry_types,
                "property_names": property_names,
                "crs": str(gdf.crs)
            }
            
            # Generate property statistics
            property_stats = {}
            for col in gdf.columns:
                if col != "geometry":
                    if gdf[col].dtype in ["int64", "float64"]:
                        property_stats[col] = {
                            "min": float(gdf[col].min()),
                            "max": float(gdf[col].max()),
                            "mean": float(gdf[col].mean()),
                            "median": float(gdf[col].median())
                        }
                    else:
                        value_counts = gdf[col].value_counts().to_dict()
                        # Convert keys to strings for JSON serialization
                        value_counts = {str(k): v for k, v in value_counts.items()}
                        property_stats[col] = {
                            "unique_values": len(value_counts),
                            "most_common": list(value_counts.items())[:5]
                        }
            
            # Generate a map preview
            map_image_base64 = None
            try:
                # Create a simple plot
                fig, ax = plt.subplots(figsize=(8, 8))
                gdf.plot(ax=ax)
                ax.set_title(f"Map Preview: {file_name}")
                
                # Save to BytesIO
                img_buffer = BytesIO()
                plt.savefig(img_buffer, format='png', dpi=100)
                img_buffer.seek(0)
                
                # Convert to base64
                map_image_base64 = base64.b64encode(img_buffer.read()).decode('utf-8')
                plt.close(fig)
            except Exception as map_error:
                self.logger.warning(f"Failed to generate map preview: {str(map_error)}")
            
            # Analyze with OpenAI if questions are provided
            ai_analysis = {}
            if questions:
                analysis_prompt = f"""I have GIS data with the following properties:
                
File: {file_name}
Feature count: {feature_count}
Geometry types: {', '.join(geometry_types)}
Properties: {', '.join(property_names)}
Coordinate system: {gdf.crs}

Statistical summary:
{json.dumps(property_stats, indent=2)}

Please answer the following questions about this GIS dataset:

{chr(10).join([f"{i+1}. {q}" for i, q in enumerate(questions)])}

Provide detailed answers for each question.
"""
                
                try:
                    response = openai_client.chat.completions.create(
                        model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
                        messages=[{"role": "user", "content": analysis_prompt}],
                        max_tokens=1500
                    )
                    
                    ai_analysis = {
                        "questions": questions,
                        "answers": response.choices[0].message.content
                    }
                except Exception as ai_error:
                    ai_analysis = {
                        "questions": questions,
                        "error": str(ai_error)
                    }
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            # Compile analysis results
            result = {
                "status": "success",
                "analysis_type": analysis_type,
                "processing_time": processing_time,
                "data_summary": data_summary,
                "property_stats": property_stats
            }
            
            if map_image_base64:
                result["map_preview"] = map_image_base64
            
            if ai_analysis:
                result["ai_analysis"] = ai_analysis
            
            return result
            
        except Exception as e:
            self.logger.error(f"Data analysis error: {str(e)}")
            return {"error": f"Data analysis failed: {str(e)}"}
        finally:
            self.set_status("idle")
    
    def recognize_patterns(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Recognize patterns in GIS data"""
        self.set_status("recognizing_patterns")
        
        # Required parameters
        if "input_file" not in task_data:
            return {"error": "Missing required parameter: input_file"}
        
        input_file = task_data["input_file"]
        
        # Optional parameters
        pattern_type = task_data.get("pattern_type", "spatial")
        properties = task_data.get("properties", [])
        
        # Validate parameters
        if not os.path.exists(input_file):
            return {"error": f"Input file does not exist: {input_file}"}
        
        # Perform pattern recognition
        try:
            start_time = time.time()
            
            # Read the input data
            gdf = gpd.read_file(input_file)
            
            patterns = []
            
            if pattern_type == "spatial" or pattern_type == "all":
                # Detect clusters (simple approach)
                # For a more sophisticated approach, we'd use DBSCAN or other clustering algorithms
                if "Point" in gdf.geometry.type.unique():
                    # For points, check if they're clustered
                    try:
                        from sklearn.cluster import DBSCAN
                        import numpy as np
                        
                        # Filter to just points
                        points_gdf = gdf[gdf.geometry.type == "Point"]
                        
                        # Extract coordinates
                        coords = np.array(
                            [(geom.x, geom.y) for geom in points_gdf.geometry]
                        )
                        
                        # Run DBSCAN
                        db = DBSCAN(eps=0.01, min_samples=3).fit(coords)
                        labels = db.labels_
                        
                        # Count clusters (excluding noise points labeled as -1)
                        n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
                        
                        if n_clusters > 0:
                            patterns.append({
                                "type": "spatial_clustering",
                                "description": f"Detected {n_clusters} spatial clusters of points",
                                "details": {
                                    "cluster_count": n_clusters,
                                    "points_in_clusters": int(sum(labels != -1)),
                                    "noise_points": int(sum(labels == -1))
                                }
                            })
                    except Exception as cluster_error:
                        self.logger.warning(f"Clustering analysis failed: {str(cluster_error)}")
            
            if pattern_type == "attribute" or pattern_type == "all":
                # Check for correlations between numeric properties
                numeric_props = []
                for col in gdf.columns:
                    if col != "geometry" and gdf[col].dtype in ["int64", "float64"]:
                        numeric_props.append(col)
                
                if len(numeric_props) >= 2:
                    try:
                        # Calculate correlation matrix
                        corr_matrix = gdf[numeric_props].corr()
                        
                        # Find strong correlations (absolute value > 0.7)
                        strong_corrs = []
                        for i, prop1 in enumerate(numeric_props):
                            for j, prop2 in enumerate(numeric_props):
                                if i < j:  # Only check each pair once
                                    corr = corr_matrix.loc[prop1, prop2]
                                    if abs(corr) > 0.7:
                                        strong_corrs.append({
                                            "property1": prop1,
                                            "property2": prop2,
                                            "correlation": float(corr)
                                        })
                        
                        if strong_corrs:
                            patterns.append({
                                "type": "attribute_correlation",
                                "description": f"Found {len(strong_corrs)} strong correlations between properties",
                                "details": {
                                    "correlations": strong_corrs
                                }
                            })
                    except Exception as corr_error:
                        self.logger.warning(f"Correlation analysis failed: {str(corr_error)}")
            
            # Use OpenAI to analyze patterns
            if (pattern_type != "attribute" and pattern_type != "spatial") or not patterns:
                # Generate a summary for OpenAI
                properties_summary = ""
                for col in gdf.columns:
                    if col != "geometry":
                        if gdf[col].dtype in ["int64", "float64"]:
                            properties_summary += f"- {col}: numeric, range {gdf[col].min()} to {gdf[col].max()}, mean {gdf[col].mean():.2f}\n"
                        else:
                            unique_vals = gdf[col].nunique()
                            properties_summary += f"- {col}: categorical, {unique_vals} unique values\n"
                
                # Create prompt for OpenAI
                prompt = f"""I have a GIS dataset with the following characteristics:
                
File: {os.path.basename(input_file)}
Feature count: {len(gdf)}
Geometry types: {', '.join(gdf.geometry.type.unique())}
Coordinate system: {gdf.crs}

Properties:
{properties_summary}

Based on this information, what patterns might exist in this data? 
Consider spatial patterns, attribute patterns, and any other insights that might be valuable.
Focus on providing specific, actionable insights rather than general observations.
"""
                
                try:
                    response = openai_client.chat.completions.create(
                        model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
                        messages=[{"role": "user", "content": prompt}],
                        max_tokens=1200
                    )
                    
                    patterns.append({
                        "type": "ai_insights",
                        "description": "AI-generated insights about potential patterns",
                        "details": {
                            "insights": response.choices[0].message.content
                        }
                    })
                except Exception as ai_error:
                    self.logger.warning(f"AI pattern analysis failed: {str(ai_error)}")
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            return {
                "status": "success",
                "pattern_type": pattern_type,
                "processing_time": processing_time,
                "patterns": patterns,
                "feature_count": len(gdf)
            }
            
        except Exception as e:
            self.logger.error(f"Pattern recognition error: {str(e)}")
            return {"error": f"Pattern recognition failed: {str(e)}"}
        finally:
            self.set_status("idle")
    
    def generate_report(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a report based on GIS data analysis"""
        self.set_status("generating_report")
        
        # Required parameters
        if "input_file" not in task_data:
            return {"error": "Missing required parameter: input_file"}
        
        input_file = task_data["input_file"]
        
        # Optional parameters
        report_type = task_data.get("report_type", "summary")
        output_format = task_data.get("output_format", "html")
        title = task_data.get("title", f"GIS Report: {os.path.basename(input_file)}")
        
        # Validate parameters
        if not os.path.exists(input_file):
            return {"error": f"Input file does not exist: {input_file}"}
        
        # Set up output file
        output_file = task_data.get("output_file")
        if not output_file:
            base_name = os.path.splitext(input_file)[0]
            output_file = f"{base_name}_report.{output_format}"
        
        # Generate report
        try:
            start_time = time.time()
            
            # Read the input data
            gdf = gpd.read_file(input_file)
            
            # Generate data summary
            data_summary = {
                "file_name": os.path.basename(input_file),
                "feature_count": len(gdf),
                "geometry_types": list(gdf.geometry.type.unique()),
                "property_names": list(gdf.columns),
                "crs": str(gdf.crs)
            }
            
            # Generate property statistics
            property_stats = {}
            for col in gdf.columns:
                if col != "geometry":
                    if gdf[col].dtype in ["int64", "float64"]:
                        property_stats[col] = {
                            "min": float(gdf[col].min()),
                            "max": float(gdf[col].max()),
                            "mean": float(gdf[col].mean()),
                            "median": float(gdf[col].median())
                        }
                    else:
                        value_counts = gdf[col].value_counts().to_dict()
                        # Convert keys to strings for JSON serialization
                        value_counts = {str(k): v for k, v in value_counts.items()}
                        property_stats[col] = {
                            "unique_values": len(value_counts),
                            "most_common": list(value_counts.items())[:5]
                        }
            
            # Generate map image
            fig, ax = plt.subplots(figsize=(10, 10))
            gdf.plot(ax=ax)
            ax.set_title(f"Map Overview: {os.path.basename(input_file)}")
            
            # Save to BytesIO
            map_img_buffer = BytesIO()
            plt.savefig(map_img_buffer, format='png', dpi=100)
            map_img_buffer.seek(0)
            
            # Convert to base64
            map_image_base64 = base64.b64encode(map_img_buffer.read()).decode('utf-8')
            plt.close(fig)
            
            # If detailed report, generate additional visualizations
            additional_visualizations = []
            if report_type == "detailed":
                # Generate a few visualizations for numeric properties
                numeric_cols = [col for col in gdf.columns if col != "geometry" and gdf[col].dtype in ["int64", "float64"]]
                
                for i, col in enumerate(numeric_cols[:3]):  # Limit to first 3 numeric columns
                    try:
                        # Create histogram
                        fig, ax = plt.subplots(figsize=(8, 6))
                        gdf[col].hist(ax=ax, bins=20)
                        ax.set_title(f"Distribution of {col}")
                        ax.set_xlabel(col)
                        ax.set_ylabel("Frequency")
                        
                        # Save to BytesIO
                        img_buffer = BytesIO()
                        plt.savefig(img_buffer, format='png', dpi=100)
                        img_buffer.seek(0)
                        
                        # Convert to base64
                        img_base64 = base64.b64encode(img_buffer.read()).decode('utf-8')
                        plt.close(fig)
                        
                        additional_visualizations.append({
                            "title": f"Distribution of {col}",
                            "image": img_base64,
                            "description": f"Histogram showing the distribution of values for the {col} property."
                        })
                    except Exception as viz_error:
                        self.logger.warning(f"Failed to generate visualization for {col}: {str(viz_error)}")
            
            # Generate report content using OpenAI
            report_content_prompt = f"""I need to generate a {'detailed' if report_type == 'detailed' else 'summary'} report for a GIS dataset with the following characteristics:
            
File: {data_summary['file_name']}
Feature count: {data_summary['feature_count']}
Geometry types: {', '.join(data_summary['geometry_types'])}
Coordinate system: {data_summary['crs']}
Properties: {', '.join(data_summary['property_names'])}

Property statistics:
{json.dumps(property_stats, indent=2)}

Please generate a comprehensive report that includes:
1. An executive summary
2. Key insights about the data
3. Recommendations for further analysis
4. Conclusion

The report should be in {'HTML' if output_format == 'html' else 'Markdown'} format.
"""
            
            response = openai_client.chat.completions.create(
                model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
                messages=[{"role": "user", "content": report_content_prompt}],
                max_tokens=2000
            )
            
            report_content = response.choices[0].message.content
            
            # Generate the actual report
            if output_format == "html":
                html_report = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; color: #333; }}
        .container {{ max-width: 1200px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #2c3e50; color: white; padding: 20px; text-align: center; }}
        .section {{ margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }}
        .map-container {{ text-align: center; margin: 20px 0; }}
        .map-container img {{ max-width: 100%; height: auto; border: 1px solid #ddd; }}
        table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #f2f2f2; }}
        .visualization {{ margin: 30px 0; text-align: center; }}
        .visualization img {{ max-width: 100%; height: auto; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>{title}</h1>
        <p>Generated on {time.strftime('%Y-%m-%d %H:%M:%S')}</p>
    </div>
    
    <div class="container">
        <div class="section">
            <h2>Dataset Overview</h2>
            <table>
                <tr><th>File Name</th><td>{data_summary['file_name']}</td></tr>
                <tr><th>Feature Count</th><td>{data_summary['feature_count']}</td></tr>
                <tr><th>Geometry Types</th><td>{', '.join(data_summary['geometry_types'])}</td></tr>
                <tr><th>Coordinate System</th><td>{data_summary['crs']}</td></tr>
                <tr><th>Properties</th><td>{', '.join(data_summary['property_names'])}</td></tr>
            </table>
        </div>
        
        <div class="section">
            <h2>Map Overview</h2>
            <div class="map-container">
                <img src="data:image/png;base64,{map_image_base64}" alt="Map Overview">
            </div>
        </div>
"""
                
                # Add property statistics
                html_report += """
        <div class="section">
            <h2>Property Statistics</h2>
            <table>
                <tr><th>Property</th><th>Type</th><th>Statistics</th></tr>
"""
                
                for prop, stats in property_stats.items():
                    if "min" in stats:  # Numeric property
                        stats_str = f"Min: {stats['min']}, Max: {stats['max']}, Mean: {stats['mean']:.2f}, Median: {stats['median']:.2f}"
                        html_report += f"<tr><td>{prop}</td><td>Numeric</td><td>{stats_str}</td></tr>\n"
                    else:  # Categorical property
                        most_common_str = ", ".join([f"{k}: {v}" for k, v in stats['most_common']])
                        html_report += f"<tr><td>{prop}</td><td>Categorical ({stats['unique_values']} unique values)</td><td>Most common: {most_common_str}</td></tr>\n"
                
                html_report += """
            </table>
        </div>
"""
                
                # Add additional visualizations if detailed report
                if additional_visualizations:
                    html_report += """
        <div class="section">
            <h2>Visualizations</h2>
"""
                    
                    for viz in additional_visualizations:
                        html_report += f"""
            <div class="visualization">
                <h3>{viz['title']}</h3>
                <img src="data:image/png;base64,{viz['image']}" alt="{viz['title']}">
                <p>{viz['description']}</p>
            </div>
"""
                    
                    html_report += """
        </div>
"""
                
                # Add AI-generated content
                html_report += f"""
        <div class="section">
            <h2>Report Content</h2>
            {report_content}
        </div>
        
        <div class="section">
            <h2>About This Report</h2>
            <p>This report was automatically generated by the Benton County GIS Intelligence Agent.</p>
            <p>Generated on {time.strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
    </div>
</body>
</html>
"""
                
                # Write the report to file
                with open(output_file, 'w') as f:
                    f.write(html_report)
            
            elif output_format == "md":
                # Generate Markdown report
                md_report = f"""# {title}

*Generated on {time.strftime('%Y-%m-%d %H:%M:%S')}*

## Dataset Overview

- **File Name**: {data_summary['file_name']}
- **Feature Count**: {data_summary['feature_count']}
- **Geometry Types**: {', '.join(data_summary['geometry_types'])}
- **Coordinate System**: {data_summary['crs']}
- **Properties**: {', '.join(data_summary['property_names'])}

## Map Overview

![Map Overview](data:image/png;base64,{map_image_base64})

## Property Statistics

"""
                
                for prop, stats in property_stats.items():
                    md_report += f"### {prop}\n\n"
                    if "min" in stats:  # Numeric property
                        md_report += f"- **Type**: Numeric\n"
                        md_report += f"- **Minimum**: {stats['min']}\n"
                        md_report += f"- **Maximum**: {stats['max']}\n"
                        md_report += f"- **Mean**: {stats['mean']:.2f}\n"
                        md_report += f"- **Median**: {stats['median']:.2f}\n\n"
                    else:  # Categorical property
                        md_report += f"- **Type**: Categorical ({stats['unique_values']} unique values)\n"
                        md_report += "- **Most Common Values**:\n"
                        for k, v in stats['most_common']:
                            md_report += f"  - {k}: {v}\n"
                        md_report += "\n"
                
                # Add additional visualizations if detailed report
                if additional_visualizations:
                    md_report += "## Visualizations\n\n"
                    
                    for viz in additional_visualizations:
                        md_report += f"### {viz['title']}\n\n"
                        md_report += f"![{viz['title']}](data:image/png;base64,{viz['image']})\n\n"
                        md_report += f"{viz['description']}\n\n"
                
                # Add AI-generated content
                md_report += f"""## Report Content

{report_content}

## About This Report

This report was automatically generated by the Benton County GIS Intelligence Agent.

*Generated on {time.strftime('%Y-%m-%d %H:%M:%S')}*
"""
                
                # Write the report to file
                with open(output_file, 'w') as f:
                    f.write(md_report)
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            return {
                "status": "success",
                "report_type": report_type,
                "output_format": output_format,
                "output_file": output_file,
                "processing_time": processing_time
            }
            
        except Exception as e:
            self.logger.error(f"Report generation error: {str(e)}")
            return {"error": f"Report generation failed: {str(e)}"}
        finally:
            self.set_status("idle")
    
    def annotate_map(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Automatically annotate a map with AI-generated insights"""
        self.set_status("annotating_map")
        
        # Required parameters
        if "input_file" not in task_data:
            return {"error": "Missing required parameter: input_file"}
        
        input_file = task_data["input_file"]
        
        # Optional parameters
        output_file = task_data.get("output_file")
        if not output_file:
            base_name = os.path.splitext(input_file)[0]
            output_file = f"{base_name}_annotated.png"
        
        # Validate parameters
        if not os.path.exists(input_file):
            return {"error": f"Input file does not exist: {input_file}"}
        
        # Generate annotated map
        try:
            start_time = time.time()
            
            # Read the input data
            gdf = gpd.read_file(input_file)
            
            # Generate data summary for AI
            data_summary = {
                "file_name": os.path.basename(input_file),
                "feature_count": len(gdf),
                "geometry_types": list(gdf.geometry.type.unique()),
                "property_names": list(gdf.columns),
                "crs": str(gdf.crs)
            }
            
            # If there are numeric columns, find the one that might be most interesting
            numeric_cols = [col for col in gdf.columns if col != "geometry" and gdf[col].dtype in ["int64", "float64"]]
            highlight_col = None
            if numeric_cols:
                # Use the column with the highest coefficient of variation
                cv_values = {}
                for col in numeric_cols:
                    mean = gdf[col].mean()
                    std = gdf[col].std()
                    if mean != 0:
                        cv = std / mean
                        cv_values[col] = abs(cv)
                
                if cv_values:
                    highlight_col = max(cv_values, key=cv_values.get)
            
            # Generate map with annotations
            fig, ax = plt.subplots(figsize=(12, 12))
            
            # Base map
            if highlight_col:
                gdf.plot(column=highlight_col, cmap='viridis', legend=True, ax=ax)
                ax.set_title(f"Annotated Map: {os.path.basename(input_file)} (colored by {highlight_col})")
            else:
                gdf.plot(ax=ax)
                ax.set_title(f"Annotated Map: {os.path.basename(input_file)}")
            
            # Add annotations with OpenAI
            prompt = f"""I have a GIS dataset with the following characteristics:
            
File: {data_summary['file_name']}
Feature count: {data_summary['feature_count']}
Geometry types: {', '.join(data_summary['geometry_types'])}
Coordinate system: {data_summary['crs']}
Properties: {', '.join(data_summary['property_names'])}

I want to create 3-5 helpful map annotations that highlight interesting aspects of this data.
Each annotation should be short (10-15 words) and highlight a specific insight or feature.

Format your response as a JSON array of objects, where each object has:
1. "text" - The annotation text
2. "importance" - A number from 1-5 indicating how important this annotation is

Example:
[
  {{"text": "Dense cluster of residential parcels in northwest", "importance": 4}},
  {{"text": "Commercial corridor follows main highway", "importance": 3}},
  {{"text": "Flood zone boundary visible along river", "importance": 5}}
]
"""
            
            try:
                response = openai_client.chat.completions.create(
                    model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"},
                    max_tokens=800
                )
                
                # Parse the JSON response
                annotations = json.loads(response.choices[0].message.content)
                
                # Generate positions for annotations
                # This is a simple approach; more sophisticated approaches would analyze the geometry
                import random
                bounds = gdf.total_bounds  # (minx, miny, maxx, maxy)
                width = bounds[2] - bounds[0]
                height = bounds[3] - bounds[1]
                
                # Add annotations to the map
                for i, anno in enumerate(annotations):
                    # Generate a position (simple approach)
                    x = bounds[0] + (0.2 + 0.6 * random.random()) * width
                    y = bounds[1] + (0.2 + 0.6 * random.random()) * height
                    
                    # Text properties based on importance
                    fontsize = 8 + anno["importance"]
                    alpha = 0.5 + 0.1 * anno["importance"]
                    
                    # Add text to map
                    ax.annotate(
                        anno["text"],
                        xy=(x, y),
                        xytext=(0, 0),
                        textcoords="offset points",
                        ha='center',
                        va='center',
                        fontsize=fontsize,
                        color='white',
                        bbox=dict(
                            boxstyle="round,pad=0.3",
                            fc='black',
                            ec="none",
                            alpha=alpha
                        )
                    )
            
            except Exception as anno_error:
                self.logger.warning(f"Failed to generate annotations: {str(anno_error)}")
                ax.annotate(
                    "Automated annotations unavailable",
                    xy=(0.5, 0.95),
                    xycoords='axes fraction',
                    ha='center',
                    fontsize=12,
                    bbox=dict(boxstyle="round,pad=0.3", fc='white', ec="gray", alpha=0.8)
                )
            
            # Add scale bar and north arrow
            # North arrow
            arrow_x, arrow_y = 0.95, 0.05
            ax.annotate(
                'N',
                xy=(arrow_x, arrow_y),
                xycoords='axes fraction',
                ha='center',
                va='center',
                fontsize=12,
                weight='bold'
            )
            ax.annotate(
                '↑',
                xy=(arrow_x, arrow_y - 0.02),
                xycoords='axes fraction',
                ha='center',
                va='bottom',
                fontsize=16,
                weight='bold'
            )
            
            # Add a caption
            ax.annotate(
                f"Automatically generated by Benton County GIS Intelligence Agent • {time.strftime('%Y-%m-%d')}",
                xy=(0.5, 0.01),
                xycoords='axes fraction',
                ha='center',
                fontsize=8,
                style='italic'
            )
            
            # Save the map
            plt.tight_layout()
            plt.savefig(output_file, dpi=300, bbox_inches='tight')
            plt.close(fig)
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            return {
                "status": "success",
                "output_file": output_file,
                "processing_time": processing_time,
                "highlight_column": highlight_col
            }
            
        except Exception as e:
            self.logger.error(f"Map annotation error: {str(e)}")
            return {"error": f"Map annotation failed: {str(e)}"}
        finally:
            self.set_status("idle")

# Register this agent with the MCP
mcp_instance.register_agent("intelligence", IntelligenceAgent())