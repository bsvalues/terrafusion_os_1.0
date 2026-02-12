#!/usr/bin/env python3
"""
Shared Database Health Monitor

This script provides real-time monitoring of the shared Supabase database,
checking for:
- Connection status
- Query performance
- Resource usage
- Storage utilization
- Access patterns

It can be run as a standalone tool or scheduled as a cron job.
"""

import os
import sys
import logging
import time
import json
import argparse
import datetime
from typing import Dict, Any, List, Optional, Tuple

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("db_health")

# Add parent directory to path to import shared modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Try to import supabase
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    logger.error("❌ Supabase package not installed. Install with: pip install supabase")

# Try to import colorama for colored output
try:
    from colorama import init, Fore, Back, Style
    init(autoreset=True)
    HAS_COLORS = True
except ImportError:
    HAS_COLORS = False
    # Stub color objects
    class DummyColor:
        def __getattr__(self, name):
            return ""
    Fore = DummyColor()
    Back = DummyColor()
    Style = DummyColor()

def print_header(title: str) -> None:
    """Print a formatted header."""
    if HAS_COLORS:
        print(f"\n{Fore.CYAN}{Style.BRIGHT}{'=' * 70}")
        print(f"{Fore.CYAN}{Style.BRIGHT}  {title}")
        print(f"{Fore.CYAN}{Style.BRIGHT}{'=' * 70}{Style.RESET_ALL}\n")
    else:
        print(f"\n{'=' * 70}")
        print(f"  {title}")
        print(f"{'=' * 70}\n")

def print_status(name: str, status: str, message: str = "") -> None:
    """Print a status line."""
    status_str = f"[{status.upper()}]"
    
    if HAS_COLORS:
        if status.lower() == "ok":
            status_color = f"{Fore.GREEN}{Style.BRIGHT}{status_str}{Style.RESET_ALL}"
        elif status.lower() == "warning":
            status_color = f"{Fore.YELLOW}{Style.BRIGHT}{status_str}{Style.RESET_ALL}"
        elif status.lower() == "error":
            status_color = f"{Fore.RED}{Style.BRIGHT}{status_str}{Style.RESET_ALL}"
        else:
            status_color = status_str
        
        print(f"  {name.ljust(30)} {status_color}  {message}")
    else:
        print(f"  {name.ljust(30)} {status_str}  {message}")

def get_supabase_client(url: str, key: str) -> Optional[Client]:
    """Get a Supabase client."""
    if not SUPABASE_AVAILABLE:
        logger.error("Supabase package is not available")
        return None
    
    try:
        client = create_client(url, key)
        
        # Set application name for audit logging
        try:
            client.sql("SET app.service_name TO 'db_health_monitor';").execute()
        except Exception as e:
            logger.warning(f"Could not set app.service_name: {str(e)}")
        
        return client
    except Exception as e:
        logger.error(f"Error creating Supabase client: {str(e)}")
        return None

def check_connection(client: Client) -> Tuple[bool, float]:
    """
    Check connection to the database.
    
    Returns:
        Tuple of (success, latency_ms)
    """
    try:
        start_time = time.time()
        response = client.table('information_schema.tables').select('table_name').limit(1).execute()
        end_time = time.time()
        
        latency_ms = (end_time - start_time) * 1000
        
        return True, latency_ms
    except Exception as e:
        logger.error(f"Connection check failed: {str(e)}")
        return False, 0

def check_query_performance(client: Client) -> Dict[str, Any]:
    """
    Check query performance.
    
    Returns:
        Dictionary with query performance metrics
    """
    try:
        query = """
        SELECT
            calls,
            total_exec_time / calls as avg_exec_time,
            mean_exec_time,
            max_exec_time,
            rows / calls as avg_rows,
            query
        FROM
            pg_stat_statements
        ORDER BY
            total_exec_time DESC
        LIMIT 5;
        """
        
        response = client.sql(query).execute()
        
        return {
            "success": True,
            "top_queries": response.data if hasattr(response, 'data') else []
        }
    except Exception as e:
        logger.error(f"Query performance check failed: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

def check_table_stats(client: Client) -> Dict[str, Any]:
    """
    Check table statistics.
    
    Returns:
        Dictionary with table statistics
    """
    try:
        query = """
        SELECT
            schemaname,
            relname as table_name,
            n_live_tup as row_count,
            n_dead_tup as dead_rows,
            last_vacuum,
            last_analyze
        FROM
            pg_stat_user_tables
        ORDER BY
            n_live_tup DESC
        LIMIT 10;
        """
        
        response = client.sql(query).execute()
        
        return {
            "success": True,
            "tables": response.data if hasattr(response, 'data') else []
        }
    except Exception as e:
        logger.error(f"Table stats check failed: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

def check_storage_usage(client: Client) -> Dict[str, Any]:
    """
    Check storage bucket usage.
    
    Returns:
        Dictionary with storage usage information
    """
    try:
        # Get buckets
        response = client.storage.list_buckets()
        
        if not hasattr(response, 'data'):
            return {
                "success": False,
                "error": "Invalid response from storage API"
            }
        
        buckets = response.data
        
        # Get file counts and sizes for each bucket
        buckets_info = []
        for bucket in buckets:
            try:
                files_response = client.storage.from_(bucket['name']).list()
                files = files_response if isinstance(files_response, list) else []
                
                # Calculate total size
                total_size = sum(file.get('metadata', {}).get('size', 0) for file in files)
                
                buckets_info.append({
                    "name": bucket['name'],
                    "file_count": len(files),
                    "total_size_bytes": total_size,
                    "total_size_mb": round(total_size / (1024 * 1024), 2) if total_size > 0 else 0
                })
            except Exception as e:
                logger.warning(f"Could not check bucket {bucket['name']}: {str(e)}")
        
        return {
            "success": True,
            "buckets": buckets_info
        }
    except Exception as e:
        logger.error(f"Storage usage check failed: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

def check_schema_sizes(client: Client) -> Dict[str, Any]:
    """
    Check schema sizes.
    
    Returns:
        Dictionary with schema size information
    """
    try:
        query = """
        SELECT
            schemaname,
            pg_size_pretty(sum(pg_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename)))::bigint) as schema_size,
            sum(pg_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename)))::bigint as size_bytes
        FROM
            pg_tables
        GROUP BY
            schemaname
        ORDER BY
            sum(pg_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename)))::bigint DESC;
        """
        
        response = client.sql(query).execute()
        
        return {
            "success": True,
            "schemas": response.data if hasattr(response, 'data') else []
        }
    except Exception as e:
        logger.error(f"Schema size check failed: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

def check_active_connections(client: Client) -> Dict[str, Any]:
    """
    Check active database connections.
    
    Returns:
        Dictionary with connection information
    """
    try:
        query = """
        SELECT
            application_name,
            count(*) as connection_count,
            string_agg(state, ', ' ORDER BY state) as states
        FROM
            pg_stat_activity
        WHERE
            datname = current_database()
        GROUP BY
            application_name
        ORDER BY
            count(*) DESC;
        """
        
        response = client.sql(query).execute()
        
        if not hasattr(response, 'data'):
            return {
                "success": False,
                "error": "Invalid response"
            }
        
        connections = response.data
        
        # Count total
        total_connections = sum(conn.get('connection_count', 0) for conn in connections)
        
        return {
            "success": True,
            "connections": connections,
            "total": total_connections
        }
    except Exception as e:
        logger.error(f"Active connections check failed: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

def check_recent_errors(client: Client) -> Dict[str, Any]:
    """
    Check for recent errors in the audit log.
    
    Returns:
        Dictionary with error information
    """
    try:
        query = """
        SELECT
            service_name,
            operation,
            count(*) as error_count
        FROM
            audit.logs
        WHERE
            timestamp > now() - interval '24 hours'
            AND (new_data->>'error' IS NOT NULL OR old_data->>'error' IS NOT NULL)
        GROUP BY
            service_name, operation
        ORDER BY
            count(*) DESC
        LIMIT 10;
        """
        
        response = client.sql(query).execute()
        
        return {
            "success": True,
            "errors": response.data if hasattr(response, 'data') else []
        }
    except Exception as e:
        logger.error(f"Recent errors check failed: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

def run_health_check(client: Client, output_format: str = "text", output_file: Optional[str] = None) -> Dict[str, Any]:
    """
    Run a complete health check.
    
    Args:
        client: Supabase client
        output_format: Output format (text, json, or html)
        output_file: Optional file to write output to
        
    Returns:
        Dictionary with all health check results
    """
    results = {
        "timestamp": datetime.datetime.now().isoformat(),
        "checks": {}
    }
    
    # Check 1: Connection
    print_header("Connection Check")
    connection_ok, latency_ms = check_connection(client)
    results["checks"]["connection"] = {
        "status": "ok" if connection_ok else "error",
        "latency_ms": latency_ms
    }
    print_status("Database Connection", "ok" if connection_ok else "error", 
                f"Latency: {latency_ms:.2f}ms")
    
    # Check 2: Active Connections
    print_header("Active Connections")
    connections = check_active_connections(client)
    results["checks"]["active_connections"] = connections
    
    if connections["success"]:
        print_status("Total Connections", "ok", f"Count: {connections.get('total', 0)}")
        for conn in connections.get("connections", []):
            print_status(f"  {conn.get('application_name', 'Unknown')}", "ok", 
                        f"Count: {conn.get('connection_count', 0)}, States: {conn.get('states', 'unknown')}")
    else:
        print_status("Active Connections", "error", connections.get("error", "Unknown error"))
    
    # Check 3: Schema Sizes
    print_header("Schema Sizes")
    schema_sizes = check_schema_sizes(client)
    results["checks"]["schema_sizes"] = schema_sizes
    
    if schema_sizes["success"]:
        for schema in schema_sizes.get("schemas", []):
            schema_name = schema.get("schemaname", "Unknown")
            schema_size = schema.get("schema_size", "0 bytes")
            size_bytes = schema.get("size_bytes", 0)
            
            # Determine status based on size
            status = "ok"
            if size_bytes > 1000000000:  # 1GB
                status = "warning"
            
            print_status(schema_name, status, f"Size: {schema_size}")
    else:
        print_status("Schema Sizes", "error", schema_sizes.get("error", "Unknown error"))
    
    # Check 4: Storage Usage
    print_header("Storage Usage")
    storage = check_storage_usage(client)
    results["checks"]["storage"] = storage
    
    if storage["success"]:
        for bucket in storage.get("buckets", []):
            bucket_name = bucket.get("name", "Unknown")
            file_count = bucket.get("file_count", 0)
            size_mb = bucket.get("total_size_mb", 0)
            
            # Determine status based on size
            status = "ok"
            if size_mb > 1000:  # 1GB
                status = "warning"
            
            print_status(bucket_name, status, f"Files: {file_count}, Size: {size_mb} MB")
    else:
        print_status("Storage Usage", "error", storage.get("error", "Unknown error"))
    
    # Check 5: Table Statistics
    print_header("Table Statistics")
    table_stats = check_table_stats(client)
    results["checks"]["table_stats"] = table_stats
    
    if table_stats["success"]:
        for table in table_stats.get("tables", [])[:5]:  # Show top 5
            table_name = f"{table.get('schemaname', 'unknown')}.{table.get('table_name', 'unknown')}"
            row_count = table.get("row_count", 0)
            dead_rows = table.get("dead_rows", 0)
            
            # Calculate dead row percentage
            dead_pct = (dead_rows / row_count * 100) if row_count > 0 else 0
            
            # Determine status based on dead rows
            status = "ok"
            if dead_pct > 10:
                status = "warning"
            elif dead_pct > 20:
                status = "error"
            
            print_status(table_name, status, 
                        f"Rows: {row_count}, Dead: {dead_rows} ({dead_pct:.1f}%)")
    else:
        print_status("Table Statistics", "error", table_stats.get("error", "Unknown error"))
    
    # Check 6: Query Performance
    print_header("Query Performance")
    query_perf = check_query_performance(client)
    results["checks"]["query_performance"] = query_perf
    
    if query_perf["success"]:
        for i, query in enumerate(query_perf.get("top_queries", [])[:5]):  # Show top 5
            query_text = query.get("query", "Unknown")[:50] + "..."  # Truncate for display
            avg_time = query.get("avg_exec_time", 0)
            max_time = query.get("max_exec_time", 0)
            
            # Determine status based on execution time
            status = "ok"
            if avg_time > 100:  # 100ms
                status = "warning"
            elif avg_time > 1000:  # 1s
                status = "error"
            
            print_status(f"Query #{i+1}", status, 
                        f"Avg: {avg_time:.2f}ms, Max: {max_time:.2f}ms")
    else:
        print_status("Query Performance", "error", query_perf.get("error", "Unknown error"))
    
    # Check 7: Recent Errors
    print_header("Recent Errors (24h)")
    errors = check_recent_errors(client)
    results["checks"]["recent_errors"] = errors
    
    if errors["success"]:
        if not errors.get("errors"):
            print_status("Recent Errors", "ok", "No errors in the last 24 hours")
        else:
            for error in errors.get("errors", []):
                service = error.get("service_name", "Unknown")
                operation = error.get("operation", "Unknown")
                count = error.get("error_count", 0)
                
                # Determine status based on error count
                status = "warning"
                if count > 10:
                    status = "error"
                
                print_status(f"{service} - {operation}", status, f"Count: {count}")
    else:
        print_status("Recent Errors", "error", errors.get("error", "Unknown error"))
    
    # Create summary
    overall_status = "ok"
    issues = []
    
    for check, data in results["checks"].items():
        if check == "connection" and data["status"] != "ok":
            overall_status = "error"
            issues.append(f"Database connection failed")
        elif "success" in data and not data["success"]:
            if overall_status != "error":
                overall_status = "warning"
            issues.append(f"{check} check failed: {data.get('error', 'Unknown error')}")
    
    results["overall_status"] = overall_status
    results["issues"] = issues
    
    # Print summary
    print_header("Health Check Summary")
    print_status("Overall Status", overall_status, 
                f"{len(issues)} issues found" if issues else "All checks passed")
    
    for issue in issues:
        print(f"  - {issue}")
    
    # Output results if requested
    if output_file:
        try:
            with open(output_file, 'w') as f:
                if output_format == "json":
                    json.dump(results, f, indent=2)
                elif output_format == "html":
                    # Simple HTML report
                    html = """<!DOCTYPE html>
<html>
<head>
    <title>Database Health Check Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1, h2 { color: #333; }
        .ok { color: green; }
        .warning { color: orange; }
        .error { color: red; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        tr:nth-child(even) { background-color: #f9f9f9; }
    </style>
</head>
<body>
    <h1>Database Health Check Report</h1>
    <p>Generated on: """ + results["timestamp"] + """</p>
    
    <h2>Summary</h2>
    <p class='""" + overall_status + """'>Overall Status: """ + overall_status.upper() + """</p>
    """
                    
                    if issues:
                        html += "<h3>Issues Found:</h3><ul>"
                        for issue in issues:
                            html += f"<li>{issue}</li>"
                        html += "</ul>"
                    else:
                        html += "<p>All checks passed!</p>"
                    
                    # Add sections for each check
                    for check_name, check_data in results["checks"].items():
                        html += f"<h2>{check_name.replace('_', ' ').title()}</h2>"
                        
                        if check_name == "connection":
                            status_class = "ok" if check_data["status"] == "ok" else "error"
                            html += f"<p class='{status_class}'>Status: {check_data['status'].upper()}</p>"
                            html += f"<p>Latency: {check_data['latency_ms']:.2f}ms</p>"
                        
                        elif check_name == "active_connections" and check_data["success"]:
                            html += f"<p>Total Connections: {check_data.get('total', 0)}</p>"
                            html += "<table><tr><th>Application</th><th>Count</th><th>States</th></tr>"
                            for conn in check_data.get("connections", []):
                                html += f"<tr><td>{conn.get('application_name', 'Unknown')}</td>"
                                html += f"<td>{conn.get('connection_count', 0)}</td>"
                                html += f"<td>{conn.get('states', 'unknown')}</td></tr>"
                            html += "</table>"
                        
                        elif check_name == "schema_sizes" and check_data["success"]:
                            html += "<table><tr><th>Schema</th><th>Size</th></tr>"
                            for schema in check_data.get("schemas", []):
                                html += f"<tr><td>{schema.get('schemaname', 'Unknown')}</td>"
                                html += f"<td>{schema.get('schema_size', '0 bytes')}</td></tr>"
                            html += "</table>"
                        
                        elif check_name == "storage" and check_data["success"]:
                            html += "<table><tr><th>Bucket</th><th>Files</th><th>Size</th></tr>"
                            for bucket in check_data.get("buckets", []):
                                html += f"<tr><td>{bucket.get('name', 'Unknown')}</td>"
                                html += f"<td>{bucket.get('file_count', 0)}</td>"
                                html += f"<td>{bucket.get('total_size_mb', 0)} MB</td></tr>"
                            html += "</table>"
                        
                        elif check_name == "table_stats" and check_data["success"]:
                            html += "<table><tr><th>Table</th><th>Rows</th><th>Dead Rows</th><th>Last Vacuum</th></tr>"
                            for table in check_data.get("tables", []):
                                table_name = f"{table.get('schemaname', 'unknown')}.{table.get('table_name', 'unknown')}"
                                html += f"<tr><td>{table_name}</td>"
                                html += f"<td>{table.get('row_count', 0)}</td>"
                                html += f"<td>{table.get('dead_rows', 0)}</td>"
                                html += f"<td>{table.get('last_vacuum', 'never')}</td></tr>"
                            html += "</table>"
                        
                        elif check_name == "query_performance" and check_data["success"]:
                            html += "<table><tr><th>Query</th><th>Avg Time (ms)</th><th>Max Time (ms)</th><th>Avg Rows</th></tr>"
                            for query in check_data.get("top_queries", []):
                                html += f"<tr><td>{query.get('query', 'Unknown')[:50]}...</td>"
                                html += f"<td>{query.get('avg_exec_time', 0):.2f}</td>"
                                html += f"<td>{query.get('max_exec_time', 0):.2f}</td>"
                                html += f"<td>{query.get('avg_rows', 0)}</td></tr>"
                            html += "</table>"
                        
                        elif check_name == "recent_errors" and check_data["success"]:
                            if not check_data.get("errors"):
                                html += "<p class='ok'>No errors in the last 24 hours</p>"
                            else:
                                html += "<table><tr><th>Service</th><th>Operation</th><th>Count</th></tr>"
                                for error in check_data.get("errors", []):
                                    html += f"<tr><td>{error.get('service_name', 'Unknown')}</td>"
                                    html += f"<td>{error.get('operation', 'Unknown')}</td>"
                                    html += f"<td>{error.get('error_count', 0)}</td></tr>"
                                html += "</table>"
                    
                    html += """
</body>
</html>
"""
                    f.write(html)
                else:
                    # Text format (default)
                    f.write(f"Database Health Check Report\n")
                    f.write(f"Generated: {results['timestamp']}\n\n")
                    f.write(f"Overall Status: {overall_status.upper()}\n")
                    
                    if issues:
                        f.write("\nIssues Found:\n")
                        for issue in issues:
                            f.write(f"- {issue}\n")
                    else:
                        f.write("\nAll checks passed!\n")
            
            print(f"\nResults saved to {output_file}")
        except Exception as e:
            logger.error(f"Error writing output file: {str(e)}")
    
    return results

def main():
    """Main function."""
    parser = argparse.ArgumentParser(description="Database Health Monitor for Shared Supabase")
    parser.add_argument("--url", "-u", help="Supabase URL")
    parser.add_argument("--key", "-k", help="Supabase service key")
    parser.add_argument("--output", "-o", help="Output file path")
    parser.add_argument("--format", "-f", choices=["text", "json", "html"], default="text",
                        help="Output format (text, json, or html)")
    parser.add_argument("--monitor", "-m", action="store_true", 
                        help="Run in monitoring mode (continuous checks)")
    parser.add_argument("--interval", "-i", type=int, default=60,
                        help="Check interval in seconds (for monitoring mode)")
    args = parser.parse_args()
    
    # Get Supabase credentials
    url = args.url or os.environ.get("SUPABASE_URL")
    key = args.key or os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_KEY")
    
    if not url or not key:
        logger.error(
            "Supabase URL and key are required. "
            "Provide them as arguments or set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables."
        )
        return 1
    
    # Get Supabase client
    client = get_supabase_client(url, key)
    if not client:
        logger.error("Failed to create Supabase client")
        return 1
    
    if args.monitor:
        logger.info(f"Starting monitoring mode with {args.interval}s interval")
        print_header("Database Health Monitor")
        print(f"Monitoring at {args.interval}s intervals. Press Ctrl+C to stop.")
        
        try:
            while True:
                # Generate timestamp for output file
                timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                output_file = None
                
                if args.output:
                    base_name, ext = os.path.splitext(args.output)
                    output_file = f"{base_name}_{timestamp}{ext}"
                
                # Run health check
                run_health_check(client, args.format, output_file)
                
                # Wait for next check
                time.sleep(args.interval)
        except KeyboardInterrupt:
            print("\nMonitoring stopped")
    else:
        # Run a single health check
        run_health_check(client, args.format, args.output)
    
    return 0

if __name__ == "__main__":
    sys.exit(main())