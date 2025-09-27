#!/usr/bin/env python3
"""
TerraFusion Legacy Database Connection Tester
Tests connectivity to PACS, ArcGIS, and CIAPS legacy systems
"""

import os
import sys
import time
import json
import logging
import requests
from datetime import datetime
from typing import Dict, List, Any, Optional

try:
    import pyodbc
    PYODBC_AVAILABLE = True
except ImportError:
    PYODBC_AVAILABLE = False

try:
    import cx_Oracle
    ORACLE_AVAILABLE = True
except ImportError:
    ORACLE_AVAILABLE = False

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class LegacySystemTester:
    def __init__(self):
        self.results = {
            "test_timestamp": datetime.now().isoformat(),
            "environment": {
                "python_version": sys.version,
                "platform": sys.platform,
                "pyodbc_available": PYODBC_AVAILABLE,
                "oracle_available": ORACLE_AVAILABLE
            },
            "tests": {}
        }
    
    def test_pacs_connectivity(self) -> Dict[str, Any]:
        """Test PACS SQL Server connectivity"""
        logger.info("🔍 Testing PACS Database Connectivity...")
        
        test_result = {
            "system": "PACS",
            "server": "JCHARRISPACS",
            "database": "pacs_oltp",
            "connection_type": "SQL Server",
            "status": "unknown",
            "details": {},
            "recommendations": []
        }
        
        if not PYODBC_AVAILABLE:
            test_result["status"] = "error"
            test_result["details"]["error"] = "pyodbc module not available"
            test_result["recommendations"].append("Install pyodbc: pip install pyodbc")
            return test_result
        
        # Test different connection methods
        connection_strings = [
            "DRIVER={ODBC Driver 17 for SQL Server};SERVER=JCHARRISPACS;DATABASE=pacs_oltp;Trusted_Connection=yes;",
            "DRIVER={ODBC Driver 18 for SQL Server};SERVER=JCHARRISPACS;DATABASE=pacs_oltp;Trusted_Connection=yes;",
            "DRIVER={SQL Server};SERVER=JCHARRISPACS;DATABASE=pacs_oltp;Trusted_Connection=yes;",
            "Data Source=JCHARRISPACS;Initial Catalog=pacs_oltp;Integrated Security=True;"
        ]
        
        for i, conn_str in enumerate(connection_strings):
            try:
                logger.info(f"  Attempting connection method {i+1}/4...")
                start_time = time.time()
                
                connection = pyodbc.connect(conn_str, timeout=10)
                cursor = connection.cursor()
                
                # Test basic query
                cursor.execute("SELECT @@VERSION")
                version = cursor.fetchone()[0]
                
                # Test PACS-specific table
                try:
                    cursor.execute("SELECT COUNT(*) FROM property_profile")
                    property_count = cursor.fetchone()[0]
                    test_result["details"]["property_count"] = property_count
                except Exception as e:
                    test_result["details"]["table_access_error"] = str(e)
                
                connection.close()
                
                test_result["status"] = "success"
                test_result["details"]["connection_string"] = conn_str
                test_result["details"]["server_version"] = version
                test_result["details"]["connection_time"] = f"{time.time() - start_time:.2f}s"
                break
                
            except Exception as e:
                logger.warning(f"    Connection method {i+1} failed: {str(e)}")
                test_result["details"][f"connection_attempt_{i+1}"] = str(e)
        
        if test_result["status"] == "unknown":
            test_result["status"] = "failed"
            test_result["recommendations"].extend([
                "Verify JCHARRISPACS server is accessible",
                "Check Windows domain authentication",
                "Confirm SQL Server ODBC drivers installed",
                "Verify network connectivity to server",
                "Check if VPN connection is required"
            ])
        
        return test_result
    
    def test_arcgis_connectivity(self) -> Dict[str, Any]:
        """Test ArcGIS Online services connectivity"""
        logger.info("🗺️ Testing ArcGIS Services Connectivity...")
        
        test_result = {
            "system": "ArcGIS Online",
            "base_url": "https://services.arcgis.com/benton",
            "connection_type": "REST API",
            "status": "unknown",
            "details": {},
            "recommendations": []
        }
        
        urls_to_test = [
            "https://services.arcgis.com/benton",
            "https://services.arcgis.com/benton/arcgis/rest/services",
            "https://www.arcgis.com/sharing/rest/info",
            "https://services.arcgis.com"
        ]
        
        for i, url in enumerate(urls_to_test):
            try:
                logger.info(f"  Testing URL {i+1}/4: {url}")
                start_time = time.time()
                
                response = requests.get(url, timeout=10)
                response_time = time.time() - start_time
                
                test_result["details"][f"url_{i+1}"] = {
                    "url": url,
                    "status_code": response.status_code,
                    "response_time": f"{response_time:.2f}s",
                    "content_type": response.headers.get('content-type', 'unknown')
                }
                
                if response.status_code == 200:
                    test_result["status"] = "success"
                    test_result["details"]["working_url"] = url
                    
                    if 'json' in response.headers.get('content-type', ''):
                        try:
                            data = response.json()
                            test_result["details"]["api_response"] = data
                        except:
                            pass
                    break
                    
            except Exception as e:
                logger.warning(f"    URL {i+1} failed: {str(e)}")
                test_result["details"][f"url_{i+1}_error"] = str(e)
        
        if test_result["status"] == "unknown":
            test_result["status"] = "failed"
            test_result["recommendations"].extend([
                "Check internet connectivity",
                "Verify ArcGIS Online service URLs",
                "Confirm Benton County ArcGIS organization exists",
                "Check firewall/proxy settings",
                "Consider using alternative GIS services"
            ])
        
        return test_result
    
    def test_ciaps_connectivity(self) -> Dict[str, Any]:
        """Test CIAPS Oracle database connectivity"""
        logger.info("🏛️ Testing CIAPS Database Connectivity...")
        
        test_result = {
            "system": "CIAPS",
            "server": "ciaps.wa.gov",
            "connection_type": "Oracle Database",
            "status": "unknown",
            "details": {},
            "recommendations": []
        }
        
        if not ORACLE_AVAILABLE:
            test_result["status"] = "error"
            test_result["details"]["error"] = "cx_Oracle module not available"
            test_result["recommendations"].append("Install cx_Oracle: pip install cx_Oracle")
            return test_result
        
        # Test Oracle connection methods
        connection_strings = [
            "oracle://ciaps.wa.gov",
            "ciaps.wa.gov:1521/XE",
            "ciaps.wa.gov:1521/ORCL"
        ]
        
        for i, conn_str in enumerate(connection_strings):
            try:
                logger.info(f"  Attempting Oracle connection {i+1}/3...")
                start_time = time.time()
                
                # Note: This would require actual Oracle credentials
                # For now, just test basic connectivity
                import socket
                socket.create_connection(('ciaps.wa.gov', 1521), timeout=10)
                
                test_result["status"] = "network_reachable"
                test_result["details"]["network_connectivity"] = "success"
                test_result["details"]["connection_time"] = f"{time.time() - start_time:.2f}s"
                test_result["recommendations"].append("Network connectivity confirmed - Oracle credentials required for full connection test")
                break
                
            except Exception as e:
                logger.warning(f"    Connection {i+1} failed: {str(e)}")
                test_result["details"][f"connection_attempt_{i+1}"] = str(e)
        
        if test_result["status"] == "unknown":
            test_result["status"] = "failed"
            test_result["recommendations"].extend([
                "Verify ciaps.wa.gov server accessibility",
                "Check Oracle database port (usually 1521)",
                "Confirm Oracle client libraries installed",
                "Verify network connectivity to Washington State systems",
                "Check if VPN or special access required"
            ])
        
        return test_result
    
    def test_network_prerequisites(self) -> Dict[str, Any]:
        """Test basic network and system prerequisites"""
        logger.info("🌐 Testing Network Prerequisites...")
        
        test_result = {
            "system": "Network Prerequisites",
            "status": "unknown",
            "details": {},
            "recommendations": []
        }
        
        # Test basic internet connectivity
        try:
            response = requests.get("https://www.google.com", timeout=5)
            test_result["details"]["internet_connectivity"] = "success"
        except Exception as e:
            test_result["details"]["internet_connectivity"] = f"failed: {str(e)}"
            test_result["recommendations"].append("Check internet connectivity")
        
        # Test DNS resolution for target servers
        import socket
        servers_to_test = ["JCHARRISPACS", "ciaps.wa.gov", "services.arcgis.com"]
        
        for server in servers_to_test:
            try:
                ip = socket.gethostbyname(server)
                test_result["details"][f"dns_{server}"] = f"resolved to {ip}"
            except Exception as e:
                test_result["details"][f"dns_{server}"] = f"failed: {str(e)}"
        
        # Check installed database drivers
        drivers = []
        if PYODBC_AVAILABLE:
            try:
                drivers = pyodbc.drivers()
                test_result["details"]["odbc_drivers"] = drivers
            except:
                pass
        
        test_result["details"]["python_modules"] = {
            "pyodbc": PYODBC_AVAILABLE,
            "cx_Oracle": ORACLE_AVAILABLE,
            "requests": True
        }
        
        test_result["status"] = "completed"
        return test_result
    
    def run_all_tests(self) -> Dict[str, Any]:
        """Run all connectivity tests"""
        logger.info("🚀 Starting TerraFusion Legacy Database Connectivity Tests")
        logger.info("=" * 60)
        
        # Run all tests
        self.results["tests"]["network_prerequisites"] = self.test_network_prerequisites()
        self.results["tests"]["pacs"] = self.test_pacs_connectivity()
        self.results["tests"]["arcgis"] = self.test_arcgis_connectivity()
        self.results["tests"]["ciaps"] = self.test_ciaps_connectivity()
        
        # Calculate overall status
        statuses = [test["status"] for test in self.results["tests"].values()]
        if "success" in statuses:
            self.results["overall_status"] = "partial_success"
        elif any(status in ["network_reachable", "completed"] for status in statuses):
            self.results["overall_status"] = "limited_connectivity"
        else:
            self.results["overall_status"] = "no_connectivity"
        
        return self.results
    
    def generate_report(self) -> str:
        """Generate a comprehensive connectivity report"""
        report = []
        report.append("=" * 80)
        report.append("🌍 TERRAFUSION LEGACY DATABASE CONNECTIVITY REPORT")
        report.append("=" * 80)
        report.append(f"Test Date: {self.results['test_timestamp']}")
        report.append(f"Overall Status: {self.results['overall_status'].upper()}")
        report.append("")
        
        for test_name, test_data in self.results["tests"].items():
            report.append(f"📊 {test_data['system'].upper()}")
            report.append("-" * 40)
            report.append(f"Status: {test_data['status'].upper()}")
            
            if test_data.get("server"):
                report.append(f"Server: {test_data['server']}")
            if test_data.get("database"):
                report.append(f"Database: {test_data['database']}")
            
            # Add details
            if test_data["details"]:
                report.append("Details:")
                for key, value in test_data["details"].items():
                    report.append(f"  • {key}: {value}")
            
            # Add recommendations
            if test_data["recommendations"]:
                report.append("Recommendations:")
                for rec in test_data["recommendations"]:
                    report.append(f"  ➤ {rec}")
            
            report.append("")
        
        # Add summary
        report.append("=" * 80)
        report.append("📋 SUMMARY")
        report.append("=" * 80)
        
        if self.results["overall_status"] == "no_connectivity":
            report.append("❌ No legacy database connectivity detected.")
            report.append("💡 TerraFusion applications will run in MOCK DATA MODE.")
            report.append("✅ All core functionality available with sample data.")
        elif self.results["overall_status"] == "partial_success":
            report.append("⚠️ Partial legacy database connectivity detected.")
            report.append("🔄 Some systems accessible, others running in mock mode.")
            report.append("📈 Enhanced functionality available for connected systems.")
        else:
            report.append("✅ Network connectivity available for some legacy systems.")
            report.append("🔧 Additional configuration may be required for full access.")
        
        report.append("")
        report.append("🎯 NEXT STEPS:")
        report.append("1. Review individual system recommendations above")
        report.append("2. Contact system administrators for access credentials")
        report.append("3. Configure VPN/network access as required")
        report.append("4. Install required database drivers and libraries")
        report.append("5. Test connections from production environment")
        
        return "\n".join(report)

def main():
    """Main execution function"""
    print("🌍 TerraFusion Legacy Database Connectivity Tester")
    print("Testing connectivity to PACS, ArcGIS, and CIAPS systems...")
    print()
    
    tester = LegacySystemTester()
    results = tester.run_all_tests()
    
    # Generate and display report
    report = tester.generate_report()
    print(report)
    
    # Save results to file
    output_file = f"legacy_connectivity_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Detailed results saved to: {output_file}")
    
    return results

if __name__ == "__main__":
    main() 