#!/usr/bin/env python3
"""
TerraFusion Master Monitoring Orchestrator
Coordinates and manages all monitoring agents and generates comprehensive reports
"""

import asyncio
import logging
import json
import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from pathlib import Path
import signal
import argparse

# Add monitoring modules to path
sys.path.append('/mnt/e/TerraFusion/monitoring/infrastructure/agents')
sys.path.append('/mnt/e/TerraFusion/monitoring/application/agents')
sys.path.append('/mnt/e/TerraFusion/monitoring/security/agents')
sys.path.append('/mnt/e/TerraFusion/monitoring/quantum/agents')

# Import monitoring agents
from infrastructure_monitoring_agent import InfrastructureMonitoringAgent
from application_monitoring_agent import ApplicationMonitoringAgent
from security_monitoring_agent import SecurityMonitoringAgent
from quantum_monitoring_agent import QuantumMonitoringAgent

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('/mnt/e/TerraFusion/monitoring/logs/master_orchestrator.log')
    ]
)
logger = logging.getLogger(__name__)


class TerraFusionMonitoringOrchestrator:
    """Master orchestrator for all TerraFusion monitoring agents"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.agents = {}
        self.status = "initialized"
        self.start_time = datetime.utcnow()
        self.monitoring_cycle = 0
        self.shutdown_requested = False
        
        # Ensure log directory exists
        os.makedirs('/mnt/e/TerraFusion/monitoring/logs', exist_ok=True)
        os.makedirs('/mnt/e/TerraFusion/monitoring/reports', exist_ok=True)
        
    async def initialize_agents(self):
        """Initialize all monitoring agents"""
        logger.info("Initializing TerraFusion Master Monitoring Orchestrator")
        
        try:
            # Initialize Infrastructure Monitoring Agent
            logger.info("Initializing Infrastructure Monitoring Agent...")
            self.agents['infrastructure'] = InfrastructureMonitoringAgent(
                self.config.get('infrastructure', {})
            )
            await self.agents['infrastructure'].initialize()
            
            # Initialize Application Monitoring Agent
            logger.info("Initializing Application Monitoring Agent...")
            self.agents['application'] = ApplicationMonitoringAgent(
                self.config.get('application', {})
            )
            await self.agents['application'].initialize()
            
            # Initialize Security Monitoring Agent
            logger.info("Initializing Security Monitoring Agent...")
            self.agents['security'] = SecurityMonitoringAgent(
                self.config.get('security', {})
            )
            await self.agents['security'].initialize()
            
            # Initialize Quantum Monitoring Agent
            logger.info("Initializing Quantum Monitoring Agent...")
            self.agents['quantum'] = QuantumMonitoringAgent(
                self.config.get('quantum', {})
            )
            await self.agents['quantum'].initialize()
            
            self.status = "running"
            logger.info("All monitoring agents initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize monitoring agents: {e}")
            self.status = "failed"
            raise
            
    async def run_monitoring_cycle(self) -> Dict[str, Any]:
        """Execute a complete monitoring cycle across all agents"""
        cycle_start = datetime.utcnow()
        self.monitoring_cycle += 1
        
        logger.info(f"Starting monitoring cycle #{self.monitoring_cycle}")
        
        cycle_results = {
            "cycle_number": self.monitoring_cycle,
            "start_time": cycle_start.isoformat(),
            "agents": {},
            "summary": {
                "total_agents": len(self.agents),
                "successful_agents": 0,
                "failed_agents": 0,
                "total_alerts": 0,
                "critical_alerts": 0,
                "warnings": 0
            }
        }
        
        # Run monitoring for each agent
        for agent_name, agent in self.agents.items():
            logger.info(f"Running monitoring cycle for {agent_name} agent")
            
            try:
                if agent_name == 'infrastructure':
                    # Infrastructure agent monitoring
                    metrics = await agent.collect_all_metrics()
                    report = await agent.generate_report()
                    
                    cycle_results["agents"][agent_name] = {
                        "status": "success",
                        "metrics": metrics,
                        "report_length": len(report),
                        "bots_active": len(agent.bots)
                    }
                    
                elif agent_name == 'application':
                    # Application agent monitoring
                    monitoring_data = await agent.monitor_all()
                    alerts = await agent.analyze_all()
                    report = await agent.generate_report()
                    
                    cycle_results["agents"][agent_name] = {
                        "status": "success",
                        "monitoring_data": monitoring_data,
                        "alerts": len(alerts),
                        "critical_alerts": len([a for a in alerts if a.get("severity") == "critical"]),
                        "report_length": len(report),
                        "bots_active": len(agent.bots)
                    }
                    
                    cycle_results["summary"]["total_alerts"] += len(alerts)
                    cycle_results["summary"]["critical_alerts"] += len([a for a in alerts if a.get("severity") == "critical"])
                    
                elif agent_name == 'security':
                    # Security agent monitoring
                    security_data = await agent.monitor_security()
                    responses = await agent.respond_to_threats()
                    report = await agent.generate_report()
                    
                    total_threats = security_data["summary"]["total_threats"]
                    critical_threats = security_data["summary"]["critical_issues"]
                    
                    cycle_results["agents"][agent_name] = {
                        "status": "success",
                        "security_posture": security_data["security_posture"],
                        "total_threats": total_threats,
                        "critical_threats": critical_threats,
                        "responses": len(responses),
                        "report_length": len(report),
                        "bots_active": len(agent.bots)
                    }
                    
                    cycle_results["summary"]["total_alerts"] += total_threats
                    cycle_results["summary"]["critical_alerts"] += critical_threats
                    
                elif agent_name == 'quantum':
                    # Quantum agent monitoring
                    quantum_data = await agent.monitor_quantum_systems()
                    corrections = await agent.apply_corrections()
                    report = await agent.generate_report()
                    
                    total_anomalies = quantum_data["summary"]["total_anomalies"]
                    critical_issues = quantum_data["summary"]["critical_issues"]
                    
                    cycle_results["agents"][agent_name] = {
                        "status": "success",
                        "quantum_health_score": quantum_data["quantum_health_score"],
                        "health_status": quantum_data["summary"]["health_status"],
                        "total_anomalies": total_anomalies,
                        "critical_issues": critical_issues,
                        "corrections_applied": len(corrections),
                        "report_length": len(report),
                        "bots_active": len(agent.bots)
                    }
                    
                    cycle_results["summary"]["total_alerts"] += total_anomalies
                    cycle_results["summary"]["critical_alerts"] += critical_issues
                
                cycle_results["summary"]["successful_agents"] += 1
                logger.info(f"Successfully completed monitoring cycle for {agent_name} agent")
                
            except Exception as e:
                logger.error(f"Error in monitoring cycle for {agent_name} agent: {e}")
                cycle_results["agents"][agent_name] = {
                    "status": "failed",
                    "error": str(e)
                }
                cycle_results["summary"]["failed_agents"] += 1
                
        # Calculate cycle duration
        cycle_end = datetime.utcnow()
        cycle_duration = (cycle_end - cycle_start).total_seconds()
        
        cycle_results["end_time"] = cycle_end.isoformat()
        cycle_results["duration_seconds"] = cycle_duration
        
        # Update summary
        cycle_results["summary"]["warnings"] = (
            cycle_results["summary"]["total_alerts"] - 
            cycle_results["summary"]["critical_alerts"]
        )
        
        logger.info(f"Completed monitoring cycle #{self.monitoring_cycle} in {cycle_duration:.2f}s")
        logger.info(f"Cycle summary: {cycle_results['summary']['successful_agents']}/{cycle_results['summary']['total_agents']} agents successful")
        
        return cycle_results
        
    async def generate_master_report(self) -> str:
        """Generate comprehensive master monitoring report"""
        logger.info("Generating master monitoring report")
        
        report_time = datetime.utcnow()
        uptime = report_time - self.start_time
        
        # Run a monitoring cycle to get fresh data
        cycle_results = await self.run_monitoring_cycle()
        
        # Generate individual agent reports
        agent_reports = {}
        for agent_name, agent in self.agents.items():
            try:
                if agent_name == 'infrastructure':
                    agent_reports[agent_name] = await agent.generate_report()
                elif agent_name == 'application':
                    agent_reports[agent_name] = await agent.generate_report()
                elif agent_name == 'security':
                    agent_reports[agent_name] = await agent.generate_report()
                elif agent_name == 'quantum':
                    agent_reports[agent_name] = await agent.generate_report()
            except Exception as e:
                logger.error(f"Failed to generate report for {agent_name}: {e}")
                agent_reports[agent_name] = f"Error generating report: {e}"
        
        # Build master report
        master_report = f"""
# TerraFusion Master Monitoring Report

**Generated**: {report_time.isoformat()}  
**Orchestrator Uptime**: {uptime}  
**Monitoring Cycles Completed**: {self.monitoring_cycle}  
**Status**: {self.status.upper()}

## Executive Summary

### Overall System Health
- **Total Monitoring Agents**: {cycle_results['summary']['total_agents']}
- **Successful Agents**: {cycle_results['summary']['successful_agents']}
- **Failed Agents**: {cycle_results['summary']['failed_agents']}
- **Total Active Alerts**: {cycle_results['summary']['total_alerts']}
- **Critical Alerts**: {cycle_results['summary']['critical_alerts']}
- **Warnings**: {cycle_results['summary']['warnings']}

### Agent Status Overview
"""
        
        for agent_name, result in cycle_results["agents"].items():
            status_emoji = "✅" if result["status"] == "success" else "❌"
            master_report += f"- **{agent_name.title()} Agent**: {status_emoji} {result['status'].title()}"
            
            if result["status"] == "success":
                if "bots_active" in result:
                    master_report += f" ({result['bots_active']} bots active)"
            else:
                master_report += f" - {result.get('error', 'Unknown error')}"
            master_report += "\n"
            
        master_report += "\n"
        
        # Add critical alerts section if any exist
        if cycle_results['summary']['critical_alerts'] > 0:
            master_report += """
## 🚨 CRITICAL ALERTS ACTIVE

**IMMEDIATE ATTENTION REQUIRED**

"""
            for agent_name, result in cycle_results["agents"].items():
                if result.get("critical_alerts", 0) > 0 or result.get("critical_threats", 0) > 0 or result.get("critical_issues", 0) > 0:
                    critical_count = result.get("critical_alerts", result.get("critical_threats", result.get("critical_issues", 0)))
                    master_report += f"- **{agent_name.title()} Agent**: {critical_count} critical issue(s)\n"
                    
        # Add detailed agent reports
        master_report += "\n## Detailed Agent Reports\n\n"
        
        for agent_name, report in agent_reports.items():
            master_report += f"### {agent_name.title()} Monitoring Agent\n\n"
            
            # Add agent-specific summary from cycle results
            agent_result = cycle_results["agents"].get(agent_name, {})
            if agent_result.get("status") == "success":
                if agent_name == "infrastructure":
                    master_report += f"- **Active Bots**: {agent_result['bots_active']}\n"
                elif agent_name == "application":
                    master_report += f"- **Active Bots**: {agent_result['bots_active']}\n"
                    master_report += f"- **Total Alerts**: {agent_result['alerts']}\n"
                    master_report += f"- **Critical Alerts**: {agent_result['critical_alerts']}\n"
                elif agent_name == "security":
                    master_report += f"- **Security Posture**: {agent_result['security_posture'].title()}\n"
                    master_report += f"- **Total Threats**: {agent_result['total_threats']}\n"
                    master_report += f"- **Critical Threats**: {agent_result['critical_threats']}\n"
                    master_report += f"- **Responses Applied**: {agent_result['responses']}\n"
                elif agent_name == "quantum":
                    master_report += f"- **Quantum Health Score**: {agent_result['quantum_health_score']:.1f}/100\n"
                    master_report += f"- **Health Status**: {agent_result['health_status'].title()}\n"
                    master_report += f"- **Total Anomalies**: {agent_result['total_anomalies']}\n"
                    master_report += f"- **Corrections Applied**: {agent_result['corrections_applied']}\n"
                    
            master_report += "\n" + report + "\n\n"
            master_report += "---\n\n"
            
        # Add operational metrics
        master_report += f"""
## Orchestrator Operational Metrics

### Performance Metrics
- **Last Cycle Duration**: {cycle_results['duration_seconds']:.2f} seconds
- **Average Cycle Time**: N/A (implement historical tracking)
- **Monitoring Frequency**: {self.config.get('monitoring_interval', 60)} seconds
- **Data Collection Points**: {sum(result.get('bots_active', 0) for result in cycle_results['agents'].values() if isinstance(result, dict))}

### System Resources
- **Log Directory**: `/mnt/e/TerraFusion/monitoring/logs/`
- **Report Directory**: `/mnt/e/TerraFusion/monitoring/reports/`
- **Configuration**: {len(self.config)} configuration sections loaded

### Next Actions
"""
        
        # Generate recommendations based on current state
        if cycle_results['summary']['critical_alerts'] > 0:
            master_report += "**IMMEDIATE PRIORITY:**\n"
            master_report += "1. Investigate and resolve critical alerts\n"
            master_report += "2. Review affected systems and services\n"
            master_report += "3. Implement emergency response procedures\n"
            master_report += "4. Notify stakeholders and escalate as needed\n\n"
        elif cycle_results['summary']['warnings'] > 0:
            master_report += "**PRIORITY ACTIONS:**\n"
            master_report += "1. Review warning-level alerts\n"
            master_report += "2. Investigate potential issues before they become critical\n"
            master_report += "3. Update monitoring thresholds if needed\n"
            master_report += "4. Schedule maintenance windows for non-critical fixes\n\n"
        else:
            master_report += "**MAINTENANCE MODE:**\n"
            master_report += "1. Continue regular monitoring operations\n"
            master_report += "2. Review system performance trends\n"
            master_report += "3. Plan capacity upgrades and optimizations\n"
            master_report += "4. Update monitoring configurations and thresholds\n\n"
            
        master_report += f"""
---

**Report Generation Time**: {datetime.utcnow().isoformat()}  
**Next Scheduled Report**: {(datetime.utcnow() + timedelta(hours=1)).isoformat()}  
**Monitoring Status**: {self.status.upper()}  
**Agent Health**: {cycle_results['summary']['successful_agents']}/{cycle_results['summary']['total_agents']} Healthy
"""
        
        return master_report
        
    async def save_reports(self):
        """Save all monitoring reports to files"""
        logger.info("Saving monitoring reports")
        
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        reports_dir = "/mnt/e/TerraFusion/monitoring/reports"
        
        try:
            # Generate and save master report
            master_report = await self.generate_master_report()
            master_report_path = f"{reports_dir}/master_monitoring_report_{timestamp}.md"
            
            with open(master_report_path, 'w') as f:
                f.write(master_report)
            logger.info(f"Master report saved to {master_report_path}")
            
            # Save individual agent reports
            for agent_name, agent in self.agents.items():
                try:
                    if agent_name == 'infrastructure':
                        report = await agent.generate_report()
                    elif agent_name == 'application':
                        report = await agent.generate_report()
                    elif agent_name == 'security':
                        report = await agent.generate_report()
                    elif agent_name == 'quantum':
                        report = await agent.generate_report()
                    
                    report_path = f"{reports_dir}/{agent_name}_report_{timestamp}.md"
                    with open(report_path, 'w') as f:
                        f.write(report)
                    logger.info(f"{agent_name.title()} report saved to {report_path}")
                    
                except Exception as e:
                    logger.error(f"Failed to save {agent_name} report: {e}")
                    
            # Save cycle results as JSON
            cycle_results = await self.run_monitoring_cycle()
            cycle_results_path = f"{reports_dir}/monitoring_cycle_{timestamp}.json"
            
            with open(cycle_results_path, 'w') as f:
                json.dump(cycle_results, f, indent=2)
            logger.info(f"Cycle results saved to {cycle_results_path}")
            
        except Exception as e:
            logger.error(f"Failed to save reports: {e}")
            raise
            
    async def run_continuous_monitoring(self):
        """Run continuous monitoring with configurable intervals"""
        logger.info("Starting continuous monitoring mode")
        
        monitoring_interval = self.config.get('monitoring_interval', 60)  # Default 60 seconds
        report_interval = self.config.get('report_interval', 3600)  # Default 1 hour
        
        last_report_time = datetime.utcnow()
        
        try:
            while not self.shutdown_requested:
                cycle_start = datetime.utcnow()
                
                # Run monitoring cycle
                await self.run_monitoring_cycle()
                
                # Generate reports if interval has passed
                if (cycle_start - last_report_time).total_seconds() >= report_interval:
                    await self.save_reports()
                    last_report_time = cycle_start
                    
                # Calculate sleep time
                cycle_duration = (datetime.utcnow() - cycle_start).total_seconds()
                sleep_time = max(0, monitoring_interval - cycle_duration)
                
                logger.info(f"Monitoring cycle completed in {cycle_duration:.2f}s, sleeping for {sleep_time:.2f}s")
                
                if sleep_time > 0:
                    await asyncio.sleep(sleep_time)
                    
        except asyncio.CancelledError:
            logger.info("Continuous monitoring cancelled")
        except Exception as e:
            logger.error(f"Error in continuous monitoring: {e}")
            raise
            
    async def shutdown(self):
        """Gracefully shutdown all monitoring agents"""
        logger.info("Initiating graceful shutdown of monitoring orchestrator")
        
        self.shutdown_requested = True
        
        # Shutdown all agents
        for agent_name, agent in self.agents.items():
            try:
                logger.info(f"Shutting down {agent_name} agent")
                await agent.shutdown()
            except Exception as e:
                logger.error(f"Error shutting down {agent_name} agent: {e}")
                
        # Generate final report
        try:
            logger.info("Generating final monitoring report")
            await self.save_reports()
        except Exception as e:
            logger.error(f"Error generating final report: {e}")
            
        self.status = "shutdown"
        logger.info("Monitoring orchestrator shutdown complete")
        
    def signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info(f"Received signal {signum}, initiating shutdown")
        self.shutdown_requested = True


async def main():
    """Main entry point for the monitoring orchestrator"""
    parser = argparse.ArgumentParser(description='TerraFusion Master Monitoring Orchestrator')
    parser.add_argument('--config', '-c', default='monitoring_config.json', 
                       help='Configuration file path')
    parser.add_argument('--mode', '-m', choices=['continuous', 'single', 'report'], 
                       default='continuous', help='Monitoring mode')
    parser.add_argument('--interval', '-i', type=int, default=60, 
                       help='Monitoring interval in seconds')
    parser.add_argument('--verbose', '-v', action='store_true', 
                       help='Enable verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
        
    # Load configuration
    config = {
        'monitoring_interval': args.interval,
        'report_interval': 3600,  # 1 hour
        'infrastructure': {
            'environment': 'production',
            'monitoring_interval': 60,
            'retention_days': 30
        },
        'application': {
            'environment': 'production',
            'monitoring_interval': 30,
            'alert_cooldown': 300,
            'data_retention_days': 30
        },
        'security': {
            'environment': 'production',
            'monitoring_interval': 300,
            'threat_detection_mode': 'active',
            'compliance_frameworks': ['SOC2', 'GDPR', 'ISO27001', 'QUANTUM_SAFE'],
            'incident_response_enabled': True
        },
        'quantum': {
            'environment': 'production',
            'monitoring_interval': 60,
            'quantum_processors': ['QP-1', 'QP-2', 'QP-7'],
            'error_correction_enabled': True,
            'real_time_monitoring': True,
            'alert_thresholds': {
                'fidelity': 0.99,
                'coherence': 100e-6,
                'temperature': 0.020
            }
        }
    }
    
    # Try to load config file if it exists
    if os.path.exists(args.config):
        try:
            with open(args.config, 'r') as f:
                file_config = json.load(f)
                config.update(file_config)
            logger.info(f"Loaded configuration from {args.config}")
        except Exception as e:
            logger.warning(f"Could not load config file {args.config}: {e}")
            
    # Create orchestrator
    orchestrator = TerraFusionMonitoringOrchestrator(config)
    
    # Set up signal handlers
    signal.signal(signal.SIGINT, orchestrator.signal_handler)
    signal.signal(signal.SIGTERM, orchestrator.signal_handler)
    
    try:
        # Initialize agents
        await orchestrator.initialize_agents()
        
        # Run based on mode
        if args.mode == 'single':
            logger.info("Running single monitoring cycle")
            cycle_results = await orchestrator.run_monitoring_cycle()
            print(json.dumps(cycle_results, indent=2))
            
        elif args.mode == 'report':
            logger.info("Generating monitoring reports")
            await orchestrator.save_reports()
            
        elif args.mode == 'continuous':
            logger.info("Starting continuous monitoring mode")
            await orchestrator.run_continuous_monitoring()
            
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt")
    except Exception as e:
        logger.error(f"Fatal error in monitoring orchestrator: {e}")
        raise
    finally:
        await orchestrator.shutdown()


if __name__ == "__main__":
    asyncio.run(main())