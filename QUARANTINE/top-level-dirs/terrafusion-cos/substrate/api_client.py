"""
Substrate API Client
HTTP client for vendor integrations with TerraFusion cOS platform
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

import aiohttp

from . import VendorCredentials

logger = logging.getLogger(__name__)


class SubstrateAPIClient:
    """
    HTTP API client for TerraFusion cOS substrate platform

    Provides simplified interface for vendor integrations to access
    cOS platform services via REST API.
    """

    def __init__(self, base_url: str, vendor_credentials: VendorCredentials):
        self.base_url = base_url.rstrip('/')
        self.vendor_credentials = vendor_credentials
        self.session: Optional[aiohttp.ClientSession] = None
        self.access_token: Optional[str] = None

        logger.info(f"[API Client] Initializing for {vendor_credentials.vendor_name}")

    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create HTTP session"""
        if self.session is None or self.session.closed:
            headers = {
                "User-Agent": f"TerraFusion-Substrate-SDK/1.0 ({self.vendor_credentials.vendor_name})",
                "Content-Type": "application/json"
            }

            if self.access_token:
                headers["Authorization"] = f"Bearer {self.access_token}"

            self.session = aiohttp.ClientSession(
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=30)
            )

        return self.session

    async def authenticate(
        self,
        vendor_type: str,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Authenticate vendor with cOS platform

        Args:
            vendor_type: Type of vendor (harris_pacs, tyler_tech, etc.)
            **kwargs: Additional vendor-specific parameters

        Returns:
            dict: Authentication result with access token
        """
        try:
            session = await self._get_session()

            auth_data = {
                "vendor_id": self.vendor_credentials.vendor_id,
                "vendor_name": self.vendor_credentials.vendor_name,
                "license_key": self.vendor_credentials.license_key,
                "api_secret": self.vendor_credentials.api_secret,
                "tier": self.vendor_credentials.tier,
                "vendor_type": vendor_type,
                "timestamp": datetime.utcnow().isoformat(),
                **kwargs
            }

            async with session.post(
                f"{self.base_url}/api/substrate/authenticate",
                json=auth_data
            ) as response:
                result = await response.json()

                if response.status == 200 and result.get("success"):
                    self.access_token = result.get("access_token")
                    logger.info("[API Client] ✅ Authentication successful")
                    return result
                else:
                    logger.error(f"[API Client] ❌ Authentication failed: {result}")
                    return result

        except Exception as e:
            logger.error(f"[API Client] ❌ Authentication error: {e}")
            return {"success": False, "error": str(e)}

    async def sync_data(
        self,
        data_type: str,
        jurisdiction: str,
        data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Sync data with TerraFusion platform

        Args:
            data_type: Type of data (properties, permits, etc.)
            jurisdiction: County jurisdiction code
            data: Data to synchronize

        Returns:
            dict: Sync operation result
        """
        try:
            if not self.access_token:
                raise RuntimeError("Not authenticated - call authenticate() first")

            session = await self._get_session()

            sync_payload = {
                "data_type": data_type,
                "jurisdiction": jurisdiction,
                "vendor_id": self.vendor_credentials.vendor_id,
                "data": data,
                "timestamp": datetime.utcnow().isoformat(),
                "batch_size": len(data)
            }

            async with session.post(
                f"{self.base_url}/api/sync/replicate",
                json=sync_payload
            ) as response:
                result = await response.json()

                if response.status == 200:
                    logger.info(f"[API Client] ✅ Synced {len(data)} {data_type} records")
                    return result
                else:
                    logger.error(f"[API Client] ❌ Sync failed: {result}")
                    return {"success": False, "error": result}

        except Exception as e:
            logger.error(f"[API Client] ❌ Sync error: {e}")
            return {"success": False, "error": str(e)}

    async def ai_enhance_assessment(
        self,
        property_data: Dict[str, Any],
        enhancement_type: str = "valuation"
    ) -> Dict[str, Any]:
        """
        Use AI swarm to enhance property assessment

        Args:
            property_data: Property data for enhancement
            enhancement_type: Type of AI enhancement

        Returns:
            dict: AI enhancement results
        """
        try:
            if not self.access_token:
                raise RuntimeError("Not authenticated")

            session = await self._get_session()

            enhancement_request = {
                "property_data": property_data,
                "enhancement_type": enhancement_type,
                "vendor_id": self.vendor_credentials.vendor_id,
                "timestamp": datetime.utcnow().isoformat()
            }

            async with session.post(
                f"{self.base_url}/api/ai-swarm/enhance-assessment",
                json=enhancement_request
            ) as response:
                result = await response.json()

                if response.status == 200:
                    logger.info("[API Client] ✅ AI enhancement complete")
                    return result
                else:
                    logger.error(f"[API Client] ❌ AI enhancement failed: {result}")
                    return {"success": False, "error": result}

        except Exception as e:
            logger.error(f"[API Client] ❌ AI enhancement error: {e}")
            return {"success": False, "error": str(e)}

    async def create_workflow(
        self,
        workflow_name: str,
        steps: List[Dict[str, Any]],
        jurisdiction: str
    ) -> Dict[str, Any]:
        """
        Create workflow in TerraFlow

        Args:
            workflow_name: Name of the workflow
            steps: Workflow step definitions
            jurisdiction: County jurisdiction

        Returns:
            dict: Workflow creation result
        """
        try:
            if not self.access_token:
                raise RuntimeError("Not authenticated")

            session = await self._get_session()

            workflow_data = {
                "name": workflow_name,
                "steps": steps,
                "jurisdiction": jurisdiction,
                "vendor_id": self.vendor_credentials.vendor_id,
                "created_by": self.vendor_credentials.vendor_name,
                "timestamp": datetime.utcnow().isoformat()
            }

            async with session.post(
                f"{self.base_url}/api/flow/create-workflow",
                json=workflow_data
            ) as response:
                result = await response.json()

                if response.status == 200:
                    logger.info(f"[API Client] ✅ Workflow created: {workflow_name}")
                    return result
                else:
                    logger.error(f"[API Client] ❌ Workflow creation failed: {result}")
                    return {"success": False, "error": result}

        except Exception as e:
            logger.error(f"[API Client] ❌ Workflow creation error: {e}")
            return {"success": False, "error": str(e)}

    async def get_system_status(self) -> Dict[str, Any]:
        """
        Get cOS platform system status

        Returns:
            dict: Platform status information
        """
        try:
            session = await self._get_session()

            async with session.get(
                f"{self.base_url}/api/cos/status"
            ) as response:
                result = await response.json()

                if response.status == 200:
                    return result
                else:
                    logger.error("[API Client] ❌ Status check failed")
                    return {"success": False, "error": "Status check failed"}

        except Exception as e:
            logger.error(f"[API Client] ❌ Status check error: {e}")
            return {"success": False, "error": str(e)}

    async def shutdown(self):
        """Close HTTP session"""
        if self.session and not self.session.closed:
            await self.session.close()
            logger.info("[API Client] ✅ Session closed")
