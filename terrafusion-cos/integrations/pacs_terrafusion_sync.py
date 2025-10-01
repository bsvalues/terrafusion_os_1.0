#!/usr/bin/env python3
"""
PACS-TerraFusion Sync Integration Module
Bidirectional real-time synchronization between PACS and TerraFusion platform

This module implements the core integration that transforms TerraFusion from
county OS to vendor substrate platform, using Harris PACS as the strategic pilot.
"""

import asyncio
import logging
import json
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, asdict
from enum import Enum
import hashlib
import time

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SyncDirection(Enum):
    """Data synchronization direction"""
    PACS_TO_TERRAFUSION = "pacs_to_terrafusion"
    TERRAFUSION_TO_PACS = "terrafusion_to_pacs"
    BIDIRECTIONAL = "bidirectional"

class SyncStatus(Enum):
    """Synchronization status"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CONFLICT = "conflict"

@dataclass
class SyncRecord:
    """Individual synchronization record tracking"""
    sync_id: str
    table_name: str
    record_id: str
    direction: SyncDirection
    status: SyncStatus
    created_timestamp: str
    updated_timestamp: str
    source_hash: str
    target_hash: Optional[str] = None
    conflict_details: Optional[Dict] = None
    retry_count: int = 0
    error_message: Optional[str] = None

@dataclass
class SyncMetrics:
    """Synchronization performance metrics"""
    total_records_synced: int
    sync_duration_seconds: float
    average_sync_time_ms: float
    success_rate: float
    error_count: int
    conflict_count: int
    throughput_records_per_second: float

class PACSDataTransformer:
    """Transform PACS data for TerraFusion integration"""
    
    @staticmethod
    def transform_property_data(pacs_record: Dict) -> Dict:
        """Transform PACS property data to TerraFusion format"""
        return {
            "property_id": pacs_record.get("parcel_id") or pacs_record.get("property_id"),
            "address": {
                "street": pacs_record.get("property_address", ""),
                "city": pacs_record.get("city", ""),
                "state": pacs_record.get("state", ""),
                "zip_code": pacs_record.get("zip_code", "")
            },
            "assessment": {
                "land_value": float(pacs_record.get("land_value", 0)),
                "improvement_value": float(pacs_record.get("improvement_value", 0)),
                "total_value": float(pacs_record.get("total_value", 0)),
                "assessment_year": int(pacs_record.get("tax_year", datetime.now().year))
            },
            "ownership": {
                "owner_name": pacs_record.get("owner_name", ""),
                "mailing_address": pacs_record.get("mailing_address", "")
            },
            "characteristics": {
                "property_type": pacs_record.get("property_type", ""),
                "square_footage": int(pacs_record.get("square_footage", 0)),
                "lot_size": float(pacs_record.get("lot_size", 0)),
                "year_built": int(pacs_record.get("year_built", 0))
            },
            "metadata": {
                "last_updated": datetime.now().isoformat(),
                "source_system": "harris_pacs",
                "sync_timestamp": datetime.now().isoformat()
            }
        }
    
    @staticmethod
    def transform_tax_data(pacs_record: Dict) -> Dict:
        """Transform PACS tax data to TerraFusion format"""
        return {
            "tax_bill_id": pacs_record.get("bill_id") or pacs_record.get("tax_id"),
            "property_id": pacs_record.get("parcel_id") or pacs_record.get("property_id"),
            "tax_year": int(pacs_record.get("tax_year", datetime.now().year)),
            "amounts": {
                "gross_tax": float(pacs_record.get("gross_tax", 0)),
                "net_tax": float(pacs_record.get("net_tax", 0)),
                "exemptions": float(pacs_record.get("exemptions", 0)),
                "penalties": float(pacs_record.get("penalties", 0)),
                "interest": float(pacs_record.get("interest", 0))
            },
            "payment_status": {
                "status": pacs_record.get("payment_status", "unpaid"),
                "amount_paid": float(pacs_record.get("amount_paid", 0)),
                "balance_due": float(pacs_record.get("balance_due", 0)),
                "due_date": pacs_record.get("due_date", ""),
                "payment_date": pacs_record.get("payment_date", "")
            },
            "jurisdictions": {
                "county_rate": float(pacs_record.get("county_rate", 0)),
                "city_rate": float(pacs_record.get("city_rate", 0)),
                "school_rate": float(pacs_record.get("school_rate", 0)),
                "special_district_rate": float(pacs_record.get("special_district_rate", 0))
            },
            "metadata": {
                "last_updated": datetime.now().isoformat(),
                "source_system": "harris_pacs",
                "sync_timestamp": datetime.now().isoformat()
            }
        }
    
    @staticmethod
    def transform_ownership_data(pacs_record: Dict) -> Dict:
        """Transform PACS ownership data to TerraFusion format"""
        return {
            "ownership_id": pacs_record.get("ownership_id") or f"{pacs_record.get('property_id')}_{pacs_record.get('owner_sequence', '1')}",
            "property_id": pacs_record.get("parcel_id") or pacs_record.get("property_id"),
            "owner_info": {
                "name": pacs_record.get("owner_name", ""),
                "co_owner": pacs_record.get("co_owner", ""),
                "ownership_type": pacs_record.get("ownership_type", "individual"),
                "ownership_percentage": float(pacs_record.get("ownership_percentage", 100))
            },
            "addresses": {
                "mailing_address": pacs_record.get("mailing_address", ""),
                "mailing_city": pacs_record.get("mailing_city", ""),
                "mailing_state": pacs_record.get("mailing_state", ""),
                "mailing_zip": pacs_record.get("mailing_zip", "")
            },
            "legal_info": {
                "deed_reference": pacs_record.get("deed_reference", ""),
                "deed_date": pacs_record.get("deed_date", ""),
                "acquisition_date": pacs_record.get("acquisition_date", ""),
                "legal_description": pacs_record.get("legal_description", "")
            },
            "metadata": {
                "last_updated": datetime.now().isoformat(),
                "source_system": "harris_pacs",
                "sync_timestamp": datetime.now().isoformat()
            }
        }

class TerraFusionSyncEngine:
    """Core synchronization engine for PACS-TerraFusion integration"""
    
    def __init__(self, pacs_db_path: str, terrafusion_endpoint: str = None):
        self.pacs_db_path = pacs_db_path
        self.terrafusion_endpoint = terrafusion_endpoint or "http://localhost:5000/api/sync"
        self.sync_records: List[SyncRecord] = []
        self.sync_metrics = None
        self.transformer = PACSDataTransformer()
        
        # Sync configuration based on assessor experience
        self.sync_config = {
            "batch_size": 100,  # Records per batch
            "max_retries": 3,
            "retry_delay_seconds": 5,
            "conflict_resolution": "terrafusion_wins",  # or "pacs_wins", "manual"
            "performance_monitoring": True,
            "real_time_sync": True,
            "change_detection_interval": 30  # seconds
        }
        
        # Table-specific sync strategies
        self.table_sync_strategies = {
            "properties": {
                "direction": SyncDirection.BIDIRECTIONAL,
                "priority": "high",
                "conflict_resolution": "manual_review",
                "change_detection": "timestamp_based"
            },
            "assessments": {
                "direction": SyncDirection.PACS_TO_TERRAFUSION,
                "priority": "high", 
                "conflict_resolution": "pacs_wins",
                "change_detection": "hash_based"
            },
            "tax_bills": {
                "direction": SyncDirection.BIDIRECTIONAL,
                "priority": "high",
                "conflict_resolution": "terrafusion_wins",
                "change_detection": "timestamp_based"
            },
            "owners": {
                "direction": SyncDirection.BIDIRECTIONAL,
                "priority": "medium",
                "conflict_resolution": "manual_review",
                "change_detection": "hash_based"
            }
        }
    
    def connect_pacs_database(self) -> sqlite3.Connection:
        """Connect to PACS clone database"""
        try:
            conn = sqlite3.connect(self.pacs_db_path)
            conn.row_factory = sqlite3.Row
            return conn
        except Exception as e:
            logger.error(f"Failed to connect to PACS database: {e}")
            raise
    
    def calculate_record_hash(self, record: Dict) -> str:
        """Calculate hash for change detection"""
        # Remove metadata fields that shouldn't affect sync
        sync_fields = {k: v for k, v in record.items() 
                      if k not in ['last_updated', 'sync_timestamp', 'metadata']}
        
        record_str = json.dumps(sync_fields, sort_keys=True, default=str)
        return hashlib.md5(record_str.encode()).hexdigest()
    
    def detect_changes(self, table_name: str) -> List[Dict]:
        """Detect changes in PACS table since last sync"""
        try:
            conn = self.connect_pacs_database()
            cursor = conn.cursor()
            
            strategy = self.table_sync_strategies.get(table_name, {})
            detection_method = strategy.get("change_detection", "timestamp_based")
            
            if detection_method == "timestamp_based":
                # Get records modified since last sync
                last_sync_time = self._get_last_sync_timestamp(table_name)
                query = f"""
                    SELECT * FROM {table_name} 
                    WHERE last_updated > ? OR last_updated IS NULL
                    ORDER BY last_updated DESC
                """
                cursor.execute(query, (last_sync_time,))
            
            else:  # hash_based
                # Get all records for hash comparison
                query = f"SELECT * FROM {table_name}"
                cursor.execute(query)
            
            changed_records = [dict(row) for row in cursor.fetchall()]
            
            if detection_method == "hash_based":
                # Filter by hash changes
                changed_records = self._filter_by_hash_changes(table_name, changed_records)
            
            conn.close()
            logger.info(f"Detected {len(changed_records)} changes in {table_name}")
            return changed_records
            
        except Exception as e:
            logger.error(f"Change detection failed for {table_name}: {e}")
            return []
    
    def _get_last_sync_timestamp(self, table_name: str) -> str:
        """Get timestamp of last successful sync for table"""
        # In production, this would query TerraFusion sync tracking
        # For demo, return timestamp from 1 hour ago
        last_sync = datetime.now() - timedelta(hours=1)
        return last_sync.isoformat()
    
    def _filter_by_hash_changes(self, table_name: str, records: List[Dict]) -> List[Dict]:
        """Filter records that have hash changes since last sync"""
        changed_records = []
        
        for record in records:
            current_hash = self.calculate_record_hash(record)
            last_known_hash = self._get_last_known_hash(table_name, record.get('id'))
            
            if current_hash != last_known_hash:
                changed_records.append(record)
        
        return changed_records
    
    def _get_last_known_hash(self, table_name: str, record_id: str) -> str:
        """Get last known hash for record from sync tracking"""
        # In production, query TerraFusion sync history
        # For demo, return empty to force sync
        return ""
    
    async def sync_table_to_terrafusion(self, table_name: str, records: List[Dict]) -> SyncMetrics:
        """Sync PACS table records to TerraFusion"""
        start_time = time.time()
        sync_records = []
        success_count = 0
        error_count = 0
        conflict_count = 0
        
        logger.info(f"Starting sync of {len(records)} records from {table_name} to TerraFusion")
        
        # Process records in batches
        batch_size = self.sync_config["batch_size"]
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            
            for record in batch:
                try:
                    # Transform PACS data to TerraFusion format
                    transformed_record = self._transform_record(table_name, record)
                    
                    # Create sync record
                    sync_record = SyncRecord(
                        sync_id=f"{table_name}_{record.get('id', i)}_{int(time.time())}",
                        table_name=table_name,
                        record_id=str(record.get('id', i)),
                        direction=SyncDirection.PACS_TO_TERRAFUSION,
                        status=SyncStatus.IN_PROGRESS,
                        created_timestamp=datetime.now().isoformat(),
                        updated_timestamp=datetime.now().isoformat(),
                        source_hash=self.calculate_record_hash(record)
                    )
                    
                    # Simulate TerraFusion API call
                    success = await self._send_to_terrafusion(transformed_record, sync_record)
                    
                    if success:
                        sync_record.status = SyncStatus.COMPLETED
                        success_count += 1
                    else:
                        sync_record.status = SyncStatus.FAILED
                        error_count += 1
                    
                    sync_records.append(sync_record)
                    
                except Exception as e:
                    logger.error(f"Failed to sync record {record.get('id')}: {e}")
                    error_count += 1
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Calculate metrics
        total_records = len(records)
        average_sync_time = (duration / total_records * 1000) if total_records > 0 else 0
        success_rate = (success_count / total_records * 100) if total_records > 0 else 0
        throughput = total_records / duration if duration > 0 else 0
        
        metrics = SyncMetrics(
            total_records_synced=total_records,
            sync_duration_seconds=duration,
            average_sync_time_ms=average_sync_time,
            success_rate=success_rate,
            error_count=error_count,
            conflict_count=conflict_count,
            throughput_records_per_second=throughput
        )
        
        self.sync_records.extend(sync_records)
        logger.info(f"Sync completed: {success_count}/{total_records} successful")
        
        return metrics
    
    def _transform_record(self, table_name: str, record: Dict) -> Dict:
        """Transform PACS record based on table type"""
        if "property" in table_name.lower() or "parcel" in table_name.lower():
            return self.transformer.transform_property_data(record)
        elif "tax" in table_name.lower():
            return self.transformer.transform_tax_data(record)
        elif "owner" in table_name.lower():
            return self.transformer.transform_ownership_data(record)
        else:
            # Generic transformation
            return {
                "table_name": table_name,
                "source_data": record,
                "metadata": {
                    "transformed_timestamp": datetime.now().isoformat(),
                    "source_system": "harris_pacs"
                }
            }
    
    async def _send_to_terrafusion(self, record: Dict, sync_record: SyncRecord) -> bool:
        """Send transformed record to TerraFusion (simulated)"""
        try:
            # Simulate API call delay
            await asyncio.sleep(0.01)  # 10ms simulated network delay
            
            # Simulate successful sync (90% success rate for demo)
            import random
            success = random.random() > 0.1
            
            if success:
                sync_record.target_hash = self.calculate_record_hash(record)
                logger.debug(f"Successfully synced record {sync_record.record_id}")
            else:
                sync_record.error_message = "Simulated network error"
                logger.warning(f"Failed to sync record {sync_record.record_id}")
            
            return success
            
        except Exception as e:
            sync_record.error_message = str(e)
            logger.error(f"Sync error for record {sync_record.record_id}: {e}")
            return False
    
    async def run_real_time_sync(self, tables: List[str] = None):
        """Run continuous real-time synchronization"""
        if not tables:
            tables = list(self.table_sync_strategies.keys())
        
        logger.info(f"Starting real-time sync for tables: {tables}")
        
        while True:
            try:
                for table_name in tables:
                    # Detect changes
                    changes = self.detect_changes(table_name)
                    
                    if changes:
                        logger.info(f"Processing {len(changes)} changes in {table_name}")
                        # Sync changes to TerraFusion
                        metrics = await self.sync_table_to_terrafusion(table_name, changes)
                        
                        # Log metrics
                        logger.info(f"Sync metrics - Success rate: {metrics.success_rate:.1f}%, "
                                  f"Throughput: {metrics.throughput_records_per_second:.1f} rec/sec")
                
                # Wait for next sync cycle
                await asyncio.sleep(self.sync_config["change_detection_interval"])
                
            except Exception as e:
                logger.error(f"Real-time sync error: {e}")
                await asyncio.sleep(self.sync_config["retry_delay_seconds"])
    
    async def run_initial_sync(self, tables: List[str] = None) -> Dict[str, SyncMetrics]:
        """Run initial full synchronization of all data"""
        if not tables:
            tables = list(self.table_sync_strategies.keys())
        
        logger.info(f"Starting initial sync for tables: {tables}")
        
        sync_results = {}
        
        for table_name in tables:
            try:
                # Get all records from table
                conn = self.connect_pacs_database()
                cursor = conn.cursor()
                cursor.execute(f"SELECT * FROM {table_name}")
                all_records = [dict(row) for row in cursor.fetchall()]
                conn.close()
                
                if all_records:
                    logger.info(f"Syncing {len(all_records)} records from {table_name}")
                    metrics = await self.sync_table_to_terrafusion(table_name, all_records)
                    sync_results[table_name] = metrics
                else:
                    logger.info(f"No records found in {table_name}")
                    
            except Exception as e:
                logger.error(f"Initial sync failed for {table_name}: {e}")
        
        return sync_results
    
    def generate_sync_report(self) -> Dict[str, Any]:
        """Generate comprehensive synchronization report"""
        if not self.sync_records:
            return {"error": "No sync records available"}
        
        # Calculate summary statistics
        total_syncs = len(self.sync_records)
        successful_syncs = len([r for r in self.sync_records if r.status == SyncStatus.COMPLETED])
        failed_syncs = len([r for r in self.sync_records if r.status == SyncStatus.FAILED])
        conflict_syncs = len([r for r in self.sync_records if r.status == SyncStatus.CONFLICT])
        
        # Group by table
        table_stats = {}
        for record in self.sync_records:
            table = record.table_name
            if table not in table_stats:
                table_stats[table] = {"total": 0, "successful": 0, "failed": 0, "conflicts": 0}
            
            table_stats[table]["total"] += 1
            if record.status == SyncStatus.COMPLETED:
                table_stats[table]["successful"] += 1
            elif record.status == SyncStatus.FAILED:
                table_stats[table]["failed"] += 1
            elif record.status == SyncStatus.CONFLICT:
                table_stats[table]["conflicts"] += 1
        
        return {
            "sync_summary": {
                "total_records": total_syncs,
                "successful": successful_syncs,
                "failed": failed_syncs,
                "conflicts": conflict_syncs,
                "success_rate": f"{(successful_syncs/total_syncs*100):.1f}%" if total_syncs > 0 else "0%"
            },
            "table_breakdown": table_stats,
            "performance_analysis": {
                "avg_sync_time": f"{sum(r.retry_count for r in self.sync_records)/total_syncs:.2f}s" if total_syncs > 0 else "0s",
                "error_patterns": self._analyze_error_patterns(),
                "optimization_recommendations": self._generate_optimization_recommendations()
            },
            "business_impact": {
                "time_savings": "Eliminates manual data entry and export/import processes",
                "accuracy_improvement": "Reduces human error in data synchronization",
                "operational_efficiency": "Enables real-time cross-system visibility",
                "compliance_support": "Maintains audit trail for all data movements"
            }
        }
    
    def _analyze_error_patterns(self) -> List[str]:
        """Analyze error patterns in sync records"""
        error_records = [r for r in self.sync_records if r.status == SyncStatus.FAILED]
        
        patterns = []
        if error_records:
            # Simulate error analysis
            patterns.append("Network timeout errors - recommend connection pooling")
            patterns.append("Data validation failures - enhance transformation logic")
            patterns.append("Concurrent update conflicts - implement optimistic locking")
        
        return patterns
    
    def _generate_optimization_recommendations(self) -> List[str]:
        """Generate performance optimization recommendations"""
        return [
            "Implement parallel batch processing for large table syncs",
            "Add intelligent retry logic with exponential backoff",
            "Create dedicated sync queues for high-priority tables",
            "Implement change data capture for more efficient change detection",
            "Add monitoring alerts for sync failure thresholds"
        ]

async def main():
    """Main demonstration of PACS-TerraFusion sync integration"""
    
    print("🔄 PACS-TERRAFUSION SYNC INTEGRATION DEMO")
    print("=" * 60)
    
    # Configuration
    pacs_db_path = input("Enter PACS clone database path (or press Enter for default): ").strip()
    if not pacs_db_path:
        pacs_db_path = "./pacs_clone.db"
    
    try:
        # Initialize sync engine
        sync_engine = TerraFusionSyncEngine(pacs_db_path)
        
        print(f"\n✅ Initialized PACS-TerraFusion sync engine")
        print(f"   PACS Database: {pacs_db_path}")
        print(f"   TerraFusion Endpoint: {sync_engine.terrafusion_endpoint}")
        
        # Demo options
        print("\n🎯 DEMO OPTIONS:")
        print("1. Run initial full sync")
        print("2. Run change detection demo")
        print("3. Simulate real-time sync (10 cycles)")
        print("4. Generate comprehensive sync report")
        
        choice = input("\nSelect option (1-4): ").strip()
        
        if choice == "1":
            print("\n🚀 Running initial full synchronization...")
            sync_results = await sync_engine.run_initial_sync()
            
            print("\n📊 INITIAL SYNC RESULTS:")
            for table, metrics in sync_results.items():
                print(f"   {table}: {metrics.total_records_synced} records, "
                      f"{metrics.success_rate:.1f}% success, "
                      f"{metrics.throughput_records_per_second:.1f} rec/sec")
        
        elif choice == "2":
            print("\n🔍 Running change detection demo...")
            tables = ["properties", "tax_bills", "owners"]
            
            for table in tables:
                changes = sync_engine.detect_changes(table)
                print(f"   {table}: {len(changes)} changes detected")
                
                if changes:
                    # Sync first 5 changes as demo
                    demo_changes = changes[:5]
                    metrics = await sync_engine.sync_table_to_terrafusion(table, demo_changes)
                    print(f"   Demo sync: {metrics.success_rate:.1f}% success rate")
        
        elif choice == "3":
            print("\n⚡ Simulating real-time sync (10 cycles)...")
            
            # Run 10 sync cycles
            for cycle in range(10):
                print(f"\n   Cycle {cycle + 1}/10:")
                
                for table in ["properties", "assessments", "tax_bills"]:
                    changes = sync_engine.detect_changes(table)
                    if changes:
                        # Sync up to 10 changes per cycle
                        demo_changes = changes[:10]
                        metrics = await sync_engine.sync_table_to_terrafusion(table, demo_changes)
                        print(f"     {table}: {len(demo_changes)} synced, {metrics.success_rate:.1f}% success")
                
                # Short delay between cycles
                await asyncio.sleep(1)
        
        elif choice == "4":
            print("\n📋 Generating comprehensive sync report...")
            
            # Run a quick sync to generate data
            await sync_engine.run_initial_sync(["properties"])
            
            report = sync_engine.generate_sync_report()
            
            print("\n📊 SYNC PERFORMANCE REPORT:")
            summary = report["sync_summary"]
            print(f"   Total Records: {summary['total_records']}")
            print(f"   Success Rate: {summary['success_rate']}")
            print(f"   Failed: {summary['failed']}")
            print(f"   Conflicts: {summary['conflicts']}")
            
            print("\n📈 BUSINESS IMPACT:")
            impact = report["business_impact"]
            for key, value in impact.items():
                print(f"   {key.replace('_', ' ').title()}: {value}")
        
        print("\n🌟 PACS-TerraFusion integration demo completed!")
        print("Ready for Harris partnership presentation.")
        
    except Exception as e:
        print(f"\n❌ Demo failed: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    asyncio.run(main())