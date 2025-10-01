#!/usr/bin/env python3
"""
TerraFusion Week 1 Implementation Test Suite
===========================================
Comprehensive testing of machine-readable workflow system
Validates all components for Week 1 completion
"""

import asyncio
import json
import time
import uuid
from pathlib import Path
import traceback
from datetime import datetime

# Test results tracking
test_results = {
    "total_tests": 0,
    "passed": 0,
    "failed": 0,
    "skipped": 0,
    "errors": [],
    "start_time": None,
    "end_time": None
}

def log_test(test_name, status, details=""):
    """Log test result"""
    test_results["total_tests"] += 1
    test_results[status] += 1
    
    status_emoji = {"passed": "✅", "failed": "❌", "skipped": "⏭️"}
    print(f"{status_emoji.get(status, '❓')} {test_name}: {status.upper()}")
    
    if details:
        print(f"   {details}")
    
    if status == "failed":
        test_results["errors"].append(f"{test_name}: {details}")

async def test_workflow_schema_validation():
    """Test 1: Validate workflow schema definition"""
    try:
        schema_path = Path("/workspaces/terrafusion_os_1.0/workflow-registry/schemas/workflow-schema.json")
        
        if not schema_path.exists():
            log_test("Workflow Schema File", "failed", "Schema file not found")
            return
        
        with open(schema_path) as f:
            schema = json.load(f)
        
        # Check required schema elements
        required_elements = ["$schema", "title", "type", "properties"]
        missing = [elem for elem in required_elements if elem not in schema]
        
        if missing:
            log_test("Workflow Schema Structure", "failed", f"Missing elements: {missing}")
        else:
            log_test("Workflow Schema Structure", "passed", "All required elements present")
        
        # Check workflow properties
        if "properties" in schema:
            required_props = ["id", "name", "category", "department", "steps", "outputs"]
            workflow_props = schema["properties"].keys()
            missing_props = [prop for prop in required_props if prop not in workflow_props]
            
            if missing_props:
                log_test("Workflow Schema Properties", "failed", f"Missing properties: {missing_props}")
            else:
                log_test("Workflow Schema Properties", "passed", "All required properties defined")
        
    except Exception as e:
        log_test("Workflow Schema Validation", "failed", str(e))

async def test_workflow_files_validation():
    """Test 2: Validate all workflow JSON files"""
    workflows_dir = Path("/workspaces/terrafusion_os_1.0/workflow-registry/workflows")
    
    if not workflows_dir.exists():
        log_test("Workflows Directory", "failed", "Workflows directory not found")
        return
    
    workflow_files = list(workflows_dir.glob("*.json"))
    
    if len(workflow_files) == 0:
        log_test("Workflow Files Exist", "failed", "No workflow files found")
        return
    
    log_test("Workflow Files Exist", "passed", f"Found {len(workflow_files)} workflow files")
    
    # Test each workflow file
    for workflow_file in workflow_files:
        try:
            with open(workflow_file) as f:
                workflow = json.load(f)
            
            # Check required fields
            required_fields = ["id", "name", "category", "department", "steps"]
            missing_fields = [field for field in required_fields if field not in workflow]
            
            if missing_fields:
                log_test(f"Workflow {workflow_file.name}", "failed", f"Missing fields: {missing_fields}")
            else:
                # Check steps structure
                if "steps" in workflow and len(workflow["steps"]) > 0:
                    step_issues = []
                    for step in workflow["steps"]:
                        if "id" not in step:
                            step_issues.append("Step missing ID")
                        if "name" not in step:
                            step_issues.append("Step missing name")
                        if "type" not in step:
                            step_issues.append("Step missing type")
                    
                    if step_issues:
                        log_test(f"Workflow {workflow_file.name}", "failed", f"Step issues: {step_issues}")
                    else:
                        log_test(f"Workflow {workflow_file.name}", "passed", f"{len(workflow['steps'])} valid steps")
                else:
                    log_test(f"Workflow {workflow_file.name}", "failed", "No steps defined")
        
        except json.JSONDecodeError as e:
            log_test(f"Workflow {workflow_file.name}", "failed", f"JSON parse error: {e}")
        except Exception as e:
            log_test(f"Workflow {workflow_file.name}", "failed", f"Validation error: {e}")

async def test_execution_engine_initialization():
    """Test 3: Validate workflow execution engine"""
    try:
        # Import the execution engine
        import sys
        sys.path.append("/workspaces/terrafusion_os_1.0/workflow-registry/execution-engine")
        from workflow_engine import WorkflowExecutionEngine
        
        # Initialize engine
        engine = WorkflowExecutionEngine()
        
        # Test agent pool
        agent_status = engine.get_agent_pool_status()
        
        if agent_status["total_agents"] != 50000:
            log_test("Agent Pool Size", "failed", f"Expected 50,000 agents, got {agent_status['total_agents']}")
        else:
            log_test("Agent Pool Size", "passed", "50,000 agents initialized")
        
        # Test agent distribution
        expected_distribution = {
            "supreme_commander": 1,
            "field_general": 1220,
            "operational_force": 48779
        }
        
        actual_distribution = agent_status["agent_distribution"]
        distribution_errors = []
        
        for agent_type, expected_count in expected_distribution.items():
            actual_count = actual_distribution.get(agent_type, 0)
            if actual_count != expected_count:
                distribution_errors.append(f"{agent_type}: expected {expected_count}, got {actual_count}")
        
        if distribution_errors:
            log_test("Agent Distribution", "failed", "; ".join(distribution_errors))
        else:
            log_test("Agent Distribution", "passed", "All agent types correctly distributed")
        
        # Test workflow loading
        loaded_count = engine.load_all_workflows()
        if loaded_count == 0:
            log_test("Workflow Loading", "failed", "No workflows loaded")
        else:
            log_test("Workflow Loading", "passed", f"{loaded_count} workflows loaded successfully")
        
        return engine
        
    except ImportError as e:
        log_test("Execution Engine Import", "failed", f"Import error: {e}")
        return None
    except Exception as e:
        log_test("Execution Engine Initialization", "failed", str(e))
        return None

async def test_workflow_execution(engine):
    """Test 4: Execute sample workflow"""
    if engine is None:
        log_test("Workflow Execution", "skipped", "Engine not available")
        return
    
    try:
        # Test data for property assessment workflow
        test_data = {
            "parcel_id": "TEST-2025-000001",
            "property_address": "123 Test Street, Test City, WA",
            "assessment_type": "annual_review",
            "market_conditions": "stable"
        }
        
        # Execute workflow
        execution_id = await engine.execute_workflow(
            "tf-workflow-property-assessment-standard",
            test_data
        )
        
        if not execution_id:
            log_test("Workflow Execution", "failed", "No execution ID returned")
            return
        
        log_test("Workflow Execution Started", "passed", f"Execution ID: {execution_id}")
        
        # Monitor execution for a few seconds
        max_wait = 10
        wait_time = 0
        final_status = None
        
        while wait_time < max_wait:
            await asyncio.sleep(1)
            wait_time += 1
            
            status = engine.get_execution_status(execution_id)
            if status["status"] in ["completed", "failed"]:
                final_status = status
                break
        
        if final_status:
            if final_status["status"] == "completed":
                log_test("Workflow Execution", "passed", f"Completed in {wait_time} seconds")
                
                # Test performance metrics
                if "performance_metrics" in final_status and final_status["performance_metrics"]:
                    total_duration = sum(
                        metrics.get("duration_seconds", 0) 
                        for metrics in final_status["performance_metrics"].values()
                    )
                    log_test("Workflow Performance", "passed", f"Total duration: {total_duration:.2f}s")
                else:
                    log_test("Workflow Performance", "failed", "No performance metrics available")
            else:
                log_test("Workflow Execution", "failed", f"Execution failed: {final_status.get('error', 'Unknown error')}")
        else:
            log_test("Workflow Execution", "failed", f"Execution did not complete within {max_wait} seconds")
    
    except Exception as e:
        log_test("Workflow Execution", "failed", f"Execution error: {e}")

async def test_api_controller_structure():
    """Test 5: Validate API controller structure"""
    try:
        controller_path = Path("/workspaces/terrafusion_os_1.0/backend/TerraFusion.API/Controllers/WorkflowOrchestrationController.cs")
        
        if not controller_path.exists():
            log_test("API Controller File", "failed", "Controller file not found")
            return
        
        with open(controller_path, 'r') as f:
            controller_content = f.read()
        
        # Check for required endpoints
        required_endpoints = [
            "GetSwarmStatus",
            "ExecuteWorkflow", 
            "GetExecutionStatus",
            "CancelExecution",
            "GetAvailableWorkflows",
            "ScaleAgentPool",
            "GetPerformanceAnalytics",
            "HealthCheck"
        ]
        
        missing_endpoints = []
        for endpoint in required_endpoints:
            if endpoint not in controller_content:
                missing_endpoints.append(endpoint)
        
        if missing_endpoints:
            log_test("API Controller Endpoints", "failed", f"Missing endpoints: {missing_endpoints}")
        else:
            log_test("API Controller Endpoints", "passed", f"All {len(required_endpoints)} endpoints present")
        
        # Check for proper HTTP methods
        http_methods = ["[HttpGet", "[HttpPost"]
        methods_found = sum(1 for method in http_methods if method in controller_content)
        
        if methods_found == 0:
            log_test("API Controller HTTP Methods", "failed", "No HTTP method attributes found")
        else:
            log_test("API Controller HTTP Methods", "passed", f"{methods_found} HTTP method attributes found")
    
    except Exception as e:
        log_test("API Controller Structure", "failed", str(e))

async def test_ui_dashboards():
    """Test 6: Validate UI dashboard files"""
    ui_files = [
        ("/workspaces/terrafusion_os_1.0/workflow-registry/execution-engine/swarm_command_center.html", "Swarm Command Center"),
        ("/workspaces/terrafusion_os_1.0/workflow-registry/execution-engine/performance_dashboard.html", "Performance Dashboard")
    ]
    
    for file_path, name in ui_files:
        try:
            path = Path(file_path)
            if not path.exists():
                log_test(f"UI Dashboard - {name}", "failed", "File not found")
                continue
            
            with open(path, 'r') as f:
                content = f.read()
            
            # Check for basic HTML structure
            required_elements = ["<html", "<head>", "<body>", "<script>"]
            missing_elements = [elem for elem in required_elements if elem not in content]
            
            if missing_elements:
                log_test(f"UI Dashboard - {name}", "failed", f"Missing HTML elements: {missing_elements}")
            else:
                # Check for TerraFusion-specific content
                terrafusion_indicators = ["TerraFusion", "50,000", "agents", "workflow"]
                indicators_found = sum(1 for indicator in terrafusion_indicators if indicator.lower() in content.lower())
                
                if indicators_found >= 3:
                    log_test(f"UI Dashboard - {name}", "passed", f"Valid HTML with TerraFusion content")
                else:
                    log_test(f"UI Dashboard - {name}", "failed", "Missing TerraFusion-specific content")
        
        except Exception as e:
            log_test(f"UI Dashboard - {name}", "failed", str(e))

async def test_integration_readiness():
    """Test 7: Validate integration readiness"""
    try:
        # Check for integration configuration
        integration_systems = [
            "harris_pacs",
            "gis_system", 
            "valuation_kernel",
            "notification_service",
            "compliance_checker"
        ]
        
        # This would check actual integration endpoints in a real system
        # For now, we validate the structure is in place
        engine_path = Path("/workspaces/terrafusion_os_1.0/workflow-registry/execution-engine/workflow_engine.py")
        
        if engine_path.exists():
            with open(engine_path, 'r') as f:
                engine_content = f.read()
            
            found_integrations = []
            for system in integration_systems:
                if system in engine_content:
                    found_integrations.append(system)
            
            if len(found_integrations) >= len(integration_systems) * 0.8:  # 80% found
                log_test("Integration Systems", "passed", f"{len(found_integrations)}/{len(integration_systems)} systems configured")
            else:
                log_test("Integration Systems", "failed", f"Only {len(found_integrations)}/{len(integration_systems)} systems found")
        else:
            log_test("Integration Systems", "failed", "Engine file not found")
    
    except Exception as e:
        log_test("Integration Readiness", "failed", str(e))

async def test_week1_completion_metrics():
    """Test 8: Validate Week 1 completion metrics"""
    try:
        # Count implemented workflows
        workflows_dir = Path("/workspaces/terrafusion_os_1.0/workflow-registry/workflows")
        workflow_files = list(workflows_dir.glob("*.json")) if workflows_dir.exists() else []
        
        week1_target = 25
        current_count = len(workflow_files)
        
        completion_percentage = (current_count / week1_target) * 100
        
        if current_count >= week1_target:
            log_test("Week 1 Target Achievement", "passed", f"{current_count}/{week1_target} workflows completed (100%)")
        elif current_count >= week1_target * 0.5:  # 50% or more
            log_test("Week 1 Progress", "passed", f"{current_count}/{week1_target} workflows ({completion_percentage:.1f}% complete)")
        else:
            log_test("Week 1 Progress", "failed", f"Only {current_count}/{week1_target} workflows ({completion_percentage:.1f}% complete)")
        
        # Check for required workflow categories
        required_categories = [
            "property_assessment",
            "tax_collection", 
            "permitting",
            "appeals"
        ]
        
        if workflow_files:
            categories_found = set()
            for workflow_file in workflow_files:
                try:
                    with open(workflow_file) as f:
                        workflow = json.load(f)
                        if "category" in workflow:
                            categories_found.add(workflow["category"])
                except:
                    pass
            
            missing_categories = [cat for cat in required_categories if cat not in categories_found]
            
            if not missing_categories:
                log_test("Core Workflow Categories", "passed", f"All {len(required_categories)} core categories implemented")
            else:
                log_test("Core Workflow Categories", "failed", f"Missing categories: {missing_categories}")
        
    except Exception as e:
        log_test("Week 1 Completion Metrics", "failed", str(e))

async def run_comprehensive_tests():
    """Run all test suites"""
    print("🚀 TerraFusion Week 1 Implementation Test Suite")
    print("=" * 50)
    print(f"📅 Test Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    test_results["start_time"] = time.time()
    
    # Run all tests
    await test_workflow_schema_validation()
    await test_workflow_files_validation()
    engine = await test_execution_engine_initialization()
    await test_workflow_execution(engine)
    await test_api_controller_structure()
    await test_ui_dashboards()
    await test_integration_readiness()
    await test_week1_completion_metrics()
    
    test_results["end_time"] = time.time()
    
    # Print summary
    print()
    print("📊 TEST SUMMARY")
    print("=" * 50)
    print(f"Total Tests: {test_results['total_tests']}")
    print(f"✅ Passed: {test_results['passed']}")
    print(f"❌ Failed: {test_results['failed']}")
    print(f"⏭️ Skipped: {test_results['skipped']}")
    print(f"⏱️ Duration: {test_results['end_time'] - test_results['start_time']:.2f} seconds")
    
    success_rate = (test_results['passed'] / test_results['total_tests']) * 100 if test_results['total_tests'] > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    if test_results['failed'] > 0:
        print("\n❌ FAILED TESTS:")
        for error in test_results['errors']:
            print(f"   • {error}")
    
    print()
    if success_rate >= 80:
        print("🎉 WEEK 1 IMPLEMENTATION STATUS: EXCELLENT")
        print("   Ready to proceed to Week 2: Hive-Mind Knowledge Pools")
    elif success_rate >= 60:
        print("✅ WEEK 1 IMPLEMENTATION STATUS: GOOD")
        print("   Minor issues to address before Week 2")
    else:
        print("⚠️ WEEK 1 IMPLEMENTATION STATUS: NEEDS ATTENTION")
        print("   Significant issues require resolution")
    
    return success_rate

if __name__ == "__main__":
    asyncio.run(run_comprehensive_tests())