#!/usr/bin/env python3
"""
TerraFusion OS Harris PACS Integration Test Orchestrator
Coordinates comprehensive testing of 90 specialized Harris PACS agents

This orchestrator manages:
- 15 Connectivity Specialist agents
- 20 Data Sync Expert agents  
- 15 Performance Analysis agents
- 12 Compliance Validation agents
- 15 Integration Testing agents
- 8 Monitoring Surveillance agents
- 5 Security Audit agents

Government compliance: FISMA, NIST, FIPS-140-2
County focus: Benton County, Washington
"""

import asyncio
import json
import logging
import os
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum
import aiohttp
import redis
from prometheus_client import start_http_server, Gauge, Counter, Histogram, Info

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.getenv('LOG_LEVEL', 'INFO')),
    format='%(asctime)s - %(name)s - %(levelname)s - [%(funcName)s] %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
TOTAL_HARRIS_PACS_AGENTS = int(os.getenv('TOTAL_HARRIS_PACS_AGENTS', 90))
BENTON_COUNTY_TEST_SUITE = os.getenv('BENTON_COUNTY_TEST_SUITE', 'comprehensive')
GOVERNMENT_COMPLIANCE_TESTING = os.getenv('GOVERNMENT_COMPLIANCE_TESTING', 'true').lower() == 'true'
PARALLEL_TEST_EXECUTION = os.getenv('PARALLEL_TEST_EXECUTION', 'true').lower() == 'true'

# Agent specialization configuration
@dataclass
class AgentSpecialization:
    name: str
    count: int
    endpoint_port: int
    description: str
    government_critical: bool = False
    test_scenarios: List[str] = None

# Harris PACS Agent Specializations (totaling 90 agents)
HARRIS_PACS_SPECIALIZATIONS = [
    AgentSpecialization(
        "connectivity", 15, 9510,
        "Endpoint health monitoring and connection validation",
        True,
        ["endpoint_health", "connection_timeout", "ssl_validation", "authentication_flow"]
    ),
    AgentSpecialization(
        "data-sync", 20, 9520,
        "Bidirectional data synchronization and integrity validation",
        True,
        ["bidirectional_sync", "data_integrity", "conflict_resolution", "batch_processing"]
    ),
    AgentSpecialization(
        "performance-analysis", 15, 9530,
        "Load testing and performance optimization analysis",
        False,
        ["load_testing", "stress_testing", "throughput_analysis", "latency_measurement"]
    ),
    AgentSpecialization(
        "compliance-validation", 12, 9540,
        "Government compliance verification and audit",
        True,
        ["fisma_controls", "audit_logging", "data_encryption", "access_control"]
    ),
    AgentSpecialization(
        "integration-testing", 15, 9550,
        "End-to-end workflow and error handling validation",
        True,
        ["end_to_end_workflows", "error_handling", "rollback_procedures", "disaster_recovery"]
    ),
    AgentSpecialization(
        "monitoring-surveillance", 8, 9560,
        "Real-time monitoring and anomaly detection",
        False,
        ["real_time_monitoring", "alert_generation", "anomaly_detection", "health_checks"]
    ),
    AgentSpecialization(
        "security-audit", 5, 9570,
        "Security penetration testing and vulnerability assessment",
        True,
        ["penetration_testing", "vulnerability_scanning", "access_control_validation", "encryption_verification"]
    )
]

class TestStatus(Enum):
    PENDING = "pending"
    RUNNING = "running" 
    COMPLETED = "completed"
    FAILED = "failed"
    TIMEOUT = "timeout"

class ComplianceFramework(Enum):
    FISMA = "FISMA"
    NIST = "NIST"
    FIPS_140_2 = "FIPS-140-2"
    SECTION_508 = "Section-508"

@dataclass
class TestExecution:
    test_id: str
    specialization: str
    scenario: str
    status: TestStatus
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_ms: Optional[int] = None
    success_rate: Optional[float] = None
    error_message: Optional[str] = None
    compliance_score: Optional[float] = None
    metrics: Dict[str, Any] = None

@dataclass
class BentonCountyTestSuite:
    """Benton County specific test scenarios"""
    property_assessment: List[str]
    tax_calculation: List[str]
    ownership_transfer: List[str]
    harris_pacs_modules: List[str]
    
    @classmethod
    def default(cls):
        return cls(
            property_assessment=[
                "residential_property_valuation",
                "commercial_property_assessment", 
                "agricultural_land_valuation",
                "improvement_assessment",
                "exemption_processing"
            ],
            tax_calculation=[
                "levy_calculation",
                "tax_rate_application",
                "exemption_deductions",
                "penalty_interest_calculation",
                "payment_processing"
            ],
            ownership_transfer=[
                "deed_recording",
                "ownership_verification",
                "transfer_tax_calculation",
                "lien_processing",
                "title_validation"
            ],
            harris_pacs_modules=[
                "CAMA",  # Computer Assisted Mass Appraisal
                "RealEstate",
                "Assessment", 
                "Collections",
                "Permits"
            ]
        )

class PrometheusMetrics:
    """Prometheus metrics for Harris PACS testing"""
    
    def __init__(self):
        # Test execution metrics
        self.harris_pacs_tests_total = Counter(
            'harris_pacs_tests_total',
            'Total number of Harris PACS tests executed',
            ['specialization', 'scenario', 'county']
        )
        
        self.harris_pacs_tests_passed = Counter(
            'harris_pacs_tests_passed_total',
            'Total number of Harris PACS tests passed',
            ['specialization', 'scenario', 'county']
        )
        
        self.harris_pacs_tests_failed = Counter(
            'harris_pacs_tests_failed_total',
            'Total number of Harris PACS tests failed',
            ['specialization', 'scenario', 'failure_reason']
        )
        
        self.harris_pacs_test_duration = Histogram(
            'harris_pacs_test_duration_seconds',
            'Harris PACS test execution duration in seconds',
            ['specialization', 'scenario'],
            buckets=[0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300, 600]
        )
        
        # Agent performance metrics
        self.harris_pacs_agents_active = Gauge(
            'harris_pacs_agents_active',
            'Number of active Harris PACS testing agents',
            ['specialization', 'county']
        )
        
        self.harris_pacs_agent_success_rate = Gauge(
            'harris_pacs_agent_success_rate',
            'Success rate of Harris PACS agents (0-1)',
            ['specialization', 'county']
        )
        
        # Government compliance metrics
        self.harris_pacs_compliance_score = Gauge(
            'harris_pacs_compliance_score',
            'Government compliance score for Harris PACS integration (0-100)',
            ['framework', 'county', 'module']
        )
        
        self.harris_pacs_fisma_controls_passed = Gauge(
            'harris_pacs_fisma_controls_passed',
            'Number of FISMA controls passed in Harris PACS testing',
            ['control_family', 'county']
        )
        
        # Benton County specific metrics
        self.benton_county_connectivity = Gauge(
            'benton_county_harris_pacs_connectivity',
            'Benton County Harris PACS connectivity success rate (0-1)',
            ['module']
        )
        
        self.benton_county_data_sync_accuracy = Gauge(
            'benton_county_data_sync_accuracy',
            'Benton County data synchronization accuracy (0-1)',
            ['data_type', 'direction']
        )
        
        # Performance and load metrics
        self.harris_pacs_throughput = Gauge(
            'harris_pacs_throughput_requests_per_second',
            'Harris PACS system throughput in requests per second',
            ['operation_type', 'county']
        )
        
        self.harris_pacs_response_time = Histogram(
            'harris_pacs_response_time_ms',
            'Harris PACS response time in milliseconds',
            ['operation_type', 'county'],
            buckets=[10, 25, 50, 100, 250, 500, 1000, 2500, 5000]
        )
        
        # System information
        self.harris_pacs_test_info = Info(
            'harris_pacs_test_info',
            'Harris PACS integration testing system information'
        )

class HarrisPACSTestOrchestrator:
    """Main orchestrator for Harris PACS integration testing"""
    
    def __init__(self):
        self.metrics = PrometheusMetrics()
        self.redis_client = None
        self.session = None
        self.test_executions: Dict[str, TestExecution] = {}
        self.benton_county_suite = BentonCountyTestSuite.default()
        self.orchestration_start_time = None
        self.government_compliance_enabled = GOVERNMENT_COMPLIANCE_TESTING
        
        # Agent endpoints
        self.agent_endpoints = {}
        for spec in HARRIS_PACS_SPECIALIZATIONS:
            self.agent_endpoints[spec.name] = f"http://{spec.name}-agents-tester:{spec.endpoint_port}"
    
    async def initialize(self):
        """Initialize the test orchestrator"""
        logger.info("Initializing Harris PACS Test Orchestrator...")
        
        # Initialize Redis connection for state management
        try:
            self.redis_client = redis.Redis(
                host=os.getenv('REDIS_HOST', 'redis'),
                port=int(os.getenv('REDIS_PORT', 6379)),
                db=int(os.getenv('REDIS_DB', 2)),  # Separate DB for testing
                decode_responses=True
            )
            self.redis_client.ping()
            logger.info("Redis connection established for test state management")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.redis_client = None
        
        # Initialize HTTP session
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=60)
        )
        
        # Set system information
        self.metrics.harris_pacs_test_info.info({
            'version': '1.0.0',
            'total_agents': str(TOTAL_HARRIS_PACS_AGENTS),
            'county': 'benton',
            'state': 'washington',
            'government_compliance': str(self.government_compliance_enabled),
            'specializations': str(len(HARRIS_PACS_SPECIALIZATIONS)),
            'test_suite': BENTON_COUNTY_TEST_SUITE
        })
        
        self.orchestration_start_time = datetime.now(timezone.utc)
        logger.info(f"Harris PACS Test Orchestrator initialized for {TOTAL_HARRIS_PACS_AGENTS} agents")
    
    async def validate_agent_readiness(self) -> Dict[str, bool]:
        """Validate that all agent testing services are ready"""
        logger.info("Validating Harris PACS agent testing services...")
        
        agent_status = {}
        
        for specialization in HARRIS_PACS_SPECIALIZATIONS:
            try:
                endpoint = self.agent_endpoints[specialization.name]
                async with self.session.get(f"{endpoint}/health") as response:
                    if response.status == 200:
                        agent_status[specialization.name] = True
                        logger.info(f"  ✓ {specialization.name} agents ({specialization.count}): Ready")
                    else:
                        agent_status[specialization.name] = False
                        logger.warning(f"  ⚠ {specialization.name} agents: Unhealthy (status {response.status})")
            except Exception as e:
                agent_status[specialization.name] = False
                logger.error(f"  ❌ {specialization.name} agents: Connection failed - {e}")
        
        ready_count = sum(agent_status.values())
        total_count = len(HARRIS_PACS_SPECIALIZATIONS)
        
        logger.info(f"Agent readiness: {ready_count}/{total_count} specializations ready")
        return agent_status
    
    async def execute_specialization_tests(self, specialization: AgentSpecialization) -> List[TestExecution]:
        """Execute all test scenarios for a specific agent specialization"""
        logger.info(f"Executing tests for {specialization.name} agents ({specialization.count} agents)...")
        
        executions = []
        endpoint = self.agent_endpoints[specialization.name]
        
        for scenario in specialization.test_scenarios:
            test_id = f"{specialization.name}_{scenario}_{int(time.time())}"
            execution = TestExecution(
                test_id=test_id,
                specialization=specialization.name,
                scenario=scenario,
                status=TestStatus.PENDING
            )
            
            try:
                execution.start_time = datetime.now(timezone.utc)
                execution.status = TestStatus.RUNNING
                self.test_executions[test_id] = execution
                
                # Execute test scenario
                test_payload = {
                    "test_id": test_id,
                    "scenario": scenario,
                    "agent_count": specialization.count,
                    "county": "benton",
                    "government_compliance": self.government_compliance_enabled,
                    "benton_county_modules": self.benton_county_suite.harris_pacs_modules
                }
                
                async with self.session.post(
                    f"{endpoint}/execute_test",
                    json=test_payload,
                    timeout=aiohttp.ClientTimeout(total=300)  # 5 minute timeout
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        
                        execution.status = TestStatus.COMPLETED
                        execution.end_time = datetime.now(timezone.utc)
                        execution.duration_ms = int((execution.end_time - execution.start_time).total_seconds() * 1000)
                        execution.success_rate = result.get('success_rate', 0.0)
                        execution.compliance_score = result.get('compliance_score', 0.0)
                        execution.metrics = result.get('metrics', {})
                        
                        # Update Prometheus metrics
                        self.metrics.harris_pacs_tests_total.labels(
                            specialization=specialization.name,
                            scenario=scenario,
                            county='benton'
                        ).inc()
                        
                        if execution.success_rate >= 0.95:  # 95% success threshold
                            self.metrics.harris_pacs_tests_passed.labels(
                                specialization=specialization.name,
                                scenario=scenario,
                                county='benton'
                            ).inc()
                        
                        self.metrics.harris_pacs_test_duration.labels(
                            specialization=specialization.name,
                            scenario=scenario
                        ).observe(execution.duration_ms / 1000.0)
                        
                        self.metrics.harris_pacs_agent_success_rate.labels(
                            specialization=specialization.name,
                            county='benton'
                        ).set(execution.success_rate)
                        
                        logger.info(f"  ✓ {scenario}: {execution.success_rate:.1%} success, {execution.duration_ms}ms")
                        
                    else:
                        execution.status = TestStatus.FAILED
                        execution.error_message = f"HTTP {response.status}: {await response.text()}"
                        
                        self.metrics.harris_pacs_tests_failed.labels(
                            specialization=specialization.name,
                            scenario=scenario,
                            failure_reason='http_error'
                        ).inc()
                        
                        logger.error(f"  ❌ {scenario}: {execution.error_message}")
                        
            except asyncio.TimeoutError:
                execution.status = TestStatus.TIMEOUT
                execution.error_message = "Test execution timeout"
                
                self.metrics.harris_pacs_tests_failed.labels(
                    specialization=specialization.name,
                    scenario=scenario,
                    failure_reason='timeout'
                ).inc()
                
                logger.error(f"  ⏰ {scenario}: Test timeout")
                
            except Exception as e:
                execution.status = TestStatus.FAILED
                execution.error_message = str(e)
                
                self.metrics.harris_pacs_tests_failed.labels(
                    specialization=specialization.name,
                    scenario=scenario,
                    failure_reason='exception'
                ).inc()
                
                logger.error(f"  ❌ {scenario}: {e}")
            
            executions.append(execution)
            self.test_executions[test_id] = execution
            
            # Store test result in Redis if available
            if self.redis_client:
                try:
                    self.redis_client.setex(
                        f"harris_pacs_test:{test_id}",
                        86400,  # 24 hours TTL
                        json.dumps(asdict(execution), default=str)
                    )
                except Exception as e:
                    logger.warning(f"Failed to store test result in Redis: {e}")
        
        return executions
    
    async def execute_benton_county_scenarios(self) -> Dict[str, Any]:
        """Execute Benton County specific test scenarios"""
        logger.info("Executing Benton County specific test scenarios...")
        
        county_results = {
            'property_assessment': {},
            'tax_calculation': {},
            'ownership_transfer': {},
            'harris_pacs_modules': {}
        }
        
        # Test property assessment scenarios
        for scenario in self.benton_county_suite.property_assessment:
            try:
                # Use integration testing agents for county scenarios
                endpoint = self.agent_endpoints['integration-testing']
                
                test_payload = {
                    "test_type": "benton_county_property_assessment",
                    "scenario": scenario,
                    "county": "benton",
                    "harris_pacs_modules": self.benton_county_suite.harris_pacs_modules
                }
                
                async with self.session.post(f"{endpoint}/execute_county_test", json=test_payload) as response:
                    if response.status == 200:
                        result = await response.json()
                        county_results['property_assessment'][scenario] = result
                        
                        # Update Benton County metrics
                        success_rate = result.get('success_rate', 0.0)
                        self.metrics.benton_county_connectivity.labels(
                            module='property_assessment'
                        ).set(success_rate)
                        
                        logger.info(f"  ✓ Property Assessment - {scenario}: {success_rate:.1%}")
                    else:
                        logger.error(f"  ❌ Property Assessment - {scenario}: HTTP {response.status}")
                        
            except Exception as e:
                logger.error(f"  ❌ Property Assessment - {scenario}: {e}")
        
        # Test Harris PACS module integration
        for module in self.benton_county_suite.harris_pacs_modules:
            try:
                endpoint = self.agent_endpoints['connectivity']
                
                test_payload = {
                    "test_type": "harris_pacs_module_connectivity",
                    "module": module,
                    "county": "benton"
                }
                
                async with self.session.post(f"{endpoint}/execute_module_test", json=test_payload) as response:
                    if response.status == 200:
                        result = await response.json()
                        county_results['harris_pacs_modules'][module] = result
                        
                        connectivity_rate = result.get('connectivity_success_rate', 0.0)
                        self.metrics.benton_county_connectivity.labels(
                            module=module
                        ).set(connectivity_rate)
                        
                        logger.info(f"  ✓ Harris PACS Module - {module}: {connectivity_rate:.1%}")
                    else:
                        logger.error(f"  ❌ Harris PACS Module - {module}: HTTP {response.status}")
                        
            except Exception as e:
                logger.error(f"  ❌ Harris PACS Module - {module}: {e}")
        
        return county_results
    
    async def execute_government_compliance_tests(self) -> Dict[str, Any]:
        """Execute government compliance validation tests"""
        if not self.government_compliance_enabled:
            logger.info("Government compliance testing disabled")
            return {}
        
        logger.info("Executing government compliance validation tests...")
        
        compliance_results = {}
        frameworks = [ComplianceFramework.FISMA, ComplianceFramework.NIST, ComplianceFramework.FIPS_140_2]
        
        for framework in frameworks:
            try:
                endpoint = self.agent_endpoints['compliance-validation']
                
                test_payload = {
                    "compliance_framework": framework.value,
                    "county": "benton",
                    "government_systems": ["harris_pacs", "terrafusion_os"],
                    "audit_scope": "comprehensive"
                }
                
                async with self.session.post(f"{endpoint}/execute_compliance_test", json=test_payload) as response:
                    if response.status == 200:
                        result = await response.json()
                        compliance_results[framework.value] = result
                        
                        compliance_score = result.get('compliance_score', 0.0)
                        self.metrics.harris_pacs_compliance_score.labels(
                            framework=framework.value,
                            county='benton',
                            module='all'
                        ).set(compliance_score)
                        
                        logger.info(f"  ✓ {framework.value} Compliance: {compliance_score:.1f}/100")
                    else:
                        logger.error(f"  ❌ {framework.value} Compliance: HTTP {response.status}")
                        
            except Exception as e:
                logger.error(f"  ❌ {framework.value} Compliance: {e}")
        
        return compliance_results
    
    async def run_comprehensive_test_suite(self) -> Dict[str, Any]:
        """Run the complete Harris PACS integration test suite"""
        logger.info("🏛️ Starting comprehensive Harris PACS integration test suite for Benton County")
        
        test_results = {
            'orchestration_start_time': self.orchestration_start_time.isoformat(),
            'total_agents': TOTAL_HARRIS_PACS_AGENTS,
            'county': 'benton',
            'specialization_results': {},
            'benton_county_scenarios': {},
            'government_compliance': {},
            'overall_metrics': {}
        }
        
        try:
            # Step 1: Validate agent readiness
            agent_status = await self.validate_agent_readiness()
            ready_agents = sum(agent_status.values())
            
            if ready_agents < len(HARRIS_PACS_SPECIALIZATIONS):
                logger.warning(f"Only {ready_agents}/{len(HARRIS_PACS_SPECIALIZATIONS)} agent types are ready")
            
            # Step 2: Execute tests for each specialization
            if PARALLEL_TEST_EXECUTION:
                logger.info("Executing specialization tests in parallel...")
                specialization_tasks = [
                    self.execute_specialization_tests(spec) 
                    for spec in HARRIS_PACS_SPECIALIZATIONS 
                    if agent_status.get(spec.name, False)
                ]
                specialization_results = await asyncio.gather(*specialization_tasks, return_exceptions=True)
                
                for i, spec in enumerate([s for s in HARRIS_PACS_SPECIALIZATIONS if agent_status.get(s.name, False)]):
                    if isinstance(specialization_results[i], Exception):
                        logger.error(f"Specialization {spec.name} failed: {specialization_results[i]}")
                        test_results['specialization_results'][spec.name] = {'error': str(specialization_results[i])}
                    else:
                        test_results['specialization_results'][spec.name] = [asdict(e) for e in specialization_results[i]]
            else:
                logger.info("Executing specialization tests sequentially...")
                for spec in HARRIS_PACS_SPECIALIZATIONS:
                    if agent_status.get(spec.name, False):
                        executions = await self.execute_specialization_tests(spec)
                        test_results['specialization_results'][spec.name] = [asdict(e) for e in executions]
            
            # Step 3: Execute Benton County specific scenarios
            test_results['benton_county_scenarios'] = await self.execute_benton_county_scenarios()
            
            # Step 4: Execute government compliance tests
            test_results['government_compliance'] = await self.execute_government_compliance_tests()
            
            # Step 5: Calculate overall metrics
            total_tests = len(self.test_executions)
            successful_tests = sum(1 for e in self.test_executions.values() if e.status == TestStatus.COMPLETED and e.success_rate >= 0.95)
            overall_success_rate = successful_tests / total_tests if total_tests > 0 else 0.0
            
            test_results['overall_metrics'] = {
                'total_tests_executed': total_tests,
                'successful_tests': successful_tests,
                'overall_success_rate': overall_success_rate,
                'execution_duration_minutes': (datetime.now(timezone.utc) - self.orchestration_start_time).total_seconds() / 60
            }
            
            logger.info(f"🎯 Harris PACS Integration Test Suite Complete:")
            logger.info(f"   Total Tests: {total_tests}")
            logger.info(f"   Success Rate: {overall_success_rate:.1%}")
            logger.info(f"   Duration: {test_results['overall_metrics']['execution_duration_minutes']:.1f} minutes")
            
        except Exception as e:
            logger.error(f"Test suite execution failed: {e}")
            test_results['error'] = str(e)
        
        test_results['orchestration_end_time'] = datetime.now(timezone.utc).isoformat()
        return test_results
    
    async def start_continuous_testing(self):
        """Start continuous testing mode for ongoing validation"""
        logger.info("Starting continuous Harris PACS integration testing...")
        
        test_interval = int(os.getenv('CONTINUOUS_TEST_INTERVAL', 3600))  # 1 hour default
        
        while True:
            try:
                logger.info("Executing scheduled Harris PACS integration tests...")
                results = await self.run_comprehensive_test_suite()
                
                # Store results for historical analysis
                if self.redis_client:
                    timestamp = int(time.time())
                    self.redis_client.setex(
                        f"harris_pacs_test_results:{timestamp}",
                        86400 * 7,  # 7 days retention
                        json.dumps(results, default=str)
                    )
                
                logger.info(f"Continuous test cycle completed. Next cycle in {test_interval} seconds.")
                await asyncio.sleep(test_interval)
                
            except Exception as e:
                logger.error(f"Continuous testing cycle failed: {e}")
                await asyncio.sleep(300)  # Wait 5 minutes on error
    
    async def cleanup(self):
        """Cleanup resources"""
        if self.session:
            await self.session.close()
        
        if self.redis_client:
            self.redis_client.close()

async def main():
    """Main function"""
    orchestrator = HarrisPACSTestOrchestrator()
    
    try:
        # Initialize the orchestrator
        await orchestrator.initialize()
        
        # Start Prometheus metrics server
        start_http_server(9600)
        logger.info("Prometheus metrics server started on port 9600")
        
        # Choose execution mode
        continuous_mode = os.getenv('CONTINUOUS_TESTING_MODE', 'false').lower() == 'true'
        
        if continuous_mode:
            await orchestrator.start_continuous_testing()
        else:
            # Run single comprehensive test suite
            results = await orchestrator.run_comprehensive_test_suite()
            
            # Output results summary
            print("\n" + "="*80)
            print("HARRIS PACS INTEGRATION TEST RESULTS SUMMARY")
            print("="*80)
            print(f"County: Benton County, Washington")
            print(f"Total Agents: {TOTAL_HARRIS_PACS_AGENTS}")
            print(f"Test Suite: {BENTON_COUNTY_TEST_SUITE}")
            print(f"Government Compliance: {'Enabled' if GOVERNMENT_COMPLIANCE_TESTING else 'Disabled'}")
            print(f"Overall Success Rate: {results['overall_metrics']['overall_success_rate']:.1%}")
            print(f"Execution Time: {results['overall_metrics']['execution_duration_minutes']:.1f} minutes")
            print("="*80)
        
    except KeyboardInterrupt:
        logger.info("Received interrupt signal, shutting down...")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
    finally:
        await orchestrator.cleanup()

if __name__ == "__main__":
    asyncio.run(main())