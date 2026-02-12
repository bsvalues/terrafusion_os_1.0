"""
Test Performance Monitor API Endpoints
Tests all 4 Performance Monitor endpoints with proper error handling
"""

import asyncio
from datetime import datetime

import aiohttp

BASE_URL = "http://localhost:8090"

async def test_performance_status():
    """Test GET /api/performance/status endpoint"""
    print("\n🧪 Testing Performance Monitor Status Endpoint...")
    print("=" * 70)

    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(f"{BASE_URL}/api/performance/status") as response:
                print(f"✅ Status Code: {response.status}")

                if response.status == 200:
                    data = await response.json()
                    print("\n📊 Performance Monitor Status:")
                    print(f"  Performance Level: {data.get('performance_level', 'N/A')}")
                    print(f"  Uptime: {data.get('uptime_percentage', 0):.3f}%")
                    print(f"  P50 Latency: {data.get('p50_latency_ms', 0):.2f}ms")
                    print(f"  P95 Latency: {data.get('p95_latency_ms', 0):.2f}ms")
                    print(f"  P99 Latency: {data.get('p99_latency_ms', 0):.2f}ms")
                    print(f"  Error Rate: {data.get('error_rate', 0):.3f}%")
                    print(f"  Active Alerts: {data.get('active_alert_count', 0)}")

                    # Service stats
                    service_stats = data.get('service_stats', {})
                    print("\n📈 Service Statistics:")
                    for service, stats in service_stats.items():
                        print(f"  {service}: {stats.get('operation_count', 0)} ops")

                    return True
                else:
                    print(f"❌ Error: {response.status}")
                    return False

        except Exception as e:
            print(f"❌ Exception: {e}")
            return False


async def test_performance_level():
    """Test GET /api/performance/level endpoint"""
    print("\n🧪 Testing Performance Level Endpoint...")
    print("=" * 70)

    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(f"{BASE_URL}/api/performance/level") as response:
                print(f"✅ Status Code: {response.status}")

                if response.status == 200:
                    data = await response.json()
                    print("\n🏆 Performance Level Classification:")
                    print(f"  Level: {data.get('level', 'N/A')}")
                    print(f"  Target: {data.get('target', 'N/A')}")
                    print(f"  Meets Championship: {data.get('meets_championship_target', False)}")

                    return True
                else:
                    print(f"❌ Error: {response.status}")
                    return False

        except Exception as e:
            print(f"❌ Exception: {e}")
            return False


async def test_performance_alerts():
    """Test GET /api/performance/alerts endpoint"""
    print("\n🧪 Testing Performance Alerts Endpoint...")
    print("=" * 70)

    async with aiohttp.ClientSession() as session:
        try:
            # Test with no filters
            async with session.get(f"{BASE_URL}/api/performance/alerts") as response:
                print(f"✅ Status Code: {response.status}")

                if response.status == 200:
                    data = await response.json()
                    alerts = data.get('alerts', [])

                    print(f"\n🚨 Active Alerts: {len(alerts)}")

                    if alerts:
                        for i, alert in enumerate(alerts[:5], 1):
                            print(f"\n  Alert {i}:")
                            print(f"    Service: {alert.get('service', 'N/A')}")
                            print(f"    Severity: {alert.get('severity', 'N/A')}")
                            print(f"    Message: {alert.get('message', 'N/A')}")
                            print(f"    Metric: {alert.get('metric_name', 'N/A')} = {alert.get('current_value', 'N/A')}")
                    else:
                        print("  No active alerts - System running optimally! ✅")

                    return True
                else:
                    print(f"❌ Error: {response.status}")
                    return False

        except Exception as e:
            print(f"❌ Exception: {e}")
            return False


async def test_record_metric():
    """Test POST /api/performance/record endpoint"""
    print("\n🧪 Testing Record Metric Endpoint...")
    print("=" * 70)

    async with aiohttp.ClientSession() as session:
        try:
            # Test recording a successful operation
            metric_data = {
                "service": "test_service",
                "operation": "test_operation",
                "duration_ms": 5.5,
                "success": True
            }

            async with session.post(
                f"{BASE_URL}/api/performance/record",
                json=metric_data
            ) as response:
                print(f"✅ Status Code: {response.status}")

                if response.status == 200:
                    data = await response.json()
                    print("\n✅ Metric Recorded Successfully")
                    print(f"  Service: {metric_data['service']}")
                    print(f"  Operation: {metric_data['operation']}")
                    print(f"  Duration: {metric_data['duration_ms']}ms")
                    print(f"  Success: {metric_data['success']}")

                    return True
                else:
                    print(f"❌ Error: {response.status}")
                    error_text = await response.text()
                    print(f"  Response: {error_text}")
                    return False

        except Exception as e:
            print(f"❌ Exception: {e}")
            return False


async def run_all_tests():
    """Run all Performance Monitor endpoint tests"""
    print("\n" + "=" * 70)
    print("🏆 TerraFusion cOS - Performance Monitor API Tests")
    print("=" * 70)
    print(f"Testing API at: {BASE_URL}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Wait for server to be ready
    print("\n⏳ Waiting for API server to be ready...")
    await asyncio.sleep(2)

    # Run all tests
    results = []

    results.append(("Performance Status", await test_performance_status()))
    results.append(("Performance Level", await test_performance_level()))
    results.append(("Performance Alerts", await test_performance_alerts()))
    results.append(("Record Metric", await test_record_metric()))

    # Summary
    print("\n" + "=" * 70)
    print("📊 Test Results Summary")
    print("=" * 70)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"  {test_name}: {status}")

    print("\n" + "=" * 70)
    print(f"🏆 Championship Testing Complete: {passed}/{total} tests passed")
    print("=" * 70)

    if passed == total:
        print("\n✅ ALL TESTS PASSED - Performance Monitor is OPERATIONAL!")
    else:
        print(f"\n⚠️ {total - passed} test(s) failed - Review errors above")


if __name__ == "__main__":
    asyncio.run(run_all_tests())
    asyncio.run(run_all_tests())
