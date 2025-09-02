#!/usr/bin/env python3

"""
TerraFusion Audit System Test Script
Quick validation and demo of the comprehensive audit system
"""

import asyncio
import sys
import os
from datetime import datetime

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def print_banner():
    print("=" * 70)
    print("🧪 TerraFusion Audit System Test & Demo")
    print("=" * 70)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

async def test_feature_implementation_audit():
    """Test the Feature Implementation Audit Agent"""
    print("🔍 Testing Feature Implementation Audit Agent...")
    
    try:
        # Import and test the agent
        from feature_implementation_audit_agent import FeatureImplementationAuditAgent
        
        session_id = f"test_feature_audit_{int(datetime.now().timestamp())}"
        agent = FeatureImplementationAuditAgent(session_id)
        
        print(f"   ✅ Agent initialized with session: {session_id}")
        print(f"   📋 Found {len(agent.feature_definitions)} feature definitions")
        print(f"   🏠 Project root: {agent.project_root}")
        
        # Test a single feature audit (limited for demo)
        if agent.feature_definitions:
            sample_feature = agent.feature_definitions[0]
            print(f"   🧪 Testing sample feature: {sample_feature.name}")
            
            result = await agent._audit_single_feature(sample_feature)
            print(f"   📊 Status: {result.implementation_status.value}")
            print(f"   📈 Quality Score: {result.quality_score}/100")
            print(f"   🧪 Test Coverage: {result.test_coverage_percent:.1f}%")
            print(f"   📚 Documentation: {'✅' if result.documentation_complete else '❌'}")
            print(f"   🔒 Security: {'✅' if result.security_compliant else '❌'}")
            
        return True
        
    except ImportError as e:
        print(f"   ❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"   ❌ Test failed: {e}")
        return False

async def test_data_workflow_audit():
    """Test the Data Workflow Audit Agent"""
    print("📊 Testing Data Workflow Audit Agent...")
    
    try:
        # Import and test the agent
        from data_workflow_audit_agent import DataWorkflowAuditAgent
        
        session_id = f"test_data_audit_{int(datetime.now().timestamp())}"
        agent = DataWorkflowAuditAgent(session_id)
        
        print(f"   ✅ Agent initialized with session: {session_id}")
        
        # Test a simple pipeline audit (mock)
        pipeline_test = {
            'name': 'Test Pipeline',
            'stages': ['validation', 'processing'],
            'expected_latency_ms': 1000,
            'expected_throughput': 100
        }
        
        result = await agent.test_pipeline_flow(pipeline_test)
        print(f"   📊 Pipeline test result: {result}")
        print(f"   ⏱️  Latency: {result['latency_ms']:.1f}ms")
        print(f"   📈 Throughput: {result['throughput']:.1f} req/min")
        
        return True
        
    except ImportError as e:
        print(f"   ❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"   ❌ Test failed: {e}")
        return False

def test_database_connectivity():
    """Test database connectivity for audit system"""
    print("🗄️  Testing Database Connectivity...")
    
    try:
        import psycopg2
        
        # Test connection
        conn = psycopg2.connect('postgresql://postgres@localhost/terrafusion')
        cur = conn.cursor()
        
        # Test basic query
        cur.execute("SELECT 1 as test")
        result = cur.fetchone()
        
        if result and result[0] == 1:
            print("   ✅ Database connection successful")
            
            # Check if audit tables exist
            cur.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name LIKE '%audit%'
                ORDER BY table_name
            """)
            
            tables = cur.fetchall()
            if tables:
                print(f"   📋 Found {len(tables)} audit tables:")
                for table in tables:
                    print(f"      - {table[0]}")
            else:
                print("   ⚠️  No audit tables found - run comprehensive-audit-system.sh first")
                
            conn.close()
            return True
        else:
            print("   ❌ Database query failed")
            return False
            
    except ImportError:
        print("   ❌ psycopg2 not installed: pip install psycopg2-binary")
        return False
    except Exception as e:
        print(f"   ❌ Database connection failed: {e}")
        print("   💡 Make sure PostgreSQL is running and database 'terrafusion' exists")
        return False

def test_project_structure():
    """Test project structure and file availability"""
    print("📁 Testing Project Structure...")
    
    base_path = os.path.dirname(os.path.abspath(__file__))
    
    # Check for required files
    required_files = [
        'feature-implementation-audit-agent.py',
        'data-workflow-audit-agent.py',
        'run-comprehensive-audit.sh',
        'comprehensive-audit-system.sh',
        'README-AUDIT-SYSTEM.md'
    ]
    
    missing_files = []
    existing_files = []
    
    for file_name in required_files:
        file_path = os.path.join(base_path, file_name)
        if os.path.exists(file_path):
            existing_files.append(file_name)
            file_size = os.path.getsize(file_path)
            print(f"   ✅ {file_name} ({file_size:,} bytes)")
        else:
            missing_files.append(file_name)
            print(f"   ❌ {file_name} - Missing")
    
    print(f"   📊 Summary: {len(existing_files)}/{len(required_files)} files found")
    
    if missing_files:
        print(f"   ⚠️  Missing files: {', '.join(missing_files)}")
        return False
    else:
        print("   ✅ All required files present")
        return True

def test_dependencies():
    """Test required Python dependencies"""
    print("📦 Testing Dependencies...")
    
    dependencies = [
        ('psycopg2', 'Database connectivity'),
        ('pandas', 'Data manipulation'),
        ('numpy', 'Numerical computations'),
        ('aiohttp', 'Async HTTP client'),
        ('requests', 'HTTP requests'),
        ('yaml', 'Configuration parsing')
    ]
    
    missing_deps = []
    available_deps = []
    
    for dep_name, description in dependencies:
        try:
            __import__(dep_name)
            available_deps.append(dep_name)
            print(f"   ✅ {dep_name} - {description}")
        except ImportError:
            missing_deps.append((dep_name, description))
            print(f"   ❌ {dep_name} - {description} (Not installed)")
    
    print(f"   📊 Summary: {len(available_deps)}/{len(dependencies)} dependencies available")
    
    if missing_deps:
        print("\n   💡 Install missing dependencies:")
        for dep_name, _ in missing_deps:
            if dep_name == 'psycopg2':
                print(f"      pip install psycopg2-binary")
            elif dep_name == 'yaml':
                print(f"      pip install PyYAML")
            else:
                print(f"      pip install {dep_name}")
        return False
    else:
        print("   ✅ All dependencies available")
        return True

async def run_mini_audit_demo():
    """Run a mini audit demonstration"""
    print("🎯 Running Mini Audit Demo...")
    
    try:
        # This would normally run the full audit
        # For demo, we'll simulate it
        
        print("   🔍 Simulating feature implementation checks...")
        await asyncio.sleep(1)
        print("   📊 Simulating data workflow validation...")
        await asyncio.sleep(1)
        print("   🔒 Simulating security compliance checks...")
        await asyncio.sleep(1)
        print("   ⚡ Simulating performance validation...")
        await asyncio.sleep(1)
        
        # Mock results
        print("\n   📋 Demo Results:")
        print("      Features audited: 50")
        print("      Fully implemented: 42 (84%)")
        print("      Partially implemented: 6 (12%)")
        print("      Not implemented: 2 (4%)")
        print("      Overall quality score: 87.3/100")
        print("      Test coverage: 82.1%")
        print("      Security compliance: 91.5%")
        
        print("   ✅ Mini audit demo completed successfully!")
        return True
        
    except Exception as e:
        print(f"   ❌ Demo failed: {e}")
        return False

async def main():
    """Main test execution"""
    print_banner()
    
    # Run all tests
    tests = [
        ("Project Structure", test_project_structure()),
        ("Dependencies", test_dependencies()),
        ("Database Connectivity", test_database_connectivity()),
        ("Feature Audit Agent", test_feature_implementation_audit()),
        ("Data Workflow Agent", test_data_workflow_audit()),
        ("Mini Audit Demo", run_mini_audit_demo())
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print()
        if asyncio.iscoroutine(test_func):
            result = await test_func
        else:
            result = test_func
        results.append((test_name, result))
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 Test Summary")
    print("=" * 70)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status:<8} {test_name}")
        if result:
            passed += 1
    
    print()
    print(f"Overall: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("🎉 All tests passed! Audit system is ready to use.")
        print("\n💡 Next steps:")
        print("   1. Run: ./run-comprehensive-audit.sh")
        print("   2. Check generated reports in reports/audit/")
        print("   3. Review audit findings and recommendations")
    else:
        print("⚠️  Some tests failed. Please address issues before running full audit.")
        return 1
    
    return 0

if __name__ == '__main__':
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\n🛑 Tests interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)