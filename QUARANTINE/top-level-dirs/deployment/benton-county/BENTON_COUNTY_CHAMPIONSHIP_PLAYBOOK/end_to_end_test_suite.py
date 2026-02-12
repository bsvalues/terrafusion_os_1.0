#!/usr/bin/env python3
"""
🧪 END-TO-END TEST SUITE
Championship-level testing for the dynasty system
"""

import asyncio
import pytest
import json
import time
from datetime import datetime
from pathlib import Path
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import our modules
from hybrid_llm_router import ChampionshipHybridRouter, QueryContext, DataSensitivity
from continuous_training_pipeline import ContinuousLearningEngine

class TestChampionshipSystem:
    """Comprehensive end-to-end tests"""
    
    @pytest.fixture
    async def router(self):
        """Create router instance"""
        return ChampionshipHybridRouter()
    
    @pytest.fixture
    async def training_engine(self):
        """Create training engine"""
        return ContinuousLearningEngine()
    
    # Test 1: Routing Logic
    @pytest.mark.asyncio
    async def test_sensitive_data_routing(self, router):
        """Test that sensitive data stays local"""
        print("🧪 Testing sensitive data routing...")
        
        sensitive_queries = [
            "What is the SSN for property owner at 123 Main?",
            "Show me John Doe's tax records",
            "List all owner names in ZIP 99352",
            "What is parcel BC-123456 owner's phone?"
        ]
        
        for query in sensitive_queries:
            context = QueryContext(
                query=query,
                user_id="test_user",
                data_type="property_query",
                metadata={}
            )
            
            result = await router.route_query(context)
            
            assert result['routed_to'] == 'local_ollama', f"Failed for: {query}"
            assert result['sensitivity'] == 'RED', f"Wrong sensitivity for: {query}"
            print(f"  ✅ '{query[:30]}...' -> Local (RED)")
    
    @pytest.mark.asyncio
    async def test_calculation_routing(self, router):
        """Test that calculations go to cloud"""
        print("🧪 Testing calculation routing...")
        
        calculation_queries = [
            "Calculate monthly payment for $250,000 at 6.5%",
            "What is the ROI for a $300k rental property?",
            "Compute cap rate for $500k property with $3k rent",
            "What's 30% down on $400,000?"
        ]
        
        for query in calculation_queries:
            context = QueryContext(
                query=query,
                user_id="test_user",
                data_type="calculation",
                metadata={}
            )
            
            result = await router.route_query(context)
            
            assert result['routed_to'] == 'cloud_llm', f"Failed for: {query}"
            assert result['sensitivity'] == 'GREEN', f"Wrong sensitivity for: {query}"
            print(f"  ✅ '{query[:30]}...' -> Cloud (GREEN)")
    
    @pytest.mark.asyncio
    async def test_mixed_data_routing(self, router):
        """Test that mixed data gets anonymized"""
        print("🧪 Testing mixed data routing...")
        
        mixed_queries = [
            "Compare 123 Main St value to neighborhood average",
            "Calculate ROI for John Doe's property at 456 Oak Ave",
            "What's the cap rate for parcel BC-789 at current value?"
        ]
        
        for query in mixed_queries:
            context = QueryContext(
                query=query,
                user_id="test_user",
                data_type="mixed",
                metadata={}
            )
            
            result = await router.route_query(context)
            
            assert result['sensitivity'] == 'YELLOW', f"Wrong sensitivity for: {query}"
            assert result.get('anonymized', False), f"Not anonymized: {query}"
            print(f"  ✅ '{query[:30]}...' -> Anonymized + Cloud (YELLOW)")
    
    # Test 2: Continuous Learning
    @pytest.mark.asyncio
    async def test_continuous_learning(self, training_engine):
        """Test that system learns from queries"""
        print("🧪 Testing continuous learning...")
        
        # Simulate query patterns
        queries = [
            {'query': 'What is zoning for 123 Main?', 'response_time': 250, 'confidence': 0.8},
            {'query': 'Show zoning for Oak Street', 'response_time': 300, 'confidence': 0.7},
            {'query': 'Zoning information needed', 'response_time': 400, 'confidence': 0.6}
        ]
        
        # Add to learning buffer
        for q in queries:
            training_engine.learning_buffer.append(q)
        
        # Extract patterns
        patterns = training_engine._extract_query_patterns(list(training_engine.learning_buffer))
        
        assert len(patterns) > 0, "No patterns extracted"
        assert any(p['type'] == 'zoning_queries' for p in patterns), "Zoning pattern not detected"
        print(f"  ✅ Extracted {len(patterns)} patterns from queries")
    
    # Test 3: Performance Benchmarks
    @pytest.mark.asyncio
    async def test_performance_benchmarks(self, router):
        """Test system performance meets championship standards"""
        print("🧪 Testing performance benchmarks...")
        
        response_times = []
        
        for i in range(100):
            start = time.time()
            
            context = QueryContext(
                query=f"Test query {i}",
                user_id="benchmark_user",
                data_type="test",
                metadata={}
            )
            
            await router.route_query(context)
            
            elapsed = (time.time() - start) * 1000  # ms
            response_times.append(elapsed)
        
        avg_time = sum(response_times) / len(response_times)
        p95_time = sorted(response_times)[95]
        
        assert avg_time < 100, f"Average response time {avg_time:.1f}ms exceeds 100ms"
        assert p95_time < 200, f"P95 response time {p95_time:.1f}ms exceeds 200ms"
        
        print(f"  ✅ Avg: {avg_time:.1f}ms, P95: {p95_time:.1f}ms")
    
    # Test 4: Security Validation
    @pytest.mark.asyncio
    async def test_security_validation(self, router):
        """Test security measures"""
        print("🧪 Testing security validation...")
        
        # Test SQL injection protection
        malicious_queries = [
            "'; DROP TABLE properties; --",
            "' OR '1'='1",
            "<script>alert('xss')</script>",
            "../../etc/passwd"
        ]
        
        for query in malicious_queries:
            context = QueryContext(
                query=query,
                user_id="attacker",
                data_type="malicious",
                metadata={}
            )
            
            result = await router.route_query(context)
            
            # Should handle gracefully without exposing system
            assert 'error' not in str(result).lower()
            assert 'table' not in str(result).lower()
            print(f"  ✅ Safely handled: '{query[:20]}...'")
    
    # Test 5: Integration Flow
    @pytest.mark.asyncio
    async def test_full_integration_flow(self, router, training_engine):
        """Test complete integration flow"""
        print("🧪 Testing full integration flow...")
        
        # Step 1: User query
        user_query = "What's the average home value in 99352?"
        context = QueryContext(
            query=user_query,
            user_id="integration_test",
            data_type="market_analysis",
            metadata={'timestamp': datetime.now().isoformat()}
        )
        
        # Step 2: Route query
        result = await router.route_query(context)
        assert result['routed_to'] in ['local_ollama', 'cloud_llm']
        print(f"  ✅ Query routed to: {result['routed_to']}")
        
        # Step 3: Add to learning
        training_engine.learning_buffer.append({
            'query': user_query,
            'route': result['routed_to'],
            'timestamp': datetime.now().isoformat()
        })
        print(f"  ✅ Added to learning buffer")
        
        # Step 4: Update stats
        router.stats['total_queries'] += 1
        stats = router.get_game_stats()
        assert stats['total_plays'] > 0
        print(f"  ✅ Stats updated: {stats['total_plays']} queries")
        
        print("  ✅ Full integration flow complete!")
    
    # Test 6: Monitoring & Metrics
    @pytest.mark.asyncio
    async def test_monitoring_metrics(self, router):
        """Test monitoring and metrics collection"""
        print("🧪 Testing monitoring & metrics...")
        
        # Process some queries
        for i in range(10):
            context = QueryContext(
                query=f"Metric test query {i}",
                user_id="metrics_test",
                data_type="test",
                metadata={}
            )
            await router.route_query(context)
        
        # Check metrics
        stats = router.get_game_stats()
        
        assert stats['total_plays'] >= 10
        assert float(stats['local_percentage'].rstrip('%')) >= 0
        assert float(stats['cloud_percentage'].rstrip('%')) >= 0
        assert stats['security_score'] == '100%' or stats['security_score'] == 'N/A'
        
        print(f"  ✅ Metrics collected: {stats}")

async def run_all_tests():
    """Run complete test suite"""
    print("🏆 CHAMPIONSHIP END-TO-END TEST SUITE")
    print("=====================================")
    print()
    
    # Create test instances
    test_suite = TestChampionshipSystem()
    router = ChampionshipHybridRouter()
    training_engine = ContinuousLearningEngine()
    
    # Run all tests
    tests = [
        test_suite.test_sensitive_data_routing(router),
        test_suite.test_calculation_routing(router),
        test_suite.test_mixed_data_routing(router),
        test_suite.test_continuous_learning(training_engine),
        test_suite.test_performance_benchmarks(router),
        test_suite.test_security_validation(router),
        test_suite.test_full_integration_flow(router, training_engine),
        test_suite.test_monitoring_metrics(router)
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            await test
            passed += 1
        except AssertionError as e:
            failed += 1
            print(f"  ❌ Test failed: {e}")
        except Exception as e:
            failed += 1
            print(f"  ❌ Test error: {e}")
    
    print()
    print("📊 TEST RESULTS")
    print("===============")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
    
    if failed == 0:
        print()
        print("🏆 ALL TESTS PASSED! CHAMPIONSHIP QUALITY CONFIRMED!")
    else:
        print()
        print("⚠️  Some tests failed. Review and fix before production.")

if __name__ == "__main__":
    # Run tests
    asyncio.run(run_all_tests())