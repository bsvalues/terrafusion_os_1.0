#!/usr/bin/env python3
"""
Performance Test Suite for Trust Fabric
Tests cryptographic performance and security benchmarks
"""

import time
import logging
import statistics
import concurrent.futures
from pathlib import Path
from typing import Dict, List, Any

# Import Trust Fabric components
import sys
sys.path.append(str(Path(__file__).parent))
from hsm_interface import HSMInterface
from tmp_bridge import TMPBridge
from crypto_engine import PostQuantumCryptoEngine


class TrustFabricPerformanceTest:
    """Performance testing suite for Trust Fabric components"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.results = {}
        
        # Initialize components
        self.hsm = HSMInterface()
        self.tmp_bridge = TMPBridge()
        self.crypto_engine = PostQuantumCryptoEngine()
        
    def setup(self) -> bool:
        """Setup test environment"""
        try:
            self.logger.info("Setting up Trust Fabric performance test environment...")
            
            # Initialize all components
            if not self.hsm.initialize():
                self.logger.error("HSM initialization failed")
                return False
                
            if not self.tmp_bridge.connect():
                self.logger.error("TMP Bridge connection failed")
                return False
                
            if not self.crypto_engine.initialize():
                self.logger.error("Crypto Engine initialization failed")
                return False
                
            self.logger.info("Test environment setup complete")
            return True
            
        except Exception as e:
            self.logger.error(f"Setup failed: {e}")
            return False
    
    def benchmark_hsm_operations(self, iterations: int = 1000) -> Dict[str, float]:
        """Benchmark HSM operations"""
        self.logger.info(f"Benchmarking HSM operations ({iterations} iterations)...")
        
        # Key generation benchmark
        key_gen_times = []
        for _ in range(min(100, iterations)):  # Limit key generation to 100
            start = time.perf_counter()
            key = self.hsm.generate_key("AES256")
            end = time.perf_counter()
            if key:
                key_gen_times.append((end - start) * 1000)  # Convert to ms
        
        # Encryption benchmark
        test_key = self.hsm.generate_key("AES256")
        test_data = b"TerraFusion OS performance test data" * 10  # 360 bytes
        
        encrypt_times = []
        for _ in range(iterations):
            start = time.perf_counter()
            encrypted = self.hsm.encrypt_data(test_data, test_key)
            end = time.perf_counter()
            if encrypted:
                encrypt_times.append((end - start) * 1000)
        
        # Decryption benchmark
        encrypted_data = self.hsm.encrypt_data(test_data, test_key)
        decrypt_times = []
        for _ in range(iterations):
            start = time.perf_counter()
            decrypted = self.hsm.decrypt_data(encrypted_data, test_key)
            end = time.perf_counter()
            if decrypted:
                decrypt_times.append((end - start) * 1000)
        
        return {
            "key_generation_avg_ms": statistics.mean(key_gen_times) if key_gen_times else 0,
            "key_generation_std_ms": statistics.stdev(key_gen_times) if len(key_gen_times) > 1 else 0,
            "encryption_avg_ms": statistics.mean(encrypt_times) if encrypt_times else 0,
            "encryption_std_ms": statistics.stdev(encrypt_times) if len(encrypt_times) > 1 else 0,
            "decryption_avg_ms": statistics.mean(decrypt_times) if decrypt_times else 0,
            "decryption_std_ms": statistics.stdev(decrypt_times) if len(decrypt_times) > 1 else 0,
            "throughput_mb_per_sec": (len(test_data) * iterations / 1024 / 1024) / (sum(encrypt_times) / 1000) if encrypt_times else 0
        }
    
    def benchmark_tmp_operations(self, iterations: int = 100) -> Dict[str, float]:
        """Benchmark TMP Bridge operations"""
        self.logger.info(f"Benchmarking TMP operations ({iterations} iterations)...")
        
        # PCR reading benchmark
        pcr_times = []
        for _ in range(iterations):
            start = time.perf_counter()
            pcrs = self.tmp_bridge.get_platform_configuration_registers()
            end = time.perf_counter()
            if pcrs:
                pcr_times.append((end - start) * 1000)
        
        # Attestation quote benchmark
        quote_times = []
        for _ in range(min(50, iterations)):  # Limit attestation quotes
            start = time.perf_counter()
            quote = self.tmp_bridge.generate_attestation_quote()
            end = time.perf_counter()
            if quote:
                quote_times.append((end - start) * 1000)
        
        # Seal/Unseal benchmark
        test_data = b"TerraFusion sealed data test"
        seal_times = []
        unseal_times = []
        
        for _ in range(iterations):
            start = time.perf_counter()
            sealed = self.tmp_bridge.seal_data(test_data)
            end = time.perf_counter()
            if sealed:
                seal_times.append((end - start) * 1000)
                
                start = time.perf_counter()
                unsealed = self.tmp_bridge.unseal_data(sealed)
                end = time.perf_counter()
                if unsealed:
                    unseal_times.append((end - start) * 1000)
        
        return {
            "pcr_read_avg_ms": statistics.mean(pcr_times) if pcr_times else 0,
            "pcr_read_std_ms": statistics.stdev(pcr_times) if len(pcr_times) > 1 else 0,
            "attestation_avg_ms": statistics.mean(quote_times) if quote_times else 0,
            "attestation_std_ms": statistics.stdev(quote_times) if len(quote_times) > 1 else 0,
            "seal_avg_ms": statistics.mean(seal_times) if seal_times else 0,
            "seal_std_ms": statistics.stdev(seal_times) if len(seal_times) > 1 else 0,
            "unseal_avg_ms": statistics.mean(unseal_times) if unseal_times else 0,
            "unseal_std_ms": statistics.stdev(unseal_times) if len(unseal_times) > 1 else 0
        }
    
    def benchmark_crypto_engine(self, iterations: int = 100) -> Dict[str, Dict[str, float]]:
        """Benchmark Post-Quantum Crypto Engine"""
        self.logger.info(f"Benchmarking Crypto Engine ({iterations} iterations)...")
        
        return self.crypto_engine.benchmark_algorithms()
    
    def stress_test_concurrent_operations(self, duration_seconds: int = 30) -> Dict[str, Any]:
        """Stress test with concurrent operations"""
        self.logger.info(f"Running stress test for {duration_seconds} seconds...")
        
        start_time = time.time()
        operation_counts = {
            "hsm_encrypt": 0,
            "tmp_seal": 0,
            "crypto_sign": 0,
            "errors": 0
        }
        
        def hsm_worker():
            test_key = self.hsm.generate_key("AES256")
            test_data = b"Stress test data"
            while time.time() - start_time < duration_seconds:
                try:
                    encrypted = self.hsm.encrypt_data(test_data, test_key)
                    if encrypted:
                        operation_counts["hsm_encrypt"] += 1
                    else:
                        operation_counts["errors"] += 1
                except:
                    operation_counts["errors"] += 1
        
        def tmp_worker():
            test_data = b"TMP stress test data"
            while time.time() - start_time < duration_seconds:
                try:
                    sealed = self.tmp_bridge.seal_data(test_data)
                    if sealed:
                        operation_counts["tmp_seal"] += 1
                    else:
                        operation_counts["errors"] += 1
                except:
                    operation_counts["errors"] += 1
        
        def crypto_worker():
            pub_key, priv_key = self.crypto_engine.generate_dilithium_keypair()
            test_message = b"Crypto stress test message"
            while time.time() - start_time < duration_seconds:
                try:
                    signature = self.crypto_engine.dilithium_sign(priv_key, test_message)
                    if signature:
                        operation_counts["crypto_sign"] += 1
                    else:
                        operation_counts["errors"] += 1
                except:
                    operation_counts["errors"] += 1
        
        # Run concurrent workers
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
            futures = []
            # Start 2 workers for each component
            for _ in range(2):
                futures.append(executor.submit(hsm_worker))
                futures.append(executor.submit(tmp_worker))
                futures.append(executor.submit(crypto_worker))
            
            # Wait for completion
            concurrent.futures.wait(futures)
        
        actual_duration = time.time() - start_time
        total_operations = sum(operation_counts.values()) - operation_counts["errors"]
        
        return {
            "duration_seconds": actual_duration,
            "total_operations": total_operations,
            "operations_per_second": total_operations / actual_duration if actual_duration > 0 else 0,
            "error_rate": operation_counts["errors"] / (total_operations + operation_counts["errors"]) if total_operations > 0 else 0,
            "operation_breakdown": operation_counts
        }
    
    def run_comprehensive_test(self) -> Dict[str, Any]:
        """Run comprehensive performance test suite"""
        self.logger.info("Starting comprehensive Trust Fabric performance test...")
        
        if not self.setup():
            return {"error": "Setup failed"}
        
        results = {
            "test_timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "test_duration_seconds": 0
        }
        
        test_start = time.time()
        
        try:
            # HSM benchmarks
            self.logger.info("Running HSM benchmarks...")
            results["hsm_performance"] = self.benchmark_hsm_operations(1000)
            
            # TMP benchmarks
            self.logger.info("Running TMP benchmarks...")
            results["tmp_performance"] = self.benchmark_tmp_operations(100)
            
            # Crypto engine benchmarks
            self.logger.info("Running Crypto Engine benchmarks...")
            results["crypto_performance"] = self.benchmark_crypto_engine(100)
            
            # Stress test
            self.logger.info("Running stress test...")
            results["stress_test"] = self.stress_test_concurrent_operations(30)
            
            results["test_duration_seconds"] = time.time() - test_start
            results["status"] = "PASSED"
            
            self.logger.info("Comprehensive performance test completed successfully")
            
        except Exception as e:
            results["error"] = str(e)
            results["status"] = "FAILED"
            self.logger.error(f"Performance test failed: {e}")
        
        return results
    
    def generate_performance_report(self, results: Dict[str, Any]) -> str:
        """Generate human-readable performance report"""
        if "error" in results:
            return f"❌ Performance Test Failed: {results['error']}"
        
        report = []
        report.append("🚀 TerraFusion Trust Fabric Performance Report")
        report.append("=" * 50)
        report.append(f"Test Timestamp: {results['test_timestamp']}")
        report.append(f"Total Test Duration: {results['test_duration_seconds']:.2f} seconds")
        report.append(f"Overall Status: {results['status']}")
        report.append("")
        
        # HSM Performance
        if "hsm_performance" in results:
            hsm = results["hsm_performance"]
            report.append("🔒 HSM Performance:")
            report.append(f"  Key Generation: {hsm['key_generation_avg_ms']:.2f}ms (±{hsm['key_generation_std_ms']:.2f}ms)")
            report.append(f"  Encryption: {hsm['encryption_avg_ms']:.3f}ms (±{hsm['encryption_std_ms']:.3f}ms)")
            report.append(f"  Decryption: {hsm['decryption_avg_ms']:.3f}ms (±{hsm['decryption_std_ms']:.3f}ms)")
            report.append(f"  Throughput: {hsm['throughput_mb_per_sec']:.2f} MB/s")
            report.append("")
        
        # TMP Performance
        if "tmp_performance" in results:
            tmp = results["tmp_performance"]
            report.append("🛡️ TMP Performance:")
            report.append(f"  PCR Read: {tmp['pcr_read_avg_ms']:.2f}ms (±{tmp['pcr_read_std_ms']:.2f}ms)")
            report.append(f"  Attestation: {tmp['attestation_avg_ms']:.2f}ms (±{tmp['attestation_std_ms']:.2f}ms)")
            report.append(f"  Seal Operation: {tmp['seal_avg_ms']:.2f}ms (±{tmp['seal_std_ms']:.2f}ms)")
            report.append(f"  Unseal Operation: {tmp['unseal_avg_ms']:.2f}ms (±{tmp['unseal_std_ms']:.2f}ms)")
            report.append("")
        
        # Crypto Performance
        if "crypto_performance" in results:
            crypto = results["crypto_performance"]
            report.append("🔐 Post-Quantum Crypto Performance:")
            for alg, metrics in crypto.items():
                report.append(f"  {alg.upper()}:")
                for metric, value in metrics.items():
                    report.append(f"    {metric}: {value:.2f}")
            report.append("")
        
        # Stress Test
        if "stress_test" in results:
            stress = results["stress_test"]
            report.append("⚡ Stress Test Results:")
            report.append(f"  Duration: {stress['duration_seconds']:.1f} seconds")
            report.append(f"  Total Operations: {stress['total_operations']:,}")
            report.append(f"  Operations/Second: {stress['operations_per_second']:.1f}")
            report.append(f"  Error Rate: {stress['error_rate']:.2%}")
            report.append("  Operation Breakdown:")
            for op, count in stress['operation_breakdown'].items():
                report.append(f"    {op}: {count:,}")
            report.append("")
        
        return "\n".join(report)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    
    test_suite = TrustFabricPerformanceTest()
    results = test_suite.run_comprehensive_test()
    
    print(test_suite.generate_performance_report(results))
    
    # Save results to file
    import json
    with open("/workspaces/terrafusion_os_1.0/trust-fabric/performance_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print("\n💾 Performance results saved to performance_results.json")
