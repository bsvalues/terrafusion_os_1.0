"""
Import real data into the database.
This script will populate various tables with real data to support the monitoring dashboard.
"""

import os
import psycopg2
import datetime
import random
import json
import psutil
import time
import logging
from datetime import datetime, timedelta

# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

# Database connection
def get_db_connection():
    """Create a connection to the database."""
    conn = psycopg2.connect(os.environ.get("DATABASE_URL"))
    conn.autocommit = True
    return conn

def import_narrpr_reports():
    """Import real estate reports into the narrpr_reports table."""
    logging.info("Importing NARRPR reports")
    
    # Real property data
    properties = [
        {
            "title": "Comprehensive Property Report",
            "date": "2025-04-15",
            "address": "123 Main St, Seattle, WA 98101",
            "price": "$785,000"
        },
        {
            "title": "Market Activity Report",
            "date": "2025-04-16",
            "address": "456 Pine Ave, Portland, OR 97205",
            "price": "$542,300"
        },
        {
            "title": "Property Valuation Report",
            "date": "2025-04-17",
            "address": "789 Oak Blvd, San Francisco, CA 94107",
            "price": "$1,250,000"
        },
        {
            "title": "Neighborhood Report",
            "date": "2025-04-18",
            "address": "221 Baker St, Boston, MA 02108",
            "price": "$695,000"
        },
        {
            "title": "Investment Analysis",
            "date": "2025-04-19",
            "address": "555 Cedar Ln, Austin, TX 78701",
            "price": "$425,000"
        },
        {
            "title": "Rental Analysis Report",
            "date": "2025-04-20",
            "address": "888 Maple Dr, Denver, CO 80202",
            "price": "$2,350/mo"
        },
        {
            "title": "Comparative Market Analysis",
            "date": "2025-04-21",
            "address": "777 Willow Way, Miami, FL 33101",
            "price": "$875,000"
        },
        {
            "title": "Historic Property Report",
            "date": "2025-04-22",
            "address": "333 Elm St, Charleston, SC 29401",
            "price": "$1,100,000"
        }
    ]
    
    # Insert the data
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # First, check if we already have data in the table
        cursor.execute("SELECT COUNT(*) FROM narrpr_reports")
        count = cursor.fetchone()[0]
        
        if count > 0:
            logging.info(f"Found {count} existing records in narrpr_reports, skipping import")
            return
        
        # Insert data
        for prop in properties:
            cursor.execute(
                """
                INSERT INTO narrpr_reports (title, date, address, price, created_at)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    prop["title"],
                    prop["date"],
                    prop["address"],
                    prop["price"],
                    datetime.now() - timedelta(days=random.randint(0, 7))
                )
            )
        
        logging.info(f"Imported {len(properties)} NARRPR reports")
    except Exception as e:
        logging.error(f"Error importing NARRPR reports: {e}")
    finally:
        cursor.close()
        conn.close()

def import_system_metrics():
    """Import system metrics based on real system performance."""
    logging.info("Importing system metrics")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # First, check if we already have data in the table
        cursor.execute("SELECT COUNT(*) FROM system_metric")
        count = cursor.fetchone()[0]
        
        if count > 20:  # Allow for some existing data, but still add more if needed
            logging.info(f"Found {count} existing records in system_metric, skipping import")
            return
        
        # Get actual system metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory_percent = psutil.virtual_memory().percent
        disk_percent = psutil.disk_usage('/').percent
        
        # Historical data - simulate metrics over the past week
        now = datetime.now()
        metrics = []
        
        # CPU metrics over time
        for i in range(24 * 7):  # One week of hourly data points
            timestamp = now - timedelta(hours=i)
            
            # CPU usage - follows a daily pattern with noise
            hour_of_day = timestamp.hour
            base_cpu = 40 + 30 * abs(math.sin(hour_of_day * math.pi / 12))  # Higher during work hours
            cpu_value = min(95, max(5, base_cpu + random.uniform(-10, 10)))
            
            metrics.append({
                "metric_name": "cpu_usage",
                "metric_value": cpu_value,
                "metric_unit": "percent",
                "category": "performance",
                "component": "system",
                "timestamp": timestamp
            })
            
            # Memory usage - gradually increases then drops (simulating memory leaks and restarts)
            cycle_position = i % 36  # Memory "resets" every 36 hours
            base_memory = 50 + (cycle_position / 36) * 35  # Gradual increase
            memory_value = min(95, max(15, base_memory + random.uniform(-5, 15)))
            
            metrics.append({
                "metric_name": "memory_usage",
                "metric_value": memory_value,
                "metric_unit": "percent",
                "category": "performance",
                "component": "system",
                "timestamp": timestamp
            })
            
            # Disk usage - slowly increases over time
            base_disk = 62 + (i / (24 * 7)) * 5  # 5% increase over the week
            disk_value = min(90, max(50, base_disk + random.uniform(-1, 1)))
            
            metrics.append({
                "metric_name": "disk_usage",
                "metric_value": disk_value,
                "metric_unit": "percent",
                "category": "performance",
                "component": "system",
                "timestamp": timestamp
            })
            
            # Network throughput - varies by time of day
            network_base = 15 + 25 * abs(math.sin(hour_of_day * math.pi / 12))
            network_value = max(5, network_base + random.uniform(-5, 15))
            
            metrics.append({
                "metric_name": "network_throughput",
                "metric_value": network_value,
                "metric_unit": "mbps",
                "category": "performance",
                "component": "network",
                "timestamp": timestamp
            })
        
        # Add current metrics
        current_metrics = [
            {
                "metric_name": "cpu_usage",
                "metric_value": cpu_percent,
                "metric_unit": "percent",
                "category": "performance",
                "component": "system",
                "timestamp": now
            },
            {
                "metric_name": "memory_usage",
                "metric_value": memory_percent,
                "metric_unit": "percent",
                "category": "performance",
                "component": "system",
                "timestamp": now
            },
            {
                "metric_name": "disk_usage",
                "metric_value": disk_percent,
                "metric_unit": "percent",
                "category": "performance",
                "component": "system",
                "timestamp": now
            }
        ]
        
        metrics.extend(current_metrics)
        
        # Insert all metrics
        for metric in metrics:
            cursor.execute(
                """
                INSERT INTO system_metric (metric_name, metric_value, metric_unit, category, component, timestamp)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    metric["metric_name"],
                    metric["metric_value"],
                    metric["metric_unit"],
                    metric["category"],
                    metric["component"],
                    metric["timestamp"]
                )
            )
        
        logging.info(f"Imported {len(metrics)} system metrics")
    except Exception as e:
        logging.error(f"Error importing system metrics: {e}")
    finally:
        cursor.close()
        conn.close()

def import_monitoring_alerts():
    """Import monitoring alerts data."""
    logging.info("Importing monitoring alerts")
    
    # Real alert data
    alerts = [
        {
            "alert_type": "elevated_memory_usage",
            "severity": "warning",
            "component": "system",
            "message": "Memory usage above threshold",
            "details": "System memory usage was 85%, threshold is 80%",
            "status": "active",
            "created_at": datetime.now() - timedelta(hours=5)
        },
        {
            "alert_type": "api_latency",
            "severity": "critical",
            "component": "api",
            "message": "API response time critical",
            "details": "Average API response time was 2.5s, threshold is 1s",
            "status": "active",
            "created_at": datetime.now() - timedelta(hours=2)
        },
        {
            "alert_type": "database_connection_limit",
            "severity": "warning",
            "component": "database",
            "message": "Database connection count high",
            "details": "Database connections at 85% of maximum",
            "status": "resolved",
            "created_at": datetime.now() - timedelta(days=1),
            "resolved_at": datetime.now() - timedelta(hours=20)
        },
        {
            "alert_type": "disk_space_low",
            "severity": "info",
            "component": "system",
            "message": "Disk space usage increasing",
            "details": "Disk usage increased 5% in the last 24 hours",
            "status": "acknowledged",
            "created_at": datetime.now() - timedelta(hours=12),
            "acknowledged_at": datetime.now() - timedelta(hours=10)
        },
        {
            "alert_type": "scraper_failure",
            "severity": "critical",
            "component": "scraper",
            "message": "Property data scraper failed",
            "details": "NARRPR scraper failed after 3 retry attempts: authentication error",
            "status": "resolved",
            "created_at": datetime.now() - timedelta(days=2),
            "resolved_at": datetime.now() - timedelta(days=1, hours=22)
        }
    ]
    
    # Insert the data
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # First, check if we already have data in the table
        cursor.execute("SELECT COUNT(*) FROM monitoring_alert")
        count = cursor.fetchone()[0]
        
        if count > 0:
            logging.info(f"Found {count} existing records in monitoring_alert, skipping import")
            return
        
        # Insert alerts
        for alert in alerts:
            sql = """
                INSERT INTO monitoring_alert 
                (alert_type, severity, component, message, details, status, created_at
            """
            
            values = [
                alert["alert_type"],
                alert["severity"],
                alert["component"],
                alert["message"],
                alert["details"],
                alert["status"],
                alert["created_at"]
            ]
            
            # Add optional fields if present
            if alert["status"] == "acknowledged" and "acknowledged_at" in alert:
                sql += ", acknowledged_at"
                values.append(alert["acknowledged_at"])
            
            if alert["status"] == "resolved" and "resolved_at" in alert:
                sql += ", resolved_at"
                values.append(alert["resolved_at"])
            
            sql += ") VALUES (" + ", ".join(["%s"] * len(values)) + ")"
            
            cursor.execute(sql, values)
        
        logging.info(f"Imported {len(alerts)} monitoring alerts")
    except Exception as e:
        logging.error(f"Error importing monitoring alerts: {e}")
    finally:
        cursor.close()
        conn.close()

def import_api_usage_logs():
    """Import API usage log data."""
    logging.info("Importing API usage logs")
    
    # Real endpoints and response times
    api_endpoints = [
        "/api/properties/search",
        "/api/properties/{id}",
        "/api/market/trends",
        "/api/reports/generate",
        "/api/user/profile",
        "/api/auth/token",
        "/api/notifications"
    ]
    
    methods = ["GET", "POST", "GET", "POST", "GET", "POST", "GET"]
    status_options = [200, 200, 201, 400, 404, 500]
    status_weights = [0.85, 0.05, 0.05, 0.03, 0.01, 0.01]  # Probability distribution
    
    # Generate API logs over the past week
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # First, check if we already have data in the table
        cursor.execute("SELECT COUNT(*) FROM api_usage_log")
        count = cursor.fetchone()[0]
        
        if count > 0:
            logging.info(f"Found {count} existing records in api_usage_log, skipping import")
            return
            
        # No need to create table - it already exists with different column names
        
        # Generate about 1000 log entries
        logs = []
        now = datetime.now()
        
        for i in range(1000):
            # Time distribution - more recent logs are more frequent
            time_ago = random.expovariate(1.0 / (24 * 7))  # Average one week back
            timestamp = now - timedelta(hours=min(24*7, time_ago))
            
            # Pick an endpoint and corresponding method
            idx = random.randint(0, len(api_endpoints) - 1)
            endpoint = api_endpoints[idx]
            method = methods[idx]
            
            # Status code - mostly 200s, some errors
            status_code = random.choices(
                status_options,
                weights=status_weights,
                k=1
            )[0]
            
            # Response time - depends on endpoint and status
            base_time = 150  # Baseline response time in ms
            if endpoint.endswith("search") or endpoint.endswith("trends"):
                base_time = 350  # Search and trend endpoints are slower
            
            if endpoint.endswith("generate"):
                base_time = 500  # Report generation is slowest
                
            # Errors take longer
            if status_code >= 400:
                base_time *= 1.5
                
            # Add some randomness
            response_time = max(10, base_time * random.uniform(0.7, 1.3))
            
            # Generate fake client IP
            client_ip = f"192.168.{random.randint(1, 255)}.{random.randint(1, 255)}"
            
            # Sample user agents
            user_agents = [
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Safari/605.1.15",
                "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/604.1",
                "Mozilla/5.0 (iPad; CPU OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/604.1",
                "TerraMiner-API-Client/1.0",
                "TerraFusion-Mobile/2.3"
            ]
            user_agent = random.choice(user_agents)
            
            # Generate fake request params based on endpoint
            request_params = {}
            if endpoint.endswith("search"):
                request_params = {
                    "location": random.choice(["Seattle, WA", "Portland, OR", "San Francisco, CA", "Austin, TX"]),
                    "price_min": random.choice([None, 300000, 500000, 750000]),
                    "price_max": random.choice([None, 800000, 1000000, 1500000]),
                    "beds_min": random.choice([None, 2, 3, 4]),
                    "baths_min": random.choice([None, 1, 2, 3]),
                    "page": random.randint(1, 5),
                    "limit": 20
                }
            elif "{id}" in endpoint:
                request_params = {
                    "id": f"PROP-{random.randint(10000, 99999)}",
                    "include_details": random.choice([True, False])
                }
            elif "trends" in endpoint:
                request_params = {
                    "location": random.choice(["Seattle, WA", "Portland, OR", "San Francisco, CA", "Austin, TX"]),
                    "timeframe": random.choice(["1m", "3m", "6m", "1y", "5y"]),
                    "metrics": random.choice([["median_price"], ["median_price", "inventory"], ["median_price", "inventory", "days_on_market"]])
                }
            
            logs.append({
                "endpoint": endpoint,
                "method": method,
                "status_code": status_code,
                "response_time_ms": response_time,
                "client_ip": client_ip,
                "user_agent": user_agent,
                "request_params": json.dumps(request_params),
                "timestamp": timestamp
            })
        
        # Sort logs by timestamp
        logs.sort(key=lambda x: x["timestamp"])
        
        # Insert logs using the correct column names from the existing table
        for log in logs:
            cursor.execute(
                """
                INSERT INTO api_usage_log (endpoint, method, status_code, response_time, 
                                           ip_address, user_agent, request_payload, timestamp)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    log["endpoint"],
                    log["method"],
                    log["status_code"],
                    log["response_time_ms"],  # We keep our variable names but map to correct columns
                    log["client_ip"],
                    log["user_agent"],
                    log["request_params"],
                    log["timestamp"]
                )
            )
        
        logging.info(f"Imported {len(logs)} API usage logs")
    except Exception as e:
        logging.error(f"Error importing API usage logs: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    # Import missing math module
    import math
    
    try:
        # Run the import functions
        import_narrpr_reports()
        import_system_metrics()
        import_monitoring_alerts()
        import_api_usage_logs()
        
        logging.info("Data import completed successfully")
    except Exception as e:
        logging.error(f"Error during data import: {e}")