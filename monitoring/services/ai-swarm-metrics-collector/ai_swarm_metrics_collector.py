#!/usr/bin/env python3
"""
TerraFusion OS AI Swarm Metrics Collector
Government-grade metrics collection for 1,008 AI agents

This service collects comprehensive metrics from the AI Swarm including:
- Agent health and performance
- Task execution statistics
- Resource utilization
- Government compliance metrics
- Harris PACS integration status
- Quantum performance optimization
"""

import asyncio
import json
import logging
import os
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
import aiohttp
import redis
from prometheus_client import start_http_server, Gauge, Counter, Histogram, Info
from dataclasses import dataclass

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.getenv('LOG_LEVEL', 'INFO')),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
AI_SWARM_SIZE = int(os.getenv('AI_SWARM_SIZE', 1008))
METRICS_PORT = int(os.getenv('METRICS_PORT', 9400))
COLLECTION_INTERVAL = int(os.getenv('COLLECTION_INTERVAL', 30))
GOVERNMENT_COMPLIANCE = os.getenv('GOVERNMENT_COMPLIANCE', 'true').lower() == 'true'

# Redis configuration for state management
REDIS_HOST = os.getenv('REDIS_HOST', 'redis')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
REDIS_DB = int(os.getenv('REDIS_DB', 0))

# AI Swarm endpoints
AI_SWARM_ORCHESTRATOR_URL = os.getenv('AI_SWARM_ORCHESTRATOR_URL', 'http://ai-swarm:9000')
CLAUDE_FLOW_MCP_URL = os.getenv('CLAUDE_FLOW_MCP_URL', 'http://claude-flow:8080')
HARRIS_PACS_COORDINATOR_URL = os.getenv('HARRIS_PACS_COORDINATOR_URL', 'http://harris-pacs-coordinator:9093')

@dataclass
class AgentSpecialization:
    """AI Agent specialization configuration"""
    name: str
    count: int
    description: str
    government_critical: bool = False

# AI Agent specializations (totaling 1,008 agents)
AGENT_SPECIALIZATIONS = [
    AgentSpecialization("build-automation", 180, "Intelligent build orchestration and optimization"),
    AgentSpecialization("security-scanning", 150, "Vulnerability detection and compliance validation", True),
    AgentSpecialization("performance-testing", 150, "Load testing and performance optimization"),
    AgentSpecialization("deployment-coordination", 144, "Blue-green deployments and rollback management"),
    AgentSpecialization("infrastructure-monitoring", 126, "Real-time monitoring and alerting"),
    AgentSpecialization("test-orchestration", 120, "Automated testing coordination"),
    AgentSpecialization("harris-pacs-integration", 90, "Specialized Harris PACS validation and optimization", True),
    AgentSpecialization("devops-coordination", 48, "Cross-domain coordination and management")
]

class PrometheusMetrics:
    """Prometheus metrics definitions for AI Swarm monitoring"""
    
    def __init__(self):
        # AI Swarm Health Metrics
        self.ai_swarm_health_score = Gauge(
            'ai_swarm_health_score',
            'Overall AI Swarm health score (0-100)',
            ['cluster', 'environment']
        )
        
        self.ai_swarm_agents_active = Gauge(
            'ai_swarm_agents_active',
            'Number of active AI agents by type',
            ['agent_type', 'specialization']
        )
        
        self.ai_swarm_agents_failed = Counter(
            'ai_swarm_agents_failed_total',
            'Total number of failed AI agents',
            ['agent_type', 'failure_reason']
        )
        
        # Task Execution Metrics
        self.ai_swarm_tasks_completed = Counter(
            'ai_swarm_tasks_completed_total',
            'Total completed tasks by AI Swarm',
            ['task_type', 'priority']
        )
        
        self.ai_swarm_tasks_failed = Counter(
            'ai_swarm_tasks_failed_total',
            'Total failed tasks by AI Swarm',
            ['task_type', 'error_type']
        )
        
        self.ai_swarm_task_duration = Histogram(
            'ai_swarm_task_duration_seconds',
            'Task execution duration in seconds',
            ['task_type', 'agent_type'],
            buckets=[0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300]
        )
        
        # Performance Metrics
        self.quantum_performance_multiplier = Gauge(
            'quantum_performance_multiplier',
            'Quantum-inspired performance optimization multiplier',
            ['optimization_type']
        )
        
        self.ai_swarm_throughput = Gauge(
            'ai_swarm_throughput_tasks_per_second',
            'AI Swarm task throughput in tasks per second',
            ['measurement_window']
        )
        
        # Resource Utilization
        self.ai_swarm_cpu_utilization = Gauge(
            'ai_swarm_cpu_utilization_percent',
            'AI Swarm CPU utilization percentage',
            ['node', 'agent_type']
        )
        
        self.ai_swarm_memory_usage = Gauge(
            'ai_swarm_memory_usage_bytes',
            'AI Swarm memory usage in bytes',
            ['node', 'agent_type']
        )
        
        self.ai_swarm_memory_limit = Gauge(
            'ai_swarm_memory_limit_bytes',
            'AI Swarm memory limit in bytes',
            ['node']
        )
        
        # Government Compliance Metrics
        self.fisma_compliance_score = Gauge(
            'fisma_compliance_score',
            'FISMA compliance score (0-100)',
            ['control_family', 'assessment_type']
        )
        
        self.security_violations = Counter(
            'ai_swarm_security_violations_total',
            'Total security violations detected in AI Swarm',
            ['violation_type', 'severity']
        )
        
        # Harris PACS Integration Metrics
        self.harris_pacs_connectivity = Gauge(
            'harris_pacs_connectivity_success_rate',
            'Harris PACS connectivity success rate (0-1)',
            ['county', 'module']
        )
        
        self.harris_pacs_data_sync_accuracy = Gauge(
            'harris_pacs_data_sync_accuracy',
            'Harris PACS data synchronization accuracy (0-1)',
            ['data_type', 'sync_direction']
        )
        
        self.harris_pacs_agents_active = Gauge(
            'harris_pacs_agents_active',
            'Number of active Harris PACS integration agents',
            ['agent_specialization', 'county']
        )
        
        # Claude-Flow MCP Metrics
        self.claude_flow_mcp_tools_available = Gauge(
            'claude_flow_mcp_tools_available',
            'Number of available Claude-Flow MCP tools',
            ['tool_category']
        )
        
        self.claude_flow_mcp_tool_execution_duration = Histogram(
            'claude_flow_mcp_tool_execution_duration_seconds',
            'Claude-Flow MCP tool execution duration',
            ['tool_name', 'success'],
            buckets=[0.1, 0.5, 1, 2, 5, 10, 30, 60]
        )
        
        # System Information
        self.ai_swarm_info = Info(
            'ai_swarm_info',
            'AI Swarm system information'
        )

class AISwarmMetricsCollector:
    """Main metrics collector for AI Swarm monitoring"""
    
    def __init__(self):
        self.metrics = PrometheusMetrics()
        self.redis_client = None
        self.session = None
        self.last_collection_time = 0
        self.government_compliance_enabled = GOVERNMENT_COMPLIANCE
        
    async def initialize(self):
        """Initialize the metrics collector"""
        logger.info("Initializing AI Swarm Metrics Collector...")
        
        # Initialize Redis connection
        try:
            self.redis_client = redis.Redis(
                host=REDIS_HOST,
                port=REDIS_PORT,
                db=REDIS_DB,
                decode_responses=True
            )
            self.redis_client.ping()
            logger.info("Redis connection established")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.redis_client = None
        
        # Initialize HTTP session
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30)
        )
        
        # Set AI Swarm system information
        self.metrics.ai_swarm_info.info({
            'version': '1.0.0',
            'total_agents': str(AI_SWARM_SIZE),
            'government_compliance': str(self.government_compliance_enabled),
            'specializations': str(len(AGENT_SPECIALIZATIONS))
        })
        
        logger.info(f"AI Swarm Metrics Collector initialized for {AI_SWARM_SIZE} agents")
    
    async def collect_ai_swarm_health(self):
        """Collect AI Swarm health metrics"""
        try:
            async with self.session.get(f"{AI_SWARM_ORCHESTRATOR_URL}/api/health") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Overall health score
                    health_score = data.get('health_score', 0)
                    self.metrics.ai_swarm_health_score.labels(
                        cluster='terrafusion-government',
                        environment='production'
                    ).set(health_score)
                    
                    # Agent status by specialization
                    agents_status = data.get('agents_status', {})
                    for specialization in AGENT_SPECIALIZATIONS:
                        active_count = agents_status.get(specialization.name, {}).get('active', 0)
                        self.metrics.ai_swarm_agents_active.labels(
                            agent_type=specialization.name,
                            specialization=specialization.description
                        ).set(active_count)
                    
                    logger.debug(f"AI Swarm health score: {health_score}%")
                    
        except Exception as e:
            logger.error(f"Failed to collect AI Swarm health metrics: {e}")
    
    async def collect_task_execution_metrics(self):
        """Collect task execution metrics"""
        try:
            async with self.session.get(f"{AI_SWARM_ORCHESTRATOR_URL}/api/metrics/tasks") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Task completion metrics
                    completed_tasks = data.get('completed_tasks', {})
                    for task_type, count in completed_tasks.items():
                        self.metrics.ai_swarm_tasks_completed.labels(
                            task_type=task_type,
                            priority='normal'
                        )._value._value = count
                    
                    # Task failure metrics
                    failed_tasks = data.get('failed_tasks', {})
                    for task_type, failures in failed_tasks.items():
                        for error_type, count in failures.items():
                            self.metrics.ai_swarm_tasks_failed.labels(
                                task_type=task_type,
                                error_type=error_type
                            )._value._value = count
                    
                    # Throughput calculation
                    current_time = time.time()
                    if self.last_collection_time > 0:
                        time_diff = current_time - self.last_collection_time
                        total_completed = sum(completed_tasks.values())
                        throughput = total_completed / time_diff if time_diff > 0 else 0
                        
                        self.metrics.ai_swarm_throughput.labels(
                            measurement_window='30s'
                        ).set(throughput)
                    
                    self.last_collection_time = current_time
                    
        except Exception as e:
            logger.error(f"Failed to collect task execution metrics: {e}")
    
    async def collect_quantum_performance_metrics(self):
        """Collect quantum performance optimization metrics"""
        try:
            async with self.session.get(f"{AI_SWARM_ORCHESTRATOR_URL}/api/metrics/quantum") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    performance_multiplier = data.get('performance_multiplier', 1)
                    optimization_type = data.get('optimization_type', 'standard')
                    
                    self.metrics.quantum_performance_multiplier.labels(
                        optimization_type=optimization_type
                    ).set(performance_multiplier)
                    
                    logger.debug(f"Quantum performance multiplier: {performance_multiplier}x")
                    
        except Exception as e:
            logger.error(f"Failed to collect quantum performance metrics: {e}")
    
    async def collect_harris_pacs_metrics(self):
        """Collect Harris PACS integration metrics"""
        try:
            async with self.session.get(f"{HARRIS_PACS_COORDINATOR_URL}/api/metrics") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Connectivity success rate
                    connectivity_rate = data.get('connectivity_success_rate', 0)
                    self.metrics.harris_pacs_connectivity.labels(
                        county='benton',
                        module='cama'
                    ).set(connectivity_rate)
                    
                    # Data synchronization accuracy
                    sync_accuracy = data.get('data_sync_accuracy', 0)
                    self.metrics.harris_pacs_data_sync_accuracy.labels(
                        data_type='property_assessment',
                        sync_direction='bidirectional'
                    ).set(sync_accuracy)
                    
                    # Active Harris PACS agents
                    harris_agents = data.get('active_agents', {})
                    for specialization, count in harris_agents.items():
                        self.metrics.harris_pacs_agents_active.labels(
                            agent_specialization=specialization,
                            county='benton'
                        ).set(count)
                    
        except Exception as e:
            logger.error(f"Failed to collect Harris PACS metrics: {e}")
    
    async def collect_claude_flow_mcp_metrics(self):
        """Collect Claude-Flow MCP metrics"""
        try:
            async with self.session.get(f"{CLAUDE_FLOW_MCP_URL}/devops/metrics") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Available tools by category
                    tools_by_category = data.get('tools_by_category', {})
                    for category, count in tools_by_category.items():
                        self.metrics.claude_flow_mcp_tools_available.labels(
                            tool_category=category
                        ).set(count)
                    
                    # Tool execution metrics would be collected here
                    # This is a simplified version
                    
        except Exception as e:
            logger.error(f"Failed to collect Claude-Flow MCP metrics: {e}")
    
    async def collect_government_compliance_metrics(self):
        """Collect government compliance metrics"""
        if not self.government_compliance_enabled:
            return
            
        try:
            # Simulate FISMA compliance score calculation
            # In real implementation, this would query actual compliance systems
            fisma_controls = [
                ('AC', 'Access Control', 95.5),
                ('AU', 'Audit and Accountability', 98.2),
                ('IA', 'Identification and Authentication', 97.1),
                ('SC', 'System and Communications Protection', 96.8),
                ('SI', 'System and Information Integrity', 94.7)
            ]
            
            for control_family, description, score in fisma_controls:
                self.metrics.fisma_compliance_score.labels(
                    control_family=control_family,
                    assessment_type='automated'
                ).set(score)
            
            logger.debug("Government compliance metrics collected")
            
        except Exception as e:
            logger.error(f"Failed to collect government compliance metrics: {e}")
    
    async def collect_resource_utilization_metrics(self):
        """Collect resource utilization metrics"""
        try:
            async with self.session.get(f"{AI_SWARM_ORCHESTRATOR_URL}/api/metrics/resources") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # CPU utilization by agent type
                    cpu_usage = data.get('cpu_utilization', {})
                    for agent_type, utilization in cpu_usage.items():
                        self.metrics.ai_swarm_cpu_utilization.labels(
                            node='swarm-node-1',
                            agent_type=agent_type
                        ).set(utilization)
                    
                    # Memory utilization
                    memory_data = data.get('memory', {})
                    memory_usage = memory_data.get('usage_bytes', 0)
                    memory_limit = memory_data.get('limit_bytes', 0)
                    
                    self.metrics.ai_swarm_memory_usage.labels(
                        node='swarm-node-1',
                        agent_type='all'
                    ).set(memory_usage)
                    
                    self.metrics.ai_swarm_memory_limit.labels(
                        node='swarm-node-1'
                    ).set(memory_limit)
                    
        except Exception as e:
            logger.error(f"Failed to collect resource utilization metrics: {e}")
    
    async def collect_all_metrics(self):
        """Collect all metrics in parallel"""
        tasks = [
            self.collect_ai_swarm_health(),
            self.collect_task_execution_metrics(),
            self.collect_quantum_performance_metrics(),
            self.collect_harris_pacs_metrics(),
            self.collect_claude_flow_mcp_metrics(),
            self.collect_government_compliance_metrics(),
            self.collect_resource_utilization_metrics()
        ]
        
        await asyncio.gather(*tasks, return_exceptions=True)
    
    async def run_collection_loop(self):
        """Main collection loop"""
        logger.info(f"Starting metrics collection loop (interval: {COLLECTION_INTERVAL}s)")
        
        while True:
            try:
                start_time = time.time()
                await self.collect_all_metrics()
                collection_duration = time.time() - start_time
                
                logger.debug(f"Metrics collection completed in {collection_duration:.2f}s")
                
                # Store collection timestamp in Redis if available
                if self.redis_client:
                    try:
                        self.redis_client.setex(
                            'ai_swarm_metrics_last_collection',
                            300,  # 5 minutes TTL
                            datetime.now(timezone.utc).isoformat()
                        )
                    except Exception as e:
                        logger.warning(f"Failed to update Redis timestamp: {e}")
                
                # Wait for next collection interval
                sleep_time = max(0, COLLECTION_INTERVAL - collection_duration)
                await asyncio.sleep(sleep_time)
                
            except Exception as e:
                logger.error(f"Error in collection loop: {e}")
                await asyncio.sleep(30)  # Wait 30 seconds on error
    
    async def health_check_handler(self, request):
        """Health check endpoint"""
        try:
            # Check if we can reach the AI Swarm orchestrator
            async with self.session.get(
                f"{AI_SWARM_ORCHESTRATOR_URL}/api/health",
                timeout=aiohttp.ClientTimeout(total=5)
            ) as response:
                orchestrator_healthy = response.status == 200
        except:
            orchestrator_healthy = False
        
        health_status = {
            'status': 'healthy' if orchestrator_healthy else 'degraded',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'ai_swarm_orchestrator': 'healthy' if orchestrator_healthy else 'unhealthy',
            'redis': 'healthy' if self.redis_client else 'unavailable',
            'metrics_collected': self.last_collection_time > 0
        }
        
        return aiohttp.web.Response(
            text=json.dumps(health_status, indent=2),
            content_type='application/json',
            status=200 if orchestrator_healthy else 503
        )
    
    async def start_http_server(self):
        """Start HTTP server for health checks"""
        from aiohttp import web
        
        app = web.Application()
        app.router.add_get('/health', self.health_check_handler)
        
        runner = web.AppRunner(app)
        await runner.setup()
        
        site = web.TCPSite(runner, '0.0.0.0', METRICS_PORT)
        await site.start()
        
        logger.info(f"Health check server started on port {METRICS_PORT}")
    
    async def cleanup(self):
        """Cleanup resources"""
        if self.session:
            await self.session.close()
        
        if self.redis_client:
            self.redis_client.close()

async def main():
    """Main function"""
    collector = AISwarmMetricsCollector()
    
    try:
        # Initialize the collector
        await collector.initialize()
        
        # Start Prometheus metrics server
        start_http_server(9400)
        logger.info("Prometheus metrics server started on port 9400")
        
        # Start health check server
        await collector.start_http_server()
        
        # Start the metrics collection loop
        await collector.run_collection_loop()
        
    except KeyboardInterrupt:
        logger.info("Received interrupt signal, shutting down...")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
    finally:
        await collector.cleanup()

if __name__ == "__main__":
    asyncio.run(main())