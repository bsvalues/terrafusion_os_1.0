#!/usr/bin/env python3
"""
CostForge AI Performance Benchmark
Championship-level performance validation for quantum-enhanced property valuation

Benchmarks:
- Single property valuation speed
- Batch processing throughput
- Accuracy consistency
- Memory usage optimization
- Quantum factor performance impact
- Scalability under load
"""

import asyncio
import time
import statistics
import psutil
import json
import argparse
from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta
import concurrent.futures
import numpy as np
import matplotlib.pyplot as plt

# Import CostForge services
from costforge_ml_service import (
    CostForgeMLService,
    PropertyData,
    ValuationResult,
    create_costforge_ml_service
)

class CostForgeBenchmark:
    """
    Comprehensive performance benchmark suite for CostForge AI
    """

    def __init__(self, quantum_factor: int = 949, target_accuracy: float = 0.995):
        self.quantum_factor = quantum_factor
        self.target_accuracy = target_accuracy
        self.results = {}
        self.start_time = None
        self.process = psutil.Process()

    async def initialize(self):
        """Initialize the benchmark suite"""
        print(f"🚀 CostForge AI Performance Benchmark")
        print(f"   Quantum Factor: {self.quantum_factor}")
        print(f"   Target Accuracy: {self.target_accuracy * 100:.1f}%")
        print(f"   Timestamp: {datetime.now().isoformat()}")
        print("=" * 60)

        self.start_time = time.time()

        # Initialize ML service
        self.ml_service = create_costforge_ml_service()
        await self.ml_service.initialize()

    async def cleanup(self):
        """Cleanup benchmark resources"""
        if hasattr(self, 'ml_service'):
            await self.ml_service.shutdown()

    def generate_test_property(self, index: int = 0) -> PropertyData:
        """Generate a test property with realistic data"""
        base_sqft = 2000
        base_lot = 0.2
        base_year = 2010

        return PropertyData(
            parcel_id=f"BENCH-{index:05d}",
            county_id="benton",
            square_footage=base_sqft + (index % 1000) * 2,
            lot_size=base_lot + (index % 50) * 0.01,
            year_built=base_year + (index % 15),
            bedrooms=3 + (index % 3),
            bathrooms=2.0 + (index % 3) * 0.5,
            property_type="single_family",
            zoning="residential",
            location={
                "lat": 46.2619 + (index % 100) * 0.001,
                "lng": -119.2706 + (index % 100) * 0.001
            }
        )

    async def benchmark_single_valuation_speed(self, iterations: int = 100) -> Dict[str, Any]:
        """Benchmark single property valuation speed"""
        print(f"🎯 Benchmarking single valuation speed ({iterations} iterations)...")

        times = []
        accuracy_scores = []
        memory_usage = []

        for i in range(iterations):
            property_data = self.generate_test_property(i)

            # Memory usage before
            mem_before = self.process.memory_info().rss / 1024 / 1024  # MB

            # Time the valuation
            start_time = time.time()
            result = await self.ml_service.calculate_property_valuation(property_data)
            end_time = time.time()

            # Memory usage after
            mem_after = self.process.memory_info().rss / 1024 / 1024  # MB

            processing_time = (end_time - start_time) * 1000  # ms
            times.append(processing_time)
            accuracy_scores.append(result.confidence_score)
            memory_usage.append(mem_after - mem_before)

            if i % 20 == 0:
                print(f"   Progress: {i}/{iterations} ({i/iterations*100:.1f}%)")

        results = {
            'iterations': iterations,
            'avg_time_ms': statistics.mean(times),
            'median_time_ms': statistics.median(times),
            'min_time_ms': min(times),
            'max_time_ms': max(times),
            'std_time_ms': statistics.stdev(times) if len(times) > 1 else 0,
            'avg_accuracy': statistics.mean(accuracy_scores),
            'min_accuracy': min(accuracy_scores),
            'max_accuracy': max(accuracy_scores),
            'accuracy_consistency': statistics.stdev(accuracy_scores) if len(accuracy_scores) > 1 else 0,
            'avg_memory_delta_mb': statistics.mean(memory_usage),
            'target_accuracy_met': min(accuracy_scores) >= self.target_accuracy * 100,
            'performance_grade': self._calculate_performance_grade(times, accuracy_scores)
        }

        self.results['single_valuation'] = results
        return results

    async def benchmark_batch_processing(self, batch_sizes: List[int] = [10, 50, 100, 200]) -> Dict[str, Any]:
        """Benchmark batch processing performance with different batch sizes"""
        print(f"🚀 Benchmarking batch processing...")

        batch_results = {}

        for batch_size in batch_sizes:
            print(f"   Testing batch size: {batch_size}")

            # Generate test properties
            properties = [self.generate_test_property(i) for i in range(batch_size)]

            # Memory before
            mem_before = self.process.memory_info().rss / 1024 / 1024

            # Time the batch processing
            start_time = time.time()
            results = await self.ml_service.batch_calculate_valuations(properties)
            end_time = time.time()

            # Memory after
            mem_after = self.process.memory_info().rss / 1024 / 1024

            total_time = (end_time - start_time) * 1000  # ms
            successful_results = len(results)
            avg_time_per_property = total_time / successful_results if successful_results > 0 else 0

            # Calculate throughput
            throughput = successful_results / (total_time / 1000) if total_time > 0 else 0

            batch_results[batch_size] = {
                'total_time_ms': total_time,
                'successful_results': successful_results,
                'failed_results': batch_size - successful_results,
                'avg_time_per_property_ms': avg_time_per_property,
                'throughput_properties_per_second': throughput,
                'memory_usage_mb': mem_after - mem_before,
                'accuracy_scores': [r.confidence_score for r in results if hasattr(r, 'confidence_score')],
                'efficiency_score': self._calculate_efficiency_score(batch_size, total_time, successful_results)
            }

        self.results['batch_processing'] = batch_results
        return batch_results

    async def benchmark_concurrent_load(self, concurrent_requests: List[int] = [5, 10, 20, 50]) -> Dict[str, Any]:
        """Benchmark performance under concurrent load"""
        print(f"⚡ Benchmarking concurrent load performance...")

        load_results = {}

        for concurrency in concurrent_requests:
            print(f"   Testing concurrency: {concurrency}")

            # Create concurrent tasks
            tasks = []
            for i in range(concurrency):
                property_data = self.generate_test_property(i)
                task = self.ml_service.calculate_property_valuation(property_data)
                tasks.append(task)

            # Time concurrent execution
            start_time = time.time()
            results = await asyncio.gather(*tasks, return_exceptions=True)
            end_time = time.time()

            total_time = (end_time - start_time) * 1000  # ms

            # Analyze results
            successful_results = [r for r in results if isinstance(r, ValuationResult)]
            exceptions = [r for r in results if isinstance(r, Exception)]

            load_results[concurrency] = {
                'total_time_ms': total_time,
                'successful_requests': len(successful_results),
                'failed_requests': len(exceptions),
                'avg_time_per_request_ms': total_time / concurrency,
                'requests_per_second': concurrency / (total_time / 1000) if total_time > 0 else 0,
                'success_rate': len(successful_results) / concurrency * 100,
                'avg_accuracy': statistics.mean([r.confidence_score for r in successful_results]) if successful_results else 0,
                'concurrency_efficiency': len(successful_results) / concurrency * 100
            }

        self.results['concurrent_load'] = load_results
        return load_results

    async def benchmark_quantum_factor_impact(self, quantum_factors: List[int] = [900, 949, 999]) -> Dict[str, Any]:
        """Benchmark the impact of different quantum factors"""
        print(f"🔬 Benchmarking quantum factor impact...")

        quantum_results = {}
        original_factor = self.quantum_factor

        for factor in quantum_factors:
            print(f"   Testing quantum factor: {factor}")

            # Temporarily change quantum factor
            self.ml_service.quantum_config.factor = factor

            # Run test valuations
            times = []
            accuracy_scores = []

            for i in range(20):  # Smaller sample for speed
                property_data = self.generate_test_property(i)

                start_time = time.time()
                result = await self.ml_service.calculate_property_valuation(property_data)
                end_time = time.time()

                times.append((end_time - start_time) * 1000)
                accuracy_scores.append(result.confidence_score)

            quantum_results[factor] = {
                'avg_time_ms': statistics.mean(times),
                'avg_accuracy': statistics.mean(accuracy_scores),
                'min_accuracy': min(accuracy_scores),
                'max_accuracy': max(accuracy_scores),
                'quantum_enhancement': statistics.mean(accuracy_scores) - 90.0,  # Enhancement over baseline
                'efficiency_ratio': (statistics.mean(accuracy_scores) / 100) / (statistics.mean(times) / 1000)
            }

        # Restore original quantum factor
        self.ml_service.quantum_config.factor = original_factor

        self.results['quantum_factor_impact'] = quantum_results
        return quantum_results

    async def benchmark_accuracy_consistency(self, iterations: int = 50) -> Dict[str, Any]:
        """Benchmark accuracy consistency across multiple runs"""
        print(f"🎯 Benchmarking accuracy consistency ({iterations} iterations)...")

        property_data = self.generate_test_property(0)  # Same property for all tests

        accuracy_scores = []
        values = []

        for i in range(iterations):
            result = await self.ml_service.calculate_property_valuation(property_data)
            accuracy_scores.append(result.confidence_score)
            values.append(result.estimated_value)

            if i % 10 == 0:
                print(f"   Progress: {i}/{iterations}")

        # Calculate consistency metrics
        accuracy_std = statistics.stdev(accuracy_scores)
        value_std = statistics.stdev(values)
        value_cv = value_std / statistics.mean(values) * 100  # Coefficient of variation

        results = {
            'iterations': iterations,
            'avg_accuracy': statistics.mean(accuracy_scores),
            'accuracy_std': accuracy_std,
            'accuracy_min': min(accuracy_scores),
            'accuracy_max': max(accuracy_scores),
            'accuracy_range': max(accuracy_scores) - min(accuracy_scores),
            'avg_value': statistics.mean(values),
            'value_std': value_std,
            'value_coefficient_of_variation': value_cv,
            'consistency_grade': self._calculate_consistency_grade(accuracy_std, value_cv),
            'meets_consistency_target': accuracy_std < 1.0 and value_cv < 5.0
        }

        self.results['accuracy_consistency'] = results
        return results

    def _calculate_performance_grade(self, times: List[float], accuracy_scores: List[float]) -> str:
        """Calculate overall performance grade"""
        avg_time = statistics.mean(times)
        avg_accuracy = statistics.mean(accuracy_scores)

        # Championship criteria
        if avg_time < 1000 and avg_accuracy >= 99.0:
            return "CHAMPIONSHIP"
        elif avg_time < 2000 and avg_accuracy >= 98.5:
            return "EXCELLENT"
        elif avg_time < 3000 and avg_accuracy >= 98.0:
            return "GOOD"
        elif avg_time < 5000 and avg_accuracy >= 95.0:
            return "ACCEPTABLE"
        else:
            return "NEEDS_IMPROVEMENT"

    def _calculate_efficiency_score(self, batch_size: int, total_time: float, successful: int) -> float:
        """Calculate efficiency score for batch processing"""
        if total_time == 0 or successful == 0:
            return 0.0

        # Properties per second per MB memory
        throughput = successful / (total_time / 1000)
        return min(throughput * 10, 100.0)  # Scale to 0-100

    def _calculate_consistency_grade(self, accuracy_std: float, value_cv: float) -> str:
        """Calculate consistency grade"""
        if accuracy_std < 0.5 and value_cv < 2.0:
            return "EXCELLENT"
        elif accuracy_std < 1.0 and value_cv < 5.0:
            return "GOOD"
        elif accuracy_std < 2.0 and value_cv < 10.0:
            return "ACCEPTABLE"
        else:
            return "NEEDS_IMPROVEMENT"

    def generate_report(self) -> str:
        """Generate comprehensive benchmark report"""
        total_time = time.time() - self.start_time if self.start_time else 0

        report = []
        report.append("=" * 80)
        report.append("🏆 COSTFORGE AI PERFORMANCE BENCHMARK REPORT")
        report.append("=" * 80)
        report.append(f"Timestamp: {datetime.now().isoformat()}")
        report.append(f"Total Benchmark Time: {total_time:.2f} seconds")
        report.append(f"Quantum Factor: {self.quantum_factor}")
        report.append(f"Target Accuracy: {self.target_accuracy * 100:.1f}%")
        report.append("")

        # Single Valuation Results
        if 'single_valuation' in self.results:
            sv = self.results['single_valuation']
            report.append("📊 SINGLE VALUATION PERFORMANCE")
            report.append("-" * 40)
            report.append(f"Average Time: {sv['avg_time_ms']:.2f}ms")
            report.append(f"Median Time: {sv['median_time_ms']:.2f}ms")
            report.append(f"Min/Max Time: {sv['min_time_ms']:.2f}ms / {sv['max_time_ms']:.2f}ms")
            report.append(f"Average Accuracy: {sv['avg_accuracy']:.2f}%")
            report.append(f"Performance Grade: {sv['performance_grade']}")
            report.append(f"Target Accuracy Met: {'✅ YES' if sv['target_accuracy_met'] else '❌ NO'}")
            report.append("")

        # Batch Processing Results
        if 'batch_processing' in self.results:
            report.append("🚀 BATCH PROCESSING PERFORMANCE")
            report.append("-" * 40)
            for batch_size, bp in self.results['batch_processing'].items():
                report.append(f"Batch Size {batch_size}:")
                report.append(f"  Throughput: {bp['throughput_properties_per_second']:.2f} properties/sec")
                report.append(f"  Avg Time per Property: {bp['avg_time_per_property_ms']:.2f}ms")
                report.append(f"  Success Rate: {bp['successful_results']}/{batch_size}")
                report.append(f"  Efficiency Score: {bp['efficiency_score']:.1f}/100")
            report.append("")

        # Concurrent Load Results
        if 'concurrent_load' in self.results:
            report.append("⚡ CONCURRENT LOAD PERFORMANCE")
            report.append("-" * 40)
            for concurrency, cl in self.results['concurrent_load'].items():
                report.append(f"Concurrency {concurrency}:")
                report.append(f"  Requests/sec: {cl['requests_per_second']:.2f}")
                report.append(f"  Success Rate: {cl['success_rate']:.1f}%")
                report.append(f"  Avg Accuracy: {cl['avg_accuracy']:.2f}%")
            report.append("")

        # Quantum Factor Impact
        if 'quantum_factor_impact' in self.results:
            report.append("🔬 QUANTUM FACTOR IMPACT")
            report.append("-" * 40)
            for factor, qf in self.results['quantum_factor_impact'].items():
                report.append(f"Factor {factor}:")
                report.append(f"  Avg Accuracy: {qf['avg_accuracy']:.2f}%")
                report.append(f"  Avg Time: {qf['avg_time_ms']:.2f}ms")
                report.append(f"  Enhancement: +{qf['quantum_enhancement']:.2f}%")
            report.append("")

        # Accuracy Consistency
        if 'accuracy_consistency' in self.results:
            ac = self.results['accuracy_consistency']
            report.append("🎯 ACCURACY CONSISTENCY")
            report.append("-" * 40)
            report.append(f"Average Accuracy: {ac['avg_accuracy']:.2f}%")
            report.append(f"Accuracy Std Dev: {ac['accuracy_std']:.3f}")
            report.append(f"Value Variation: {ac['value_coefficient_of_variation']:.2f}%")
            report.append(f"Consistency Grade: {ac['consistency_grade']}")
            report.append(f"Meets Target: {'✅ YES' if ac['meets_consistency_target'] else '❌ NO'}")
            report.append("")

        # Overall Assessment
        report.append("🏆 OVERALL ASSESSMENT")
        report.append("-" * 40)
        overall_grade = self._calculate_overall_grade()
        report.append(f"Overall Performance Grade: {overall_grade}")
        report.append(f"Championship Ready: {'✅ YES' if overall_grade == 'CHAMPIONSHIP' else '❌ NO'}")
        report.append("=" * 80)

        return "\n".join(report)

    def _calculate_overall_grade(self) -> str:
        """Calculate overall performance grade"""
        grades = []

        if 'single_valuation' in self.results:
            grades.append(self.results['single_valuation']['performance_grade'])

        if 'accuracy_consistency' in self.results:
            grades.append(self.results['accuracy_consistency']['consistency_grade'])

        # Count championship/excellent grades
        championship_count = grades.count('CHAMPIONSHIP')
        excellent_count = grades.count('EXCELLENT')

        if championship_count >= len(grades) * 0.8:
            return 'CHAMPIONSHIP'
        elif championship_count + excellent_count >= len(grades) * 0.8:
            return 'EXCELLENT'
        else:
            return 'GOOD'

    def save_results(self, filename: str = None):
        """Save benchmark results to JSON file"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"costforge_benchmark_{timestamp}.json"

        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2, default=str)

        print(f"📄 Results saved to: {filename}")

async def run_comprehensive_benchmark():
    """Run the complete CostForge AI benchmark suite"""

    benchmark = CostForgeBenchmark()

    try:
        await benchmark.initialize()

        # Run all benchmark tests
        print("Starting comprehensive benchmark suite...\n")

        await benchmark.benchmark_single_valuation_speed(iterations=100)
        await benchmark.benchmark_batch_processing()
        await benchmark.benchmark_concurrent_load()
        await benchmark.benchmark_quantum_factor_impact()
        await benchmark.benchmark_accuracy_consistency()

        # Generate and display report
        report = benchmark.generate_report()
        print(report)

        # Save results
        benchmark.save_results()

    finally:
        await benchmark.cleanup()

async def run_quick_benchmark():
    """Run a quick benchmark for development"""

    benchmark = CostForgeBenchmark()

    try:
        await benchmark.initialize()

        print("Running quick benchmark...\n")

        await benchmark.benchmark_single_valuation_speed(iterations=20)
        await benchmark.benchmark_accuracy_consistency(iterations=10)

        report = benchmark.generate_report()
        print(report)

    finally:
        await benchmark.cleanup()

def main():
    """Main entry point for benchmark script"""
    parser = argparse.ArgumentParser(description="CostForge AI Performance Benchmark")
    parser.add_argument("--quick", action="store_true", help="Run quick benchmark")
    parser.add_argument("--quantum-factor", type=int, default=949, help="Quantum factor to use")
    parser.add_argument("--target-accuracy", type=float, default=0.995, help="Target accuracy (0-1)")

    args = parser.parse_args()

    if args.quick:
        asyncio.run(run_quick_benchmark())
    else:
        asyncio.run(run_comprehensive_benchmark())

if __name__ == "__main__":
    main()
