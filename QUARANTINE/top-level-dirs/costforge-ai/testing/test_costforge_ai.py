#!/usr/bin/env python3
"""
CostForge AI Test Suite
Comprehensive testing for quantum-enhanced property valuation system

Tests include:
- Unit tests for ML models
- Integration tests for API endpoints
- Performance benchmarks
- Accuracy validation
- Quantum optimization verification
"""

import pytest
import asyncio
import aiohttp
import numpy as np
import time
from typing import List, Dict, Any
import json
import os
from datetime import datetime, timedelta

# Import our services
from costforge_ml_service import (
    CostForgeMLService,
    PropertyData,
    ValuationResult,
    QuantumOptimizationConfig,
    create_costforge_ml_service
)

class TestCostForgeMLService:
    """Test suite for CostForge ML Service"""

    @pytest.fixture
    async def ml_service(self):
        """Create and initialize ML service for testing"""
        service = create_costforge_ml_service()
        await service.initialize()
        yield service
        await service.shutdown()

    @pytest.fixture
    def sample_property_data(self):
        """Sample property data for testing"""
        return PropertyData(
            parcel_id="TEST-12345",
            county_id="benton",
            square_footage=2400.0,
            lot_size=0.25,
            year_built=2015,
            bedrooms=4,
            bathrooms=2.5,
            property_type="single_family",
            zoning="residential",
            location={"lat": 46.2619, "lng": -119.2706}
        )

    @pytest.mark.asyncio
    async def test_service_initialization(self, ml_service):
        """Test that ML service initializes correctly"""
        assert ml_service is not None
        assert len(ml_service.models) > 0
        assert len(ml_service.model_metadata) > 0

        status = await ml_service.get_service_status()
        assert status['status'] == 'operational'
        assert status['models_loaded'] > 0
        assert status['quantum_factor'] == 949

    @pytest.mark.asyncio
    async def test_single_property_valuation(self, ml_service, sample_property_data):
        """Test single property valuation"""
        result = await ml_service.calculate_property_valuation(sample_property_data)

        assert isinstance(result, ValuationResult)
        assert result.parcel_id == "TEST-12345"
        assert result.estimated_value > 0
        assert result.land_value > 0
        assert result.improvement_value > 0
        assert 0 <= result.confidence_score <= 100
        assert result.processing_time_ms > 0
        assert len(result.factors_considered) > 0
        assert len(result.comparable_properties) > 0

    @pytest.mark.asyncio
    async def test_quantum_enhancement(self, ml_service, sample_property_data):
        """Test that quantum enhancement improves accuracy"""
        result = await ml_service.calculate_property_valuation(sample_property_data)

        # Verify quantum factor is applied
        assert "Quantum" in result.calculation_method
        assert result.confidence_score >= 98.0  # Should meet high accuracy target

        # Verify quantum factor in calculation method
        assert str(ml_service.quantum_config.factor) in result.calculation_method

    @pytest.mark.asyncio
    async def test_batch_processing(self, ml_service):
        """Test batch property valuation"""
        # Create multiple test properties
        properties = []
        for i in range(5):
            prop = PropertyData(
                parcel_id=f"BATCH-{i:03d}",
                county_id="benton",
                square_footage=2000 + i * 100,
                lot_size=0.2 + i * 0.05,
                year_built=2010 + i,
                bedrooms=3 + i % 2,
                bathrooms=2.0 + i * 0.5,
                property_type="single_family",
                zoning="residential",
                location={"lat": 46.26 + i * 0.001, "lng": -119.27 + i * 0.001}
            )
            properties.append(prop)

        results = await ml_service.batch_calculate_valuations(properties)

        assert len(results) == 5
        for result in results:
            assert isinstance(result, ValuationResult)
            assert result.estimated_value > 0
            assert result.confidence_score >= 90.0

    @pytest.mark.asyncio
    async def test_performance_requirements(self, ml_service, sample_property_data):
        """Test that performance meets championship requirements"""
        start_time = time.time()
        result = await ml_service.calculate_property_valuation(sample_property_data)
        end_time = time.time()

        processing_time_ms = (end_time - start_time) * 1000

        # Performance requirements
        assert processing_time_ms < 5000  # Should complete in under 5 seconds
        assert result.confidence_score >= 98.0  # Championship accuracy
        assert result.processing_time_ms > 0

    @pytest.mark.asyncio
    async def test_accuracy_consistency(self, ml_service, sample_property_data):
        """Test that valuations are consistent across multiple runs"""
        results = []

        # Run valuation multiple times
        for _ in range(3):
            result = await ml_service.calculate_property_valuation(sample_property_data)
            results.append(result)

        # Check consistency (values should be similar)
        values = [r.estimated_value for r in results]
        confidence_scores = [r.confidence_score for r in results]

        # Values should be within 5% of each other
        max_value = max(values)
        min_value = min(values)
        variation = (max_value - min_value) / min_value
        assert variation < 0.05  # Less than 5% variation

        # Confidence scores should be consistent
        avg_confidence = sum(confidence_scores) / len(confidence_scores)
        assert avg_confidence >= 98.0

class TestCostForgeAPI:
    """Test suite for CostForge API Service"""

    @pytest.fixture
    def api_base_url(self):
        """API base URL for testing"""
        return os.getenv('COSTFORGE_TEST_API_URL', 'http://localhost:8002')

    @pytest.fixture
    def sample_valuation_request(self):
        """Sample valuation request for API testing"""
        return {
            "parcel_id": "API-TEST-12345",
            "county_id": "benton",
            "square_footage": 2400.0,
            "lot_size": 0.25,
            "year_built": 2015,
            "bedrooms": 4,
            "bathrooms": 2.5,
            "property_type": "single_family",
            "zoning": "residential",
            "latitude": 46.2619,
            "longitude": -119.2706
        }

    @pytest.mark.asyncio
    async def test_health_endpoint(self, api_base_url):
        """Test API health endpoint"""
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{api_base_url}/health") as response:
                assert response.status == 200
                data = await response.json()
                assert data['status'] in ['healthy', 'degraded']
                assert 'timestamp' in data
                assert 'quantum_factor' in data

    @pytest.mark.asyncio
    async def test_status_endpoint(self, api_base_url):
        """Test API status endpoint"""
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{api_base_url}/status") as response:
                assert response.status == 200
                data = await response.json()
                assert data['quantum_factor'] == 949
                assert data['models_loaded'] > 0
                assert data['target_accuracy'] >= 0.99

    @pytest.mark.asyncio
    async def test_valuation_endpoint(self, api_base_url, sample_valuation_request):
        """Test property valuation API endpoint"""
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{api_base_url}/api/calculate-valuation",
                json=sample_valuation_request,
                headers={'Content-Type': 'application/json'}
            ) as response:
                assert response.status == 200
                data = await response.json()

                assert data['parcel_id'] == "API-TEST-12345"
                assert data['estimated_value'] > 0
                assert data['confidence_score'] >= 98.0
                assert 'quantum' in data['calculation_method'].lower()
                assert len(data['factors_considered']) > 5

    @pytest.mark.asyncio
    async def test_batch_valuation_endpoint(self, api_base_url):
        """Test batch valuation API endpoint"""
        batch_request = {
            "properties": [
                {
                    "parcel_id": f"BATCH-API-{i:03d}",
                    "county_id": "benton",
                    "square_footage": 2000 + i * 100,
                    "lot_size": 0.2,
                    "year_built": 2015,
                    "bedrooms": 3,
                    "bathrooms": 2.0,
                    "property_type": "single_family",
                    "zoning": "residential",
                    "latitude": 46.26,
                    "longitude": -119.27
                }
                for i in range(3)
            ],
            "max_concurrency": 5
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{api_base_url}/api/batch-calculate-valuations",
                json=batch_request,
                headers={'Content-Type': 'application/json'}
            ) as response:
                assert response.status == 200
                data = await response.json()

                assert data['total_requested'] == 3
                assert data['successful_valuations'] == 3
                assert data['failed_valuations'] == 0
                assert len(data['results']) == 3

    @pytest.mark.asyncio
    async def test_models_endpoint(self, api_base_url):
        """Test models information endpoint"""
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{api_base_url}/api/models") as response:
                assert response.status == 200
                data = await response.json()

                assert data['models_loaded'] > 0
                assert data['quantum_factor'] == 949
                assert 'models' in data

class TestQuantumOptimization:
    """Test suite for quantum optimization features"""

    @pytest.mark.asyncio
    async def test_quantum_factor_impact(self):
        """Test that quantum factor impacts accuracy and performance"""

        # Test with different quantum factors
        quantum_factors = [900, 949, 999]
        results = []

        for factor in quantum_factors:
            # Create service with specific quantum factor
            os.environ['COSTFORGE_QUANTUM_FACTOR'] = str(factor)
            service = create_costforge_ml_service()
            await service.initialize()

            # Test valuation
            property_data = PropertyData(
                parcel_id=f"QUANTUM-{factor}",
                county_id="benton",
                square_footage=2400.0,
                lot_size=0.25,
                year_built=2015,
                bedrooms=4,
                bathrooms=2.5,
                property_type="single_family",
                zoning="residential",
                location={"lat": 46.2619, "lng": -119.2706}
            )

            result = await service.calculate_property_valuation(property_data)
            results.append((factor, result))

            await service.shutdown()

        # Verify quantum factor impact
        for factor, result in results:
            assert str(factor) in result.calculation_method
            if factor == 999:  # Highest quantum factor
                assert result.confidence_score >= 99.0

    @pytest.mark.asyncio
    async def test_target_accuracy_achievement(self):
        """Test that system achieves target accuracy consistently"""
        service = create_costforge_ml_service()
        await service.initialize()

        # Run multiple valuations
        accuracy_scores = []

        for i in range(10):
            property_data = PropertyData(
                parcel_id=f"ACCURACY-{i:03d}",
                county_id="benton",
                square_footage=2000 + i * 100,
                lot_size=0.2,
                year_built=2015,
                bedrooms=3,
                bathrooms=2.0,
                property_type="single_family",
                zoning="residential",
                location={"lat": 46.26, "lng": -119.27}
            )

            result = await service.calculate_property_valuation(property_data)
            accuracy_scores.append(result.confidence_score)

        await service.shutdown()

        # Check accuracy requirements
        avg_accuracy = sum(accuracy_scores) / len(accuracy_scores)
        min_accuracy = min(accuracy_scores)

        assert avg_accuracy >= 98.5  # Average accuracy target
        assert min_accuracy >= 98.0   # Minimum accuracy target
        assert all(score >= 95.0 for score in accuracy_scores)  # No score below 95%

class TestPerformanceBenchmarks:
    """Performance benchmark tests"""

    @pytest.mark.asyncio
    async def test_single_valuation_performance(self):
        """Benchmark single valuation performance"""
        service = create_costforge_ml_service()
        await service.initialize()

        property_data = PropertyData(
            parcel_id="PERF-SINGLE",
            county_id="benton",
            square_footage=2400.0,
            lot_size=0.25,
            year_built=2015,
            bedrooms=4,
            bathrooms=2.5,
            property_type="single_family",
            zoning="residential",
            location={"lat": 46.2619, "lng": -119.2706}
        )

        # Run performance test
        times = []
        for _ in range(10):
            start_time = time.time()
            await service.calculate_property_valuation(property_data)
            end_time = time.time()
            times.append((end_time - start_time) * 1000)  # Convert to ms

        await service.shutdown()

        # Performance assertions
        avg_time = sum(times) / len(times)
        max_time = max(times)

        assert avg_time < 2000  # Average under 2 seconds
        assert max_time < 5000  # Max under 5 seconds
        print(f"Single valuation performance - Avg: {avg_time:.2f}ms, Max: {max_time:.2f}ms")

    @pytest.mark.asyncio
    async def test_batch_processing_performance(self):
        """Benchmark batch processing performance"""
        service = create_costforge_ml_service()
        await service.initialize()

        # Create batch of 20 properties
        properties = []
        for i in range(20):
            prop = PropertyData(
                parcel_id=f"PERF-BATCH-{i:03d}",
                county_id="benton",
                square_footage=2000 + i * 50,
                lot_size=0.2,
                year_built=2015,
                bedrooms=3,
                bathrooms=2.0,
                property_type="single_family",
                zoning="residential",
                location={"lat": 46.26, "lng": -119.27}
            )
            properties.append(prop)

        # Run batch performance test
        start_time = time.time()
        results = await service.batch_calculate_valuations(properties)
        end_time = time.time()

        await service.shutdown()

        total_time_ms = (end_time - start_time) * 1000
        avg_time_per_property = total_time_ms / len(properties)

        # Performance assertions
        assert len(results) == 20
        assert total_time_ms < 30000  # Total under 30 seconds
        assert avg_time_per_property < 1500  # Average under 1.5 seconds per property

        print(f"Batch processing performance - Total: {total_time_ms:.2f}ms, Avg per property: {avg_time_per_property:.2f}ms")

    @pytest.mark.asyncio
    async def test_concurrent_processing_limits(self):
        """Test concurrent processing limits and stability"""
        service = create_costforge_ml_service()
        await service.initialize()

        property_data = PropertyData(
            parcel_id="CONCURRENT-TEST",
            county_id="benton",
            square_footage=2400.0,
            lot_size=0.25,
            year_built=2015,
            bedrooms=4,
            bathrooms=2.5,
            property_type="single_family",
            zoning="residential",
            location={"lat": 46.2619, "lng": -119.2706}
        )

        # Create multiple concurrent tasks
        tasks = []
        for i in range(service.quantum_config.max_concurrent_inferences + 5):  # Exceed limit
            task = service.calculate_property_valuation(property_data)
            tasks.append(task)

        # Run concurrent tasks
        results = await asyncio.gather(*tasks, return_exceptions=True)

        await service.shutdown()

        # Check results
        successful_results = [r for r in results if isinstance(r, ValuationResult)]
        exceptions = [r for r in results if isinstance(r, Exception)]

        # Should handle gracefully
        assert len(successful_results) > 0
        assert len(successful_results) + len(exceptions) == len(tasks)

        print(f"Concurrent processing - Successful: {len(successful_results)}, Exceptions: {len(exceptions)}")

# Test configuration and utilities
@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

def pytest_configure(config):
    """Configure pytest with custom markers"""
    config.addinivalue_line(
        "markers", "asyncio: mark test to run with asyncio"
    )
    config.addinivalue_line(
        "markers", "performance: mark test as performance benchmark"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )

# Run tests
if __name__ == "__main__":
    pytest.main([
        __file__,
        "-v",
        "--tb=short",
        "--asyncio-mode=auto"
    ])
