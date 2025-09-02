#!/usr/bin/env python3
"""
Cross-Version Integration Agent
"""

import asyncio
import json
from v1v2_integration_bot import V1V2IntegrationBot
from v2v3_integration_bot import V2V3IntegrationBot
from fullstack_bot import FullStackBot

class CrossVersionIntegrationAgent:
    def __init__(self):
        self.v1v2_bot = V1V2IntegrationBot()
        self.v2v3_bot = V2V3IntegrationBot()
        self.fullstack_bot = FullStackBot()
        
    async def run_integration_tests(self):
        """Run all cross-version integration tests"""
        results = {}
        
        # Run V1V2 integration tests
        results['v1_v2_integration'] = await self.v1v2_bot.test_v1_v2_integration()
        
        # Run V2V3 integration tests
        results['v2_v3_integration'] = await self.v2v3_bot.test_v2_v3_integration()
        
        # Run full stack tests
        results['fullstack_integration'] = await self.fullstack_bot.test_fullstack_workflow()
        
        return results

if __name__ == "__main__":
    agent = CrossVersionIntegrationAgent()
    results = asyncio.run(agent.run_integration_tests())
    print(json.dumps(results, indent=2))
