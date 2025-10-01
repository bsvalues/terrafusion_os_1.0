#!/usr/bin/env python3
"""
Direct OS Core Component Test
Test the OS Core validation with operational services
"""

import sys
import asyncio
sys.path.append('/workspaces/terrafusion_os_1.0')

from validators.os_core_validation import TerraFusionOSValidation

async def test_os_core():
    """Test OS Core validation directly"""
    print("🔍 Testing OS Core Component Validation")
    print("=" * 50)
    
    validator = TerraFusionOSValidation()
    
    # Test each layer
    layers = [
        (1, "Kernel Module Loading System"),
        (2, "Process Management Validation"), 
        (3, "Memory Allocation Testing"),
        (4, "Port Allocation & Binding"),
        (5, "Service Discovery Mechanism"),
        (6, "API Gateway Functionality"),
        (7, "Database Layer Integration"),
        (8, "Security Enforcement Engine"),
        (9, "Monitoring Stack Validation"),
        (10, "Backup & Recovery System"),
        (11, "Module Integration Points")
    ]
    
    passed = 0
    failed = 0
    
    for layer_num, description in layers:
        try:
            method_name = f"validate_layer_{layer_num}"
            if hasattr(validator, method_name):
                method = getattr(validator, method_name)
                success, message = await method()
                
                status = "✅ PASSED" if success else "❌ FAILED"
                print(f"Layer {layer_num:2d}: {description}")
                print(f"         {status} - {message}")
                
                if success:
                    passed += 1
                else:
                    failed += 1
            else:
                print(f"Layer {layer_num:2d}: {description}")
                print(f"         ❌ FAILED - Method {method_name} not found")
                failed += 1
                
        except Exception as e:
            print(f"Layer {layer_num:2d}: {description}")
            print(f"         ❌ FAILED - Exception: {e}")
            failed += 1
    
    print("\n" + "=" * 50)
    print(f"📊 OS CORE VALIDATION RESULTS:")
    print(f"✅ Layers Passed: {passed}")
    print(f"❌ Layers Failed: {failed}")
    print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
    
    if passed >= 8:  # 8/11 = 72.7% success
        print("🎉 OS CORE IS SUBSTANTIALLY OPERATIONAL!")
    elif passed >= 6:  # 6/11 = 54.5% success  
        print("⚠️  OS CORE IS PARTIALLY OPERATIONAL")
    else:
        print("🚨 OS CORE NEEDS MORE WORK")

if __name__ == "__main__":
    asyncio.run(test_os_core())
