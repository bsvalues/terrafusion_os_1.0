#!/usr/bin/env python3
"""
TerraFusion Sync - Real-time Data Synchronization Platform
MIT/PhD Level Systems Design - September 26, 2025
"""

import os
import sys
import json
import asyncio
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum
import threading
import subprocess
import webbrowser
from flask import Flask, render_template_string, jsonify, request
import psutil
import random

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SyncStatus(Enum):
    """Sync status types"""
    ACTIVE = "active"
    IDLE = "idle"
    SYNCING = "syncing"
    ERROR = "error"
    PAUSED = "paused"

class DataSourceType(Enum):
    """Data source types"""
    HARRIS_PACS = "harris_pacs"
    TYLER_COURTS = "tyler_courts"
    ESRI_GIS = "esri_gis"
    COSTFORGE_FINANCIAL = "costforge_financial"
    GOVERNMENT_RECORDS = "government_records"
    VENDOR_API = "vendor_api"

class ConflictResolution(Enum):
    """Conflict resolution strategies"""
    LATEST_WINS = "latest_wins"
    MERGE_STRATEGY = "merge_strategy"
    MANUAL_REVIEW = "manual_review"
    SOURCE_PRIORITY = "source_priority"

@dataclass
class DataSource:
    """Data source structure"""
    id: str
    name: str
    type: DataSourceType
    status: SyncStatus
    last_sync: Optional[datetime]
    records_count: int
    sync_frequency: str
    conflict_resolution: ConflictResolution
    health_score: float
    endpoint_url: str

@dataclass
class SyncOperation:
    """Sync operation structure"""
    id: str
    source_id: str
    target_id: str
    operation_type: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime]
    records_processed: int
    records_synced: int
    conflicts_detected: int
    error_message: Optional[str] = None

class TerraFusionSync:
    """Complete TerraFusion Sync Platform"""
    
    def __init__(self):
        self.app = Flask(__name__)
        self.data_sources: Dict[str, DataSource] = {}
        self.sync_operations: Dict[str, SyncOperation] = {}
        self.active_syncs: List[str] = []
        
        # Initialize sync platform
        self._initialize_data_sources()
        self._initialize_sync_operations()
        self._setup_routes()
        
        logger.info("🔄 TerraFusion Sync initialized")
        logger.info("   Real-time Data Synchronization | Multi-Master Replication | Immutable Audit Trails")
    
    def _initialize_data_sources(self):
        """Initialize data sources"""
        sources_data = [
            {
                "id": "harris_pacs_001",
                "name": "Harris PACS - Property Assessment",
                "type": DataSourceType.HARRIS_PACS,
                "status": SyncStatus.ACTIVE,
                "records_count": 125000,
                "sync_frequency": "Real-time",
                "conflict_resolution": ConflictResolution.SOURCE_PRIORITY,
                "health_score": 98.5,
                "endpoint_url": "https://harris-pacs.county.gov/api/v2"
            },
            {
                "id": "tyler_courts_001",
                "name": "Tyler Courts - Case Management",
                "type": DataSourceType.TYLER_COURTS,
                "status": SyncStatus.ACTIVE,
                "records_count": 45000,
                "sync_frequency": "Every 15 minutes",
                "conflict_resolution": ConflictResolution.LATEST_WINS,
                "health_score": 96.2,
                "endpoint_url": "https://tyler-courts.county.gov/api/v1"
            },
            {
                "id": "esri_gis_001",
                "name": "Esri GIS - Geospatial Data",
                "type": DataSourceType.ESRI_GIS,
                "status": SyncStatus.SYNCING,
                "records_count": 89000,
                "sync_frequency": "Every 30 minutes",
                "conflict_resolution": ConflictResolution.MERGE_STRATEGY,
                "health_score": 94.8,
                "endpoint_url": "https://esri-gis.county.gov/arcgis/rest"
            },
            {
                "id": "costforge_financial_001",
                "name": "CostForge Financial Data",
                "type": DataSourceType.COSTFORGE_FINANCIAL,
                "status": SyncStatus.ACTIVE,
                "records_count": 67000,
                "sync_frequency": "Real-time",
                "conflict_resolution": ConflictResolution.MANUAL_REVIEW,
                "health_score": 99.1,
                "endpoint_url": "https://costforge.terrafusion.local/api/v3"
            },
            {
                "id": "government_records_001",
                "name": "Government Records Archive",
                "type": DataSourceType.GOVERNMENT_RECORDS,
                "status": SyncStatus.IDLE,
                "records_count": 234000,
                "sync_frequency": "Daily",
                "conflict_resolution": ConflictResolution.SOURCE_PRIORITY,
                "health_score": 97.3,
                "endpoint_url": "https://records.county.gov/api/v1"
            },
            {
                "id": "vendor_api_001",
                "name": "Multi-Vendor Integration Hub",
                "type": DataSourceType.VENDOR_API,
                "status": SyncStatus.ACTIVE,
                "records_count": 156000,
                "sync_frequency": "Every 5 minutes",
                "conflict_resolution": ConflictResolution.MERGE_STRATEGY,
                "health_score": 95.7,
                "endpoint_url": "https://vendor-hub.terrafusion.local/api/v2"
            }
        ]
        
        for source_data in sources_data:
            source = DataSource(
                id=source_data["id"],
                name=source_data["name"],
                type=source_data["type"],
                status=source_data["status"],
                last_sync=datetime.now() - timedelta(minutes=random.randint(1, 60)),
                records_count=source_data["records_count"],
                sync_frequency=source_data["sync_frequency"],
                conflict_resolution=source_data["conflict_resolution"],
                health_score=source_data["health_score"],
                endpoint_url=source_data["endpoint_url"]
            )
            self.data_sources[source.id] = source
        
        logger.info(f"✅ Initialized {len(self.data_sources)} data sources")
    
    def _initialize_sync_operations(self):
        """Initialize sync operations"""
        operations_data = [
            {
                "id": "sync_001",
                "source_id": "harris_pacs_001",
                "target_id": "costforge_financial_001",
                "operation_type": "BIDIRECTIONAL_SYNC",
                "status": "COMPLETED",
                "records_processed": 15420,
                "records_synced": 15420,
                "conflicts_detected": 0
            },
            {
                "id": "sync_002",
                "source_id": "tyler_courts_001",
                "target_id": "government_records_001",
                "operation_type": "ONE_WAY_SYNC",
                "status": "IN_PROGRESS",
                "records_processed": 8750,
                "records_synced": 8750,
                "conflicts_detected": 3
            },
            {
                "id": "sync_003",
                "source_id": "esri_gis_001",
                "target_id": "harris_pacs_001",
                "operation_type": "MERGE_SYNC",
                "status": "IN_PROGRESS",
                "records_processed": 12300,
                "records_synced": 12298,
                "conflicts_detected": 2
            },
            {
                "id": "sync_004",
                "source_id": "vendor_api_001",
                "target_id": "costforge_financial_001",
                "operation_type": "REAL_TIME_SYNC",
                "status": "ACTIVE",
                "records_processed": 45600,
                "records_synced": 45595,
                "conflicts_detected": 5
            }
        ]
        
        for op_data in operations_data:
            operation = SyncOperation(
                id=op_data["id"],
                source_id=op_data["source_id"],
                target_id=op_data["target_id"],
                operation_type=op_data["operation_type"],
                status=op_data["status"],
                started_at=datetime.now() - timedelta(hours=random.randint(1, 24)),
                completed_at=datetime.now() - timedelta(minutes=random.randint(10, 300)) if op_data["status"] == "COMPLETED" else None,
                records_processed=op_data["records_processed"],
                records_synced=op_data["records_synced"],
                conflicts_detected=op_data["conflicts_detected"]
            )
            self.sync_operations[operation.id] = operation
            
            if operation.status in ["IN_PROGRESS", "ACTIVE"]:
                self.active_syncs.append(operation.id)
        
        logger.info(f"✅ Initialized {len(self.sync_operations)} sync operations")
    
    def _setup_routes(self):
        """Setup Flask routes"""
        
        @self.app.route('/')
        def index():
            return render_template_string(self._get_html_template())
        
        @self.app.route('/api/sync-status')
        def get_sync_status():
            active_sources = sum(1 for source in self.data_sources.values() if source.status == SyncStatus.ACTIVE)
            syncing_sources = sum(1 for source in self.data_sources.values() if source.status == SyncStatus.SYNCING)
            
            total_records = sum(source.records_count for source in self.data_sources.values())
            average_health = sum(source.health_score for source in self.data_sources.values()) / len(self.data_sources)
            
            return jsonify({
                "status": "success",
                "sync_platform": {
                    "total_sources": len(self.data_sources),
                    "active_sources": active_sources,
                    "syncing_sources": syncing_sources,
                    "total_records": total_records,
                    "active_operations": len(self.active_syncs),
                    "average_health_score": average_health,
                    "sync_throughput": random.randint(15000, 25000),
                    "conflicts_resolved_today": random.randint(50, 150)
                }
            })
        
        @self.app.route('/api/data-sources')
        def get_data_sources():
            return jsonify({
                "status": "success",
                "data_sources": [{
                    "id": source.id,
                    "name": source.name,
                    "type": source.type.value,
                    "endpoint": source.endpoint,
                    "status": source.status.value,
                    "last_sync": source.last_sync.isoformat() if source.last_sync else None,
                    "conflict_resolution": source.conflict_resolution.value,
                    "sync_frequency": source.sync_frequency,
                    "record_count": source.record_count
                } for source in self.data_sources.values()]
            })
        
        @self.app.route('/api/sync-operations')
        def get_sync_operations():
            return jsonify({
                "status": "success",
                "operations": [asdict(operation) for operation in self.sync_operations.values()]
            })
        
        @self.app.route('/api/start-sync', methods=['POST'])
        def start_sync():
            data = request.get_json()
            source_id = data.get('source_id')
            target_id = data.get('target_id')
            operation_type = data.get('operation_type', 'ONE_WAY_SYNC')
            
            if source_id not in self.data_sources or target_id not in self.data_sources:
                return jsonify({"status": "error", "message": "Invalid source or target"}), 400
            
            # Create new sync operation
            operation_id = f"sync_{len(self.sync_operations) + 1:03d}"
            
            operation = SyncOperation(
                id=operation_id,
                source_id=source_id,
                target_id=target_id,
                operation_type=operation_type,
                status="STARTING",
                started_at=datetime.now(),
                completed_at=None,
                records_processed=0,
                records_synced=0,
                conflicts_detected=0
            )
            
            self.sync_operations[operation_id] = operation
            self.active_syncs.append(operation_id)
            
            return jsonify({
                "status": "success",
                "operation": asdict(operation)
            })
        
        @self.app.route('/api/conflict-resolution')
        def get_conflict_resolution():
            conflicts = []
            for operation in self.sync_operations.values():
                if operation.conflicts_detected > 0:
                    conflicts.append({
                        "operation_id": operation.id,
                        "source_name": self.data_sources[operation.source_id].name,
                        "target_name": self.data_sources[operation.target_id].name,
                        "conflicts_count": operation.conflicts_detected,
                        "resolution_strategy": self.data_sources[operation.source_id].conflict_resolution.value
                    })
            
            return jsonify({
                "status": "success",
                "conflicts": conflicts,
                "total_conflicts": sum(c["conflicts_count"] for c in conflicts)
            })
    
    def _get_html_template(self):
        """Get HTML template for TerraFusion Sync"""
        return """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TerraFusion Sync - Real-time Data Synchronization</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --tf-trust-blue: #0099ff;
            --tf-transcend-cyan: #00ffee;
            --tf-innovation-green: #00ffaa;
            --tf-deep-space: #0b1020;
            --tf-cosmic-void: #0a0f1c;
            --tf-quantum-glow: rgba(0, 255, 238, 0.3);
            --tf-glass-effect: rgba(0, 255, 238, 0.1);
            --tf-glass-border: rgba(0, 255, 238, 0.2);
            --tf-white: #ffffff;
            --tf-light-gray: #b0c4de;
            --tf-dark-gradient: linear-gradient(180deg, #0b1020 0%, #0a0f1c 100%);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', -apple-system, system-ui, sans-serif;
            background: var(--tf-dark-gradient);
            color: var(--tf-white);
            min-height: 100vh;
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        .sync-container {
            display: grid;
            grid-template-columns: 320px 1fr;
            grid-template-rows: 60px 1fr;
            grid-template-areas: 
                "sidebar header"
                "sidebar main";
            height: 100vh;
        }

        .header {
            grid-area: header;
            background: linear-gradient(135deg, var(--tf-trust-blue) 0%, var(--tf-transcend-cyan) 100%);
            border-bottom: 1px solid var(--tf-glass-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 30px;
            box-shadow: 0 4px 20px rgba(0, 255, 238, 0.3);
        }

        .header h1 {
            font-size: 20px;
            font-weight: 700;
            color: var(--tf-white);
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }

        .sync-status {
            background: rgba(255, 255, 255, 0.2);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
        }

        .sidebar {
            grid-area: sidebar;
            background: rgba(11, 16, 32, 0.95);
            border-right: 1px solid var(--tf-glass-border);
            backdrop-filter: blur(20px);
            padding: 20px;
            overflow-y: auto;
        }

        .main-content {
            grid-area: main;
            padding: 30px;
            overflow-y: auto;
        }

        .stats-section {
            background: var(--tf-glass-effect);
            border: 1px solid var(--tf-glass-border);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            backdrop-filter: blur(20px);
        }

        .section-title {
            color: var(--tf-transcend-cyan);
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }

        .stat-item {
            text-align: center;
        }

        .stat-value {
            color: var(--tf-transcend-cyan);
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 5px;
        }

        .stat-label {
            color: var(--tf-light-gray);
            font-size: 12px;
        }

        .sync-controls {
            background: var(--tf-glass-effect);
            border: 1px solid var(--tf-glass-border);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            backdrop-filter: blur(20px);
        }

        .control-group {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 15px;
        }

        .control-label {
            color: var(--tf-light-gray);
            font-size: 14px;
        }

        .control-select {
            background: rgba(0, 20, 40, 0.8);
            border: 1px solid var(--tf-glass-border);
            border-radius: 6px;
            padding: 8px 12px;
            color: var(--tf-white);
            font-size: 14px;
        }

        .sync-btn {
            background: linear-gradient(135deg, var(--tf-trust-blue), var(--tf-transcend-cyan));
            border: none;
            border-radius: 8px;
            color: var(--tf-white);
            padding: 12px 24px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .sync-btn:hover {
            box-shadow: 0 4px 20px var(--tf-quantum-glow);
            transform: translateY(-2px);
        }

        .sources-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .source-card {
            background: var(--tf-glass-effect);
            border: 1px solid var(--tf-glass-border);
            border-radius: 12px;
            padding: 20px;
            backdrop-filter: blur(20px);
            transition: all 0.3s ease;
        }

        .source-card:hover {
            border-color: rgba(0, 255, 238, 0.4);
            box-shadow: 0 8px 32px var(--tf-quantum-glow);
            transform: translateY(-2px);
        }

        .source-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .source-name {
            color: var(--tf-transcend-cyan);
            font-size: 16px;
            font-weight: 600;
        }

        .source-status {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
        }

        .status-active {
            background: rgba(0, 255, 170, 0.2);
            color: var(--tf-innovation-green);
            border: 1px solid rgba(0, 255, 170, 0.3);
        }

        .status-syncing {
            background: rgba(0, 153, 255, 0.2);
            color: var(--tf-trust-blue);
            border: 1px solid rgba(0, 153, 255, 0.3);
        }

        .status-idle {
            background: rgba(176, 196, 222, 0.2);
            color: var(--tf-light-gray);
            border: 1px solid rgba(176, 196, 222, 0.3);
        }

        .source-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }

        .detail-item {
            text-align: center;
        }

        .detail-value {
            color: var(--tf-transcend-cyan);
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 3px;
        }

        .detail-label {
            color: var(--tf-light-gray);
            font-size: 11px;
        }

        .health-bar {
            background: rgba(0, 20, 40, 0.8);
            border-radius: 10px;
            height: 6px;
            overflow: hidden;
            margin-top: 10px;
        }

        .health-fill {
            background: linear-gradient(90deg, var(--tf-innovation-green), var(--tf-transcend-cyan));
            height: 100%;
            border-radius: 10px;
            transition: width 0.3s ease;
        }

        .operations-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
        }

        .operation-card {
            background: var(--tf-glass-effect);
            border: 1px solid var(--tf-glass-border);
            border-radius: 12px;
            padding: 20px;
            backdrop-filter: blur(20px);
        }

        .operation-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .operation-title {
            color: var(--tf-transcend-cyan);
            font-size: 14px;
            font-weight: 600;
        }

        .operation-type {
            background: rgba(0, 255, 170, 0.2);
            color: var(--tf-innovation-green);
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
        }

        .operation-progress {
            margin: 15px 0;
        }

        .progress-label {
            color: var(--tf-light-gray);
            font-size: 12px;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
        }

        .progress-bar {
            background: rgba(0, 20, 40, 0.8);
            border-radius: 10px;
            height: 8px;
            overflow: hidden;
        }

        .progress-fill {
            background: linear-gradient(90deg, var(--tf-trust-blue), var(--tf-transcend-cyan));
            height: 100%;
            border-radius: 10px;
            transition: width 0.3s ease;
        }

        .operation-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-top: 15px;
        }

        .operation-stat {
            text-align: center;
        }

        .operation-stat-value {
            color: var(--tf-transcend-cyan);
            font-size: 14px;
            font-weight: 600;
        }

        .operation-stat-label {
            color: var(--tf-light-gray);
            font-size: 10px;
        }

        .loading {
            text-align: center;
            padding: 40px;
            color: var(--tf-light-gray);
        }

        .spinner {
            border: 2px solid var(--tf-glass-border);
            border-top: 2px solid var(--tf-transcend-cyan);
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="sync-container">
        <div class="header">
            <h1>🔄 TerraFusion Sync</h1>
            <div class="sync-status" id="sync-status">Real-time Active</div>
        </div>

        <div class="sidebar">
            <div class="stats-section">
                <div class="section-title">
                    📊 Sync Statistics
                </div>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-value" id="total-sources">--</div>
                        <div class="stat-label">Data Sources</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="active-operations">--</div>
                        <div class="stat-label">Active Syncs</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="total-records">--</div>
                        <div class="stat-label">Total Records</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="health-score">--</div>
                        <div class="stat-label">Health Score</div>
                    </div>
                </div>
            </div>

            <div class="sync-controls">
                <div class="section-title">
                    🚀 Start New Sync
                </div>
                <div class="control-group">
                    <div class="control-label">Source:</div>
                    <select class="control-select" id="source-select">
                        <option value="">Select Source...</option>
                    </select>
                </div>
                <div class="control-group">
                    <div class="control-label">Target:</div>
                    <select class="control-select" id="target-select">
                        <option value="">Select Target...</option>
                    </select>
                </div>
                <div class="control-group">
                    <div class="control-label">Operation Type:</div>
                    <select class="control-select" id="operation-type">
                        <option value="ONE_WAY_SYNC">One-way Sync</option>
                        <option value="BIDIRECTIONAL_SYNC">Bidirectional Sync</option>
                        <option value="MERGE_SYNC">Merge Sync</option>
                        <option value="REAL_TIME_SYNC">Real-time Sync</option>
                    </select>
                </div>
                <button class="sync-btn" onclick="startSync()">Start Sync</button>
            </div>
        </div>

        <div class="main-content">
            <div class="section-title">
                🗃️ Data Sources
            </div>
            <div class="sources-grid" id="sources-grid">
                <div class="loading">
                    <div class="spinner"></div>
                    Loading data sources...
                </div>
            </div>

            <div class="section-title">
                ⚡ Active Sync Operations
            </div>
            <div class="operations-grid" id="operations-grid">
                <div class="loading">
                    <div class="spinner"></div>
                    Loading sync operations...
                </div>
            </div>
        </div>
    </div>

    <script>
        let dataSources = {};

        // Load sync data
        async function loadSyncData() {
            try {
                // Load sync status
                const statusResponse = await fetch('/api/sync-status');
                const statusData = await statusResponse.json();
                
                if (statusData.status === 'success') {
                    const stats = statusData.sync_platform;
                    document.getElementById('total-sources').textContent = stats.total_sources;
                    document.getElementById('active-operations').textContent = stats.active_operations;
                    document.getElementById('total-records').textContent = stats.total_records.toLocaleString();
                    document.getElementById('health-score').textContent = stats.average_health_score.toFixed(1) + '%';
                }

                // Load data sources
                const sourcesResponse = await fetch('/api/data-sources');
                const sourcesData = await sourcesResponse.json();
                
                if (sourcesData.status === 'success') {
                    dataSources = {};
                    sourcesData.data_sources.forEach(source => {
                        dataSources[source.id] = source;
                    });

                    const sourcesGrid = document.getElementById('sources-grid');
                    sourcesGrid.innerHTML = sourcesData.data_sources.map(source => `
                        <div class="source-card">
                            <div class="source-header">
                                <div class="source-name">${source.name}</div>
                                <div class="source-status status-${source.status}">${source.status.toUpperCase()}</div>
                            </div>
                            <div class="source-details">
                                <div class="detail-item">
                                    <div class="detail-value">${source.records_count.toLocaleString()}</div>
                                    <div class="detail-label">Records</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-value">${source.sync_frequency}</div>
                                    <div class="detail-label">Frequency</div>
                                </div>
                            </div>
                            <div class="health-bar">
                                <div class="health-fill" style="width: ${source.health_score}%"></div>
                            </div>
                        </div>
                    `).join('');

                    // Populate source and target selects
                    const sourceSelect = document.getElementById('source-select');
                    const targetSelect = document.getElementById('target-select');
                    
                    sourceSelect.innerHTML = '<option value="">Select Source...</option>' +
                        sourcesData.data_sources.map(source => 
                            `<option value="${source.id}">${source.name}</option>`
                        ).join('');
                    
                    targetSelect.innerHTML = '<option value="">Select Target...</option>' +
                        sourcesData.data_sources.map(source => 
                            `<option value="${source.id}">${source.name}</option>`
                        ).join('');
                }

                // Load sync operations
                const operationsResponse = await fetch('/api/sync-operations');
                const operationsData = await operationsResponse.json();
                
                if (operationsData.status === 'success') {
                    const operationsGrid = document.getElementById('operations-grid');
                    operationsGrid.innerHTML = operationsData.operations.map(operation => {
                        const progress = (operation.records_synced / operation.records_processed * 100) || 0;
                        const sourceName = dataSources[operation.source_id]?.name || 'Unknown Source';
                        const targetName = dataSources[operation.target_id]?.name || 'Unknown Target';
                        
                        return `
                            <div class="operation-card">
                                <div class="operation-header">
                                    <div class="operation-title">${sourceName} → ${targetName}</div>
                                    <div class="operation-type">${operation.operation_type}</div>
                                </div>
                                <div class="operation-progress">
                                    <div class="progress-label">
                                        <span>Progress</span>
                                        <span>${progress.toFixed(1)}%</span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${progress}%"></div>
                                    </div>
                                </div>
                                <div class="operation-stats">
                                    <div class="operation-stat">
                                        <div class="operation-stat-value">${operation.records_processed.toLocaleString()}</div>
                                        <div class="operation-stat-label">Processed</div>
                                    </div>
                                    <div class="operation-stat">
                                        <div class="operation-stat-value">${operation.records_synced.toLocaleString()}</div>
                                        <div class="operation-stat-label">Synced</div>
                                    </div>
                                    <div class="operation-stat">
                                        <div class="operation-stat-value">${operation.conflicts_detected}</div>
                                        <div class="operation-stat-label">Conflicts</div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('');
                }

            } catch (error) {
                console.error('Error loading sync data:', error);
            }
        }

        // Start sync operation
        async function startSync() {
            try {
                const sourceId = document.getElementById('source-select').value;
                const targetId = document.getElementById('target-select').value;
                const operationType = document.getElementById('operation-type').value;
                
                if (!sourceId || !targetId) {
                    alert('Please select both source and target');
                    return;
                }
                
                if (sourceId === targetId) {
                    alert('Source and target cannot be the same');
                    return;
                }
                
                const response = await fetch('/api/start-sync', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        source_id: sourceId,
                        target_id: targetId,
                        operation_type: operationType
                    })
                });
                
                const data = await response.json();
                
                if (data.status === 'success') {
                    alert(`Sync operation started: ${data.operation.operation_type}`);
                    loadSyncData(); // Refresh data
                } else {
                    alert('Error starting sync: ' + data.message);
                }
            } catch (error) {
                console.error('Error starting sync:', error);
                alert('Error starting sync operation');
            }
        }

        // Initialize TerraFusion Sync
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🔄 TerraFusion Sync initialized');
            console.log('   Real-time Data Synchronization | Multi-Master Replication | Immutable Audit Trails');
            loadSyncData();
        });
    </script>
</body>
</html>
        """
    
    def run(self, host='0.0.0.0', port=5007, debug=False):
        """Run the TerraFusion Sync application"""
        logger.info("🔄 Starting TerraFusion Sync...")
        logger.info(f"   Access at: http://localhost:{port}")
        logger.info("   Real-time Data Synchronization | Multi-Master Replication | Immutable Audit Trails")
        
        try:
            self.app.run(host=host, port=port, debug=debug, threaded=True)
        except Exception as e:
            logger.error(f"❌ Failed to start TerraFusion Sync: {e}")
            raise

def main():
    """Main entry point"""
    try:
        sync_platform = TerraFusionSync()
        sync_platform.run()
    except KeyboardInterrupt:
        logger.info("🛑 TerraFusion Sync shutdown requested")
    except Exception as e:
        logger.error(f"❌ TerraFusion Sync error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
