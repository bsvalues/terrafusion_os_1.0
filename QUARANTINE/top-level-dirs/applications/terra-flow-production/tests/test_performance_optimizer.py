"""
Test Performance Optimizer

This module tests the performance optimization functionality.
"""

import os
import sys
import unittest
import time
from unittest.mock import patch, MagicMock

# Add parent directory to path to import modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from performance.optimization import PerformanceOptimizer, cached, timed


class TestPerformanceOptimizer(unittest.TestCase):
    """Test cases for the performance optimizer"""

    def setUp(self):
        """Set up test environment"""
        self.config = {
            "cache_enabled": True,
            "cache_default_ttl": 10,
            "max_cache_size": 100,
            "query_optimization_enabled": True,
            "slow_query_threshold": 0.5,
            "monitoring_enabled": True
        }
        self.optimizer = PerformanceOptimizer(self.config)

    def test_optimizer_initialization(self):
        """Test optimizer initialization"""
        self.assertIsInstance(self.optimizer, PerformanceOptimizer)
        self.assertEqual(self.optimizer.cache_default_ttl, 10)
        self.assertEqual(self.optimizer.max_cache_size, 100)
        self.assertTrue(self.optimizer.cache_enabled)
        self.assertTrue(self.optimizer.query_optimization_enabled)
        self.assertEqual(self.optimizer.slow_query_threshold, 0.5)

    def test_cache_decorator(self):
        """Test cache decorator functionality"""
        call_count = 0
        
        @self.optimizer.cache(ttl=5)
        def test_function(x):
            nonlocal call_count
            call_count += 1
            return x * 2
        
        # First call should execute the function
        result1 = test_function(10)
        self.assertEqual(result1, 20)
        self.assertEqual(call_count, 1)
        
        # Second call with same argument should use cache
        result2 = test_function(10)
        self.assertEqual(result2, 20)
        self.assertEqual(call_count, 1)  # Count should not increase
        
        # Call with different argument should execute function again
        result3 = test_function(20)
        self.assertEqual(result3, 40)
        self.assertEqual(call_count, 2)
        
        # Verify cache hits and misses
        self.assertEqual(self.optimizer.metrics["cache_hits"], 1)
        self.assertEqual(self.optimizer.metrics["cache_misses"], 2)

    def test_cache_expiration(self):
        """Test cache expiration"""
        call_count = 0
        
        @self.optimizer.cache(ttl=1)  # 1 second TTL
        def test_function(x):
            nonlocal call_count
            call_count += 1
            return x * 2
        
        # First call
        result1 = test_function(10)
        self.assertEqual(result1, 20)
        self.assertEqual(call_count, 1)
        
        # Second call before expiration
        result2 = test_function(10)
        self.assertEqual(result2, 20)
        self.assertEqual(call_count, 1)
        
        # Wait for cache to expire
        time.sleep(1.1)
        
        # Call after expiration
        result3 = test_function(10)
        self.assertEqual(result3, 20)
        self.assertEqual(call_count, 2)  # Count should increase

    def test_cache_disabled(self):
        """Test behavior when cache is disabled"""
        # Disable cache
        self.optimizer.cache_enabled = False
        
        call_count = 0
        
        @self.optimizer.cache()
        def test_function(x):
            nonlocal call_count
            call_count += 1
            return x * 2
        
        # Multiple calls should always execute the function
        result1 = test_function(10)
        self.assertEqual(result1, 20)
        self.assertEqual(call_count, 1)
        
        result2 = test_function(10)
        self.assertEqual(result2, 20)
        self.assertEqual(call_count, 2)
        
        # Re-enable cache for other tests
        self.optimizer.cache_enabled = True

    def test_create_cache_key(self):
        """Test creation of cache keys"""
        def test_function(a, b, c=None):
            return a + b
        
        # Test with positional args
        key1 = self.optimizer._create_cache_key(test_function, (1, 2), {})
        self.assertIn("test_function", key1)
        self.assertIn("1,2", key1)
        
        # Test with keyword args
        key2 = self.optimizer._create_cache_key(test_function, (1,), {"b": 2, "c": 3})
        self.assertIn("test_function", key2)
        self.assertIn("1", key2)
        self.assertIn("b=2", key2)
        self.assertIn("c=3", key2)
        
        # Ensure different args produce different keys
        key3 = self.optimizer._create_cache_key(test_function, (3, 4), {})
        self.assertNotEqual(key1, key3)
        
        # Test with complex objects
        obj = object()
        key4 = self.optimizer._create_cache_key(test_function, (obj, 2), {})
        self.assertIn("object:", key4)

    def test_convert_arg_to_str(self):
        """Test conversion of arguments to string representation"""
        # Simple types
        self.assertEqual(self.optimizer._convert_arg_to_str(None), "None")
        self.assertEqual(self.optimizer._convert_arg_to_str(10), "10")
        self.assertEqual(self.optimizer._convert_arg_to_str(True), "True")
        self.assertEqual(self.optimizer._convert_arg_to_str("test"), "test")
        
        # Complex types
        self.assertEqual(self.optimizer._convert_arg_to_str([1, 2, 3]), "[1,2,3]")
        self.assertEqual(self.optimizer._convert_arg_to_str((4, 5)), "[4,5]")
        self.assertEqual(self.optimizer._convert_arg_to_str({"a": 1, "b": 2}), "{a:1,b:2}")
        
        # Test nested structures
        nested = {"x": [1, 2], "y": {"z": 3}}
        nested_str = self.optimizer._convert_arg_to_str(nested)
        self.assertIn("x:[1,2]", nested_str)
        self.assertIn("y:{z:3}", nested_str)
        
        # Test object conversion
        obj = object()
        obj_str = self.optimizer._convert_arg_to_str(obj)
        self.assertIn("object:", obj_str)

    def test_clear_cache(self):
        """Test cache clearing functionality"""
        # Populate cache
        @self.optimizer.cache()
        def test_function1(x):
            return x * 2
        
        @self.optimizer.cache()
        def test_function2(x):
            return x * 3
        
        test_function1(10)
        test_function1(20)
        test_function2(10)
        
        # Cache should have entries
        cache_stats = self.optimizer.get_cache_stats()
        self.assertGreater(cache_stats["size"], 0)
        
        # Clear cache with pattern
        self.optimizer.clear_cache(pattern="test_function1")
        
        # Only test_function1 entries should be cleared
        cache_stats = self.optimizer.get_cache_stats()
        self.assertEqual(cache_stats["size"], 1)  # Only test_function2 entry remains
        
        # Populate again
        test_function1(10)
        
        # Clear all cache
        self.optimizer.clear_cache()
        
        # Cache should be empty
        cache_stats = self.optimizer.get_cache_stats()
        self.assertEqual(cache_stats["size"], 0)

    def test_cache_eviction(self):
        """Test cache eviction when size limit is reached"""
        # Set very small cache size
        original_size = self.optimizer.max_cache_size
        self.optimizer.max_cache_size = 3
        
        @self.optimizer.cache()
        def test_function(x):
            return x
        
        # Fill cache beyond capacity
        for i in range(5):
            test_function(i)
        
        # Cache size should be limited
        cache_stats = self.optimizer.get_cache_stats()
        self.assertLessEqual(cache_stats["size"], 3)
        
        # Restore original size
        self.optimizer.max_cache_size = original_size

    def test_measure_time_decorator(self):
        """Test time measurement decorator"""
        # Define a function that will exceed the slow threshold
        @self.optimizer.measure_time
        def slow_function():
            time.sleep(0.6)  # Exceeds 0.5s threshold
            return "done"
        
        # Execute the function
        with patch('performance.optimization.logger') as mock_logger:
            result = slow_function()
            self.assertEqual(result, "done")
            
            # Verify logging of slow function
            calls = [call[0] for call in mock_logger.info.call_args_list]
            log_messages = [call[0] for call in calls if isinstance(call[0], str)]
            slow_log_found = False
            for msg in log_messages:
                if "slow_function" in msg.lower() and "slow function" in msg.lower():
                    slow_log_found = True
                    break
            self.assertTrue(slow_log_found)

    def test_measure_time_context_manager(self):
        """Test time measurement context manager"""
        # Use as context manager
        with patch('performance.optimization.logger') as mock_logger:
            with self.optimizer.measure_time("test_operation") as timer:
                time.sleep(0.6)  # Exceeds 0.5s threshold
                
            # Verify logging
            calls = [call[0] for call in mock_logger.info.call_args_list]
            log_messages = [call[0] for call in calls if isinstance(call[0], str)]
            slow_log_found = False
            for msg in log_messages:
                if "test_operation" in msg.lower() and "slow operation" in msg.lower():
                    slow_log_found = True
                    break
            self.assertTrue(slow_log_found)
            
            # Verify elapsed time
            self.assertGreaterEqual(timer.elapsed, 0.6)

    @patch('performance.optimization.SQLALCHEMY_AVAILABLE', True)
    @patch('performance.optimization.text')
    def test_optimize_query(self, mock_text):
        """Test SQL query optimization"""
        # Create mock session
        mock_session = MagicMock()
        mock_result = MagicMock()
        mock_session.execute.return_value = mock_result
        mock_result.fetchall.return_value = [("Some execution plan",)]
        
        # Test with a SELECT query
        query = "SELECT * FROM users ORDER BY name LIMIT 10"
        optimized = self.optimizer.optimize_query(mock_session, query)
        
        # Should add query hints
        self.assertIn("INDEX_ORDER", optimized)
        
        # Test with a non-SELECT query
        query = "UPDATE users SET status = 'active'"
        optimized = self.optimizer.optimize_query(mock_session, query)
        
        # Should not modify non-SELECT queries
        self.assertEqual(optimized, query)

    def test_get_cache_stats(self):
        """Test retrieval of cache statistics"""
        # Generate some cache activity
        @self.optimizer.cache()
        def test_function(x):
            return x * 2
        
        test_function(10)
        test_function(10)  # Hit
        test_function(20)
        test_function(10)  # Hit
        
        # Get stats
        stats = self.optimizer.get_cache_stats()
        
        # Verify stats
        self.assertIn("hits", stats)
        self.assertIn("misses", stats)
        self.assertIn("size", stats)
        self.assertIn("hit_rate", stats)
        
        self.assertEqual(stats["hits"], 2)
        self.assertEqual(stats["misses"], 2)
        self.assertEqual(stats["size"], 2)
        self.assertEqual(stats["hit_rate"], 0.5)  # 2 hits out of 4 calls

    def test_analyze_application_performance(self):
        """Test application performance analysis"""
        # Generate some performance metrics
        self.optimizer.metrics["total_queries"] = 100
        self.optimizer.metrics["slow_query_count"] = 5
        self.optimizer.metrics["slow_queries"] = [
            {"query": "SELECT * FROM large_table", "duration": 2.5},
            {"query": "SELECT * FROM users JOIN orders", "duration": 1.8}
        ]
        
        # Get performance analysis
        metrics = self.optimizer.analyze_application_performance()
        
        # Verify metrics
        self.assertIn("cache", metrics)
        self.assertIn("queries", metrics)
        
        self.assertEqual(metrics["queries"]["total"], 100)
        self.assertEqual(metrics["queries"]["slow_count"], 5)
        self.assertEqual(len(metrics["queries"]["slow_queries"]), 2)

    @patch('performance.optimization.SQLALCHEMY_AVAILABLE', True)
    def test_convenience_decorators(self):
        """Test convenience decorator functions"""
        # Test cached decorator
        call_count = 0
        
        @cached(ttl=5)
        def cached_function(x):
            nonlocal call_count
            call_count += 1
            return x * 2
        
        # First call and cache hit
        cached_function(10)
        cached_function(10)
        
        self.assertEqual(call_count, 1)
        
        # Test timed decorator
        @timed
        def timed_function():
            time.sleep(0.1)
            return "done"
        
        result = timed_function()
        self.assertEqual(result, "done")


if __name__ == '__main__':
    unittest.main()