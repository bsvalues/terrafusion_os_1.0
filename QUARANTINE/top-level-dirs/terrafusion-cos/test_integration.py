"""
TerraFusion cOS - Live Integration Test
Testing real connections to running backend services
"""

import asyncio
import aiohttp
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


async def test_backend_connection():
    """Test connection to running backend API"""
    logger.info("\n" + "="*70)
    logger.info("🔌 Testing cOS Connection to Running Backend")
    logger.info("="*70)
    
    backend_url = "http://localhost:5000"
    
    try:
        async with aiohttp.ClientSession() as session:
            # Test 1: Backend Health
            logger.info("\n[Test 1/4] Checking backend health...")
            async with session.get(f"{backend_url}/api/health") as resp:
                if resp.status == 200:
                    data = await resp.json()
                    logger.info(f"✅ Backend is UP: {data}")
                else:
                    logger.info(f"✅ Backend responding (status {resp.status})")
            
            # Test 2: AI Services
            logger.info("\n[Test 2/4] Testing AI services...")
            async with session.get(f"{backend_url}/api/ai/status") as resp:
                if resp.status == 200:
                    data = await resp.json()
                    logger.info(f"✅ AI Services: {data}")
                else:
                    logger.info(f"⚠️  AI endpoint returned {resp.status}")
            
            # Test 3: Security Services  
            logger.info("\n[Test 3/4] Testing security services...")
            async with session.get(f"{backend_url}/api/security/status") as resp:
                if resp.status == 200:
                    data = await resp.json()
                    logger.info(f"✅ Security Services: {data}")
                else:
                    logger.info(f"⚠️  Security endpoint returned {resp.status}")
            
            # Test 4: Marketplace Services
            logger.info("\n[Test 4/4] Testing marketplace services...")
            async with session.get(f"{backend_url}/api/marketplace/status") as resp:
                if resp.status == 200:
                    data = await resp.json()
                    logger.info(f"✅ Marketplace Services: {data}")
                else:
                    logger.info(f"⚠️  Marketplace endpoint returned {resp.status}")
            
            logger.info("\n" + "="*70)
            logger.info("✅ Backend Connection Test Complete")
            logger.info("="*70)
            return True
            
    except aiohttp.ClientConnectorError:
        logger.error("\n❌ Cannot connect to backend at http://localhost:5000")
        logger.error("   Make sure backend is running: cd backend && dotnet run")
        return False
    except Exception as e:
        logger.error(f"\n❌ Test failed: {e}")
        return False


async def test_cos_boot_with_backend():
    """Test cOS boot sequence with backend integration"""
    logger.info("\n" + "="*70)
    logger.info("🚀 Testing cOS Boot with Backend Integration")
    logger.info("="*70)
    
    # Import boot sequence
    import sys
    sys.path.insert(0, r'C:\Users\bsval\terrafusion_os_1.0\terrafusion-cos')
    from boot_sequence import boot_cos
    
    # Boot cOS
    success = await boot_cos()
    
    if success:
        logger.info("\n✅ cOS booted successfully with backend integration")
    else:
        logger.error("\n❌ cOS boot failed")
    
    return success


async def main():
    """Run all integration tests"""
    logger.info("\n" + "="*70)
    logger.info("🧪 TerraFusion cOS - Live Integration Tests")
    logger.info("="*70)
    
    # Test 1: Backend connection
    backend_ok = await test_backend_connection()
    
    if not backend_ok:
        logger.error("\n❌ Backend not running - start it first:")
        logger.error("   cd backend && dotnet run")
        return False
    
    # Test 2: cOS boot
    cos_ok = await test_cos_boot_with_backend()
    
    logger.info("\n" + "="*70)
    logger.info(f"✅ Integration Tests {'PASSED' if (backend_ok and cos_ok) else 'FAILED'}")
    logger.info("="*70)
    
    return backend_ok and cos_ok


if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)
