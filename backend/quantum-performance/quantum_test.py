#!/usr/bin/env python3
"""
TerraFusion Quantum Computing Test Script
Simple validation of quantum computing capabilities
"""

import sys
import os
import time
import json
from datetime import datetime

# Add the ai directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ai'))

try:
    import qiskit
    from qiskit import QuantumCircuit
    from qiskit_aer import Aer
    from qiskit_algorithms import VQE, QAOA
    from qiskit_algorithms.optimizers import SPSA
    from qiskit.circuit.library import TwoLocal
    from qiskit.quantum_info import SparsePauliOp
    from qiskit.primitives import Sampler
    from qiskit_optimization import QuadraticProgram
    from qiskit_optimization.algorithms import MinimumEigenOptimizer
    print("✅ Qiskit imported successfully")
except ImportError as e:
    print(f"❌ Qiskit import failed: {e}")
    sys.exit(1)

def test_basic_quantum_circuit():
    """Test basic quantum circuit creation and execution"""
    print("\n🔬 Testing Basic Quantum Circuit...")
    
    try:
        # Create a simple quantum circuit
        qc = QuantumCircuit(2, 2)
        qc.h(0)  # Hadamard gate on qubit 0
        qc.cx(0, 1)  # CNOT gate
        qc.measure([0, 1], [0, 1])
        
        # Execute on simulator
        backend = Aer.get_backend('qasm_simulator')
        job = backend.run(qc, shots=1000)
        result = job.result()
        counts = result.get_counts(qc)
        
        print(f"✅ Basic circuit executed successfully")
        print(f"   Results: {counts}")
        return True
        
    except Exception as e:
        print(f"❌ Basic circuit failed: {e}")
        return False

def test_vqe_algorithm():
    """Test Variational Quantum Eigensolver"""
    print("\n🧮 Testing VQE Algorithm...")
    
    try:
        # Create a simple Hamiltonian
        hamiltonian = SparsePauliOp.from_list([
            ("II", 0.1),
            ("ZZ", 0.3),
            ("XX", 0.5),
        ])
        
        # Create ansatz
        ansatz = TwoLocal(2, "ry", "cz", reps=1)
        
        # Create VQE instance
        optimizer = SPSA(maxiter=10)
        sampler = Sampler()
        vqe = VQE(sampler, ansatz, optimizer)
        
        # Solve
        result = vqe.solve(hamiltonian)
        
        print(f"✅ VQE executed successfully")
        print(f"   Ground state energy: {result.eigenvalue:.4f}")
        return True
        
    except Exception as e:
        print(f"❌ VQE failed: {e}")
        return False

def test_qaoa_algorithm():
    """Test Quantum Approximate Optimization Algorithm"""
    print("\n🎯 Testing QAOA Algorithm...")
    
    try:
        # Create a simple optimization problem
        qp = QuadraticProgram()
        qp.binary_var('x')
        qp.binary_var('y')
        qp.minimize(linear={'x': 1, 'y': 1}, quadratic={('x', 'y'): 2})
        
        # Create QAOA instance
        qaoa = QAOA(sampler=Sampler(), optimizer=SPSA(maxiter=10))
        optimizer = MinimumEigenOptimizer(qaoa)
        
        # Solve
        result = optimizer.solve(qp)
        
        print(f"✅ QAOA executed successfully")
        print(f"   Optimal value: {result.fval}")
        print(f"   Solution: {result.x}")
        return True
        
    except Exception as e:
        print(f"❌ QAOA failed: {e}")
        return False

def test_property_valuation_simulation():
    """Simulate quantum-enhanced property valuation"""
    print("\n🏠 Testing Quantum Property Valuation Simulation...")
    
    try:
        # Simulate property factors as quantum states
        property_factors = {
            'location_score': 0.8,
            'square_footage': 2000,
            'age': 15,
            'market_conditions': 0.7
        }
        
        # Create quantum circuit for property valuation
        qc = QuantumCircuit(4, 4)
        
        # Encode property factors as quantum states
        for i, (factor, value) in enumerate(property_factors.items()):
            # Normalize value to [0, 1] and encode as rotation
            normalized_value = min(max(value / 100, 0), 1)
            qc.ry(normalized_value * 3.14159, i)
        
        # Apply quantum correlations
        qc.cx(0, 1)  # Location affects square footage value
        qc.cx(2, 3)  # Age affects market conditions
        
        # Measure
        qc.measure_all()
        
        # Execute
        backend = Aer.get_backend('qasm_simulator')
        job = backend.run(qc, shots=1000)
        result = job.result()
        counts = result.get_counts(qc)
        
        # Calculate estimated value
        total_shots = sum(counts.values())
        estimated_value = 0
        
        for state, count in counts.items():
            # Convert binary state to decimal and use as value factor
            state_value = int(state, 2)
            probability = count / total_shots
            estimated_value += state_value * probability * 100000  # Scale to realistic property value
        
        print(f"✅ Quantum property valuation completed")
        print(f"   Estimated value: ${estimated_value:,.0f}")
        print(f"   Quantum state distribution: {counts}")
        return True
        
    except Exception as e:
        print(f"❌ Quantum property valuation failed: {e}")
        return False

def main():
    """Run all quantum computing tests"""
    print("🚀 TerraFusion Quantum Computing Test Suite")
    print("=" * 50)
    print(f"Timestamp: {datetime.now().isoformat()}")
    print(f"Qiskit Version: {qiskit.__version__}")
    
    tests = [
        ("Basic Quantum Circuit", test_basic_quantum_circuit),
        ("VQE Algorithm", test_vqe_algorithm),
        ("QAOA Algorithm", test_qaoa_algorithm),
        ("Property Valuation Simulation", test_property_valuation_simulation),
    ]
    
    results = {}
    start_time = time.time()
    
    for test_name, test_func in tests:
        try:
            success = test_func()
            results[test_name] = success
        except Exception as e:
            print(f"❌ {test_name} crashed: {e}")
            results[test_name] = False
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 QUANTUM COMPUTING TEST RESULTS")
    print("=" * 50)
    
    passed = sum(results.values())
    total = len(results)
    
    for test_name, success in results.items():
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    print(f"Execution time: {time.time() - start_time:.2f} seconds")
    
    if passed == total:
        print("\n🎉 ALL QUANTUM TESTS PASSED!")
        print("🚀 TerraFusion quantum computing capabilities are operational!")
    else:
        print(f"\n⚠️ {total - passed} tests failed - quantum capabilities need attention")
    
    # Save results
    test_report = {
        "timestamp": datetime.now().isoformat(),
        "qiskit_version": qiskit.__version__,
        "results": results,
        "summary": {
            "passed": passed,
            "total": total,
            "execution_time": time.time() - start_time
        }
    }
    
    with open("quantum_test_report.json", "w") as f:
        json.dump(test_report, f, indent=2)
    
    print(f"\n📄 Test report saved to: quantum_test_report.json")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 