#!/usr/bin/env python3
"""
TerraFusion AI Training Pipeline Orchestrator
Main entry point for coordinating all training agents and pipelines
"""

import asyncio
import json
import logging
import sys
import argparse
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path

# Import training agents
from data_pipeline.agents.data_pipeline_agent import DataPipelineAgent
from model_training.agents.model_training_agent import ModelTrainingAgent

class AITrainingOrchestrator:
    """Main orchestrator for TerraFusion AI training pipeline"""
    
    def __init__(self, config_path: str = None):
        self.config = self._load_config(config_path)
        self.logger = self._setup_logging()
        
        # Initialize agents
        self.data_pipeline_agent = DataPipelineAgent()
        self.model_training_agent = ModelTrainingAgent()
        
        # Pipeline status
        self.pipeline_status = "initialized"
        self.execution_log = []
        
        # Performance metrics
        self.metrics = {
            "pipeline_start": None,
            "pipeline_end": None,
            "total_execution_time": 0.0,
            "stages_completed": 0,
            "stages_failed": 0,
            "data_quality_score": 0.0,
            "models_trained": 0,
            "best_model_performance": 0.0
        }
    
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load orchestrator configuration"""
        if config_path and Path(config_path).exists():
            with open(config_path, 'r') as f:
                return json.load(f)
        
        # Default configuration
        return {
            "pipeline_stages": [
                "data_collection",
                "feature_engineering", 
                "data_validation",
                "model_training",
                "model_evaluation",
                "deployment_preparation"
            ],
            "target_versions": ["v1_foundation", "v2_project_reflex", "v3_cosmic_governance"],
            "parallel_execution": True,
            "data_quality_threshold": 0.9,
            "model_performance_threshold": 0.85,
            "auto_deployment": False,
            "notification_endpoints": [],
            "backup_models": True,
            "monitoring_enabled": True
        }
    
    def _setup_logging(self) -> logging.Logger:
        """Setup logging configuration"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('logs/orchestrator.log'),
                logging.StreamHandler()
            ]
        )
        return logging.getLogger(__name__)
    
    async def execute_full_pipeline(self) -> Dict[str, Any]:
        """Execute the complete AI training pipeline"""
        self.logger.info("=== Starting TerraFusion AI Training Pipeline ===")
        self.pipeline_status = "running"
        self.metrics["pipeline_start"] = datetime.now().isoformat()
        
        pipeline_result = {
            "status": "success",
            "stages": {},
            "models": {},
            "metrics": {},
            "errors": []
        }
        
        try:
            # Stage 1: Data Pipeline
            self.logger.info("Stage 1: Executing Data Pipeline")
            data_result = await self._execute_data_pipeline()
            pipeline_result["stages"]["data_pipeline"] = data_result
            
            if data_result["status"] != "success":
                raise Exception(f"Data pipeline failed: {data_result.get('error', 'Unknown error')}")
            
            self.metrics["data_quality_score"] = data_result.get("data_quality_score", 0.0)
            self.metrics["stages_completed"] += 1
            
            # Check data quality threshold
            if self.metrics["data_quality_score"] < self.config["data_quality_threshold"]:
                self.logger.warning(f"Data quality score {self.metrics['data_quality_score']:.3f} below threshold {self.config['data_quality_threshold']}")
            
            # Stage 2: Model Training
            self.logger.info("Stage 2: Executing Model Training")
            training_result = await self._execute_model_training(data_result.get("output_path"))
            pipeline_result["stages"]["model_training"] = training_result
            
            if training_result["status"] != "success":
                raise Exception(f"Model training failed: {training_result.get('error', 'Unknown error')}")
            
            self.metrics["models_trained"] = training_result.get("models_trained", 0)
            self.metrics["stages_completed"] += 1
            
            # Extract best model performance
            best_models = training_result.get("best_models", {})
            if best_models:
                performances = [
                    model.get("performance", {}).get("accuracy", 0)
                    for model in best_models.values()
                ]
                self.metrics["best_model_performance"] = max(performances) if performances else 0.0
            
            # Stage 3: Post-Training Operations
            self.logger.info("Stage 3: Post-Training Operations")
            post_training_result = await self._execute_post_training_operations(training_result)
            pipeline_result["stages"]["post_training"] = post_training_result
            
            self.metrics["stages_completed"] += 1
            
            # Generate final report
            final_report = await self._generate_pipeline_report(pipeline_result)
            pipeline_result["final_report"] = final_report
            
            # Mark pipeline as completed
            self.pipeline_status = "completed"
            self.metrics["pipeline_end"] = datetime.now().isoformat()
            
            # Calculate total execution time
            start_time = datetime.fromisoformat(self.metrics["pipeline_start"])
            end_time = datetime.fromisoformat(self.metrics["pipeline_end"])
            self.metrics["total_execution_time"] = (end_time - start_time).total_seconds()
            
            pipeline_result["metrics"] = self.metrics
            
            self.logger.info(f"=== Pipeline Completed Successfully in {self.metrics['total_execution_time']:.2f} seconds ===")
            
            return pipeline_result
            
        except Exception as e:
            self.pipeline_status = "failed"
            self.metrics["stages_failed"] += 1
            self.logger.error(f"Pipeline execution failed: {str(e)}")
            
            pipeline_result["status"] = "failed"
            pipeline_result["error"] = str(e)
            pipeline_result["metrics"] = self.metrics
            
            return pipeline_result
    
    async def _execute_data_pipeline(self) -> Dict[str, Any]:
        """Execute the data pipeline stage"""
        try:
            self.logger.info("Initializing data collection and processing")
            
            # Start data pipeline
            result = await self.data_pipeline_agent.start_pipeline()
            
            # Log execution
            self.execution_log.append({
                "stage": "data_pipeline",
                "timestamp": datetime.now().isoformat(),
                "status": result.get("status"),
                "details": {
                    "data_collected": result.get("metrics", {}).get("data_collected", 0),
                    "features_generated": result.get("metrics", {}).get("features_generated", 0),
                    "validation_passed": result.get("metrics", {}).get("validation_passed", 0)
                }
            })
            
            return result
            
        except Exception as e:
            self.logger.error(f"Data pipeline execution failed: {str(e)}")
            return {
                "status": "failed",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def _execute_model_training(self, data_path: str = None) -> Dict[str, Any]:
        """Execute the model training stage"""
        try:
            self.logger.info("Initializing model training across all versions")
            
            # Start model training
            result = await self.model_training_agent.start_training_pipeline(data_path)
            
            # Log execution
            self.execution_log.append({
                "stage": "model_training",
                "timestamp": datetime.now().isoformat(),
                "status": result.get("status"),
                "details": {
                    "models_trained": result.get("models_trained", 0),
                    "training_time": result.get("training_time", 0),
                    "best_performance": result.get("metrics", {}).get("best_performance", {})
                }
            })
            
            return result
            
        except Exception as e:
            self.logger.error(f"Model training execution failed: {str(e)}")
            return {
                "status": "failed",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def _execute_post_training_operations(self, training_result: Dict[str, Any]) -> Dict[str, Any]:
        """Execute post-training operations"""
        try:
            self.logger.info("Executing post-training operations")
            
            operations_completed = []
            
            # Model validation and testing
            if self.config.get("validate_models", True):
                validation_result = await self._validate_trained_models(training_result)
                operations_completed.append("model_validation")
            
            # Model backup
            if self.config.get("backup_models", True):
                backup_result = await self._backup_models(training_result)
                operations_completed.append("model_backup")
            
            # Performance monitoring setup
            if self.config.get("monitoring_enabled", True):
                monitoring_result = await self._setup_monitoring(training_result)
                operations_completed.append("monitoring_setup")
            
            # Deployment preparation
            if self.config.get("prepare_deployment", True):
                deployment_result = await self._prepare_deployment(training_result)
                operations_completed.append("deployment_preparation")
            
            return {
                "status": "success",
                "operations_completed": operations_completed,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Post-training operations failed: {str(e)}")
            return {
                "status": "failed",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def _validate_trained_models(self, training_result: Dict[str, Any]) -> Dict[str, Any]:
        """Validate trained models"""
        self.logger.info("Validating trained models")
        
        # Simulate model validation
        best_models = training_result.get("best_models", {})
        validation_results = {}
        
        for model_key, model_info in best_models.items():
            performance = model_info.get("performance", {})
            accuracy = performance.get("accuracy", 0)
            
            # Validate against performance threshold
            is_valid = accuracy >= self.config["model_performance_threshold"]
            
            validation_results[model_key] = {
                "valid": is_valid,
                "accuracy": accuracy,
                "threshold": self.config["model_performance_threshold"],
                "validation_timestamp": datetime.now().isoformat()
            }
        
        return validation_results
    
    async def _backup_models(self, training_result: Dict[str, Any]) -> Dict[str, Any]:
        """Backup trained models"""
        self.logger.info("Backing up trained models")
        
        # Simulate model backup
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_location = f"/mnt/e/TerraFusion/ai-training/backups/models_{timestamp}"
        
        # Create backup directory structure
        backup_dir = Path(backup_location)
        backup_dir.mkdir(parents=True, exist_ok=True)
        
        best_models = training_result.get("best_models", {})
        backup_manifest = {
            "backup_timestamp": datetime.now().isoformat(),
            "backup_location": backup_location,
            "models_backed_up": len(best_models),
            "models": {}
        }
        
        for model_key, model_info in best_models.items():
            backup_manifest["models"][model_key] = {
                "original_path": model_info.get("model_path"),
                "backup_path": f"{backup_location}/{model_key}",
                "metadata": model_info.get("metadata", {})
            }
        
        # Save backup manifest
        manifest_path = backup_dir / "backup_manifest.json"
        with open(manifest_path, 'w') as f:
            json.dump(backup_manifest, f, indent=2)
        
        return backup_manifest
    
    async def _setup_monitoring(self, training_result: Dict[str, Any]) -> Dict[str, Any]:
        """Setup monitoring for trained models"""
        self.logger.info("Setting up model monitoring")
        
        # Simulate monitoring setup
        monitoring_config = {
            "monitoring_enabled": True,
            "alert_thresholds": {
                "accuracy_degradation": 0.05,
                "prediction_latency": 1000,  # ms
                "error_rate": 0.01
            },
            "monitoring_interval": 300,  # 5 minutes
            "dashboard_url": "http://localhost:\${{TF_FRONTEND_PORT:-3000}}/monitoring/ai-models",
            "setup_timestamp": datetime.now().isoformat()
        }
        
        # Save monitoring configuration
        monitoring_dir = Path("/mnt/e/TerraFusion/ai-training/monitoring")
        monitoring_dir.mkdir(exist_ok=True)
        
        config_path = monitoring_dir / "model_monitoring_config.json"
        with open(config_path, 'w') as f:
            json.dump(monitoring_config, f, indent=2)
        
        return monitoring_config
    
    async def _prepare_deployment(self, training_result: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare models for deployment"""
        self.logger.info("Preparing models for deployment")
        
        best_models = training_result.get("best_models", {})
        deployment_config = {
            "deployment_ready": True,
            "deployment_timestamp": datetime.now().isoformat(),
            "models_for_deployment": {},
            "deployment_strategy": "blue_green",
            "rollback_enabled": True
        }
        
        for model_key, model_info in best_models.items():
            performance = model_info.get("performance", {})
            
            # Only deploy models that meet performance threshold
            if performance.get("accuracy", 0) >= self.config["model_performance_threshold"]:
                deployment_config["models_for_deployment"][model_key] = {
                    "model_path": model_info.get("model_path"),
                    "version": model_info.get("version"),
                    "algorithm": model_info.get("algorithm"),
                    "performance": performance,
                    "deployment_endpoint": f"/api/v1/models/{model_key}",
                    "health_check": f"/api/v1/models/{model_key}/health"
                }
        
        # Save deployment configuration
        deployment_dir = Path("/mnt/e/TerraFusion/ai-training/deployment")
        deployment_dir.mkdir(exist_ok=True)
        
        config_path = deployment_dir / "deployment_config.json"
        with open(config_path, 'w') as f:
            json.dump(deployment_config, f, indent=2)
        
        return deployment_config
    
    async def _generate_pipeline_report(self, pipeline_result: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive pipeline execution report"""
        self.logger.info("Generating pipeline execution report")
        
        report = {
            "pipeline_summary": {
                "execution_id": f"pipeline_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "status": pipeline_result["status"],
                "start_time": self.metrics["pipeline_start"],
                "end_time": self.metrics["pipeline_end"],
                "total_execution_time": self.metrics["total_execution_time"],
                "stages_completed": self.metrics["stages_completed"],
                "stages_failed": self.metrics["stages_failed"]
            },
            "data_pipeline_summary": {
                "data_quality_score": self.metrics["data_quality_score"],
                "quality_threshold_met": self.metrics["data_quality_score"] >= self.config["data_quality_threshold"]
            },
            "model_training_summary": {
                "models_trained": self.metrics["models_trained"],
                "best_model_performance": self.metrics["best_model_performance"],
                "performance_threshold_met": self.metrics["best_model_performance"] >= self.config["model_performance_threshold"]
            },
            "version_breakdown": {
                "v1_foundation": {
                    "focus": "BI Analytics predictive models",
                    "models_trained": 0,  # To be filled from actual results
                    "best_performance": 0.0
                },
                "v2_project_reflex": {
                    "focus": "AI Workflow Copilot improvement", 
                    "models_trained": 0,
                    "best_performance": 0.0
                },
                "v3_cosmic_governance": {
                    "focus": "Sovereign AI Council training",
                    "models_trained": 0,
                    "best_performance": 0.0
                }
            },
            "recommendations": [],
            "next_steps": [],
            "execution_log": self.execution_log,
            "generated_at": datetime.now().isoformat()
        }
        
        # Add recommendations based on results
        if self.metrics["data_quality_score"] < self.config["data_quality_threshold"]:
            report["recommendations"].append("Improve data quality by addressing validation issues")
        
        if self.metrics["best_model_performance"] < self.config["model_performance_threshold"]:
            report["recommendations"].append("Consider hyperparameter tuning or alternative algorithms")
        
        if self.metrics["stages_failed"] > 0:
            report["recommendations"].append("Review failed stages and address underlying issues")
        
        # Add next steps
        if pipeline_result["status"] == "success":
            report["next_steps"].extend([
                "Review model performance metrics",
                "Validate models in staging environment",
                "Prepare for production deployment",
                "Set up continuous monitoring"
            ])
        else:
            report["next_steps"].extend([
                "Investigate pipeline failures",
                "Address data quality issues",
                "Retry failed training jobs",
                "Review system resources and configuration"
            ])
        
        # Save report
        report_dir = Path("/mnt/e/TerraFusion/ai-training/reports")
        report_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_path = report_dir / f"pipeline_report_{timestamp}.json"
        
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        self.logger.info(f"Pipeline report saved to {report_path}")
        
        return report
    
    async def get_pipeline_status(self) -> Dict[str, Any]:
        """Get current pipeline status"""
        return {
            "status": self.pipeline_status,
            "metrics": self.metrics,
            "execution_log": self.execution_log[-10:],  # Last 10 entries
            "timestamp": datetime.now().isoformat()
        }
    
    async def health_check(self) -> Dict[str, bool]:
        """Perform health check on all components"""
        health = {
            "orchestrator": True,
            "data_pipeline_agent": await self.data_pipeline_agent.health_check(),
            "model_training_agent": await self.model_training_agent.health_check()
        }
        
        health["overall"] = all(health.values())
        return health

async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="TerraFusion AI Training Pipeline Orchestrator")
    parser.add_argument("--config", type=str, help="Configuration file path")
    parser.add_argument("--mode", type=str, choices=["full", "data-only", "training-only"], 
                       default="full", help="Execution mode")
    parser.add_argument("--health-check", action="store_true", help="Perform health check only")
    
    args = parser.parse_args()
    
    # Initialize orchestrator
    orchestrator = AITrainingOrchestrator(config_path=args.config)
    
    if args.health_check:
        # Perform health check
        health = await orchestrator.health_check()
        print(json.dumps(health, indent=2))
        return
    
    # Execute pipeline based on mode
    if args.mode == "full":
        result = await orchestrator.execute_full_pipeline()
    elif args.mode == "data-only":
        result = await orchestrator._execute_data_pipeline()
    elif args.mode == "training-only":
        result = await orchestrator._execute_model_training()
    
    # Print results
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    asyncio.run(main())