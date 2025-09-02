#!/usr/bin/env python3
"""
County Deployment Agent
"""

import asyncio
import json
from small_county_bot import SmallCountyBot
from medium_county_bot import MediumCountyBot
from large_county_bot import LargeCountyBot

class CountyDeploymentAgent:
    def __init__(self):
        self.small_county_bot = SmallCountyBot()
        self.medium_county_bot = MediumCountyBot()
        self.large_county_bot = LargeCountyBot()
        
    async def run_county_deployment_tests(self):
        """Run all county deployment tests"""
        results = {}
        
        # Test small county deployment
        results['small_county'] = await self.small_county_bot.test_small_county_deployment()
        
        # Test medium county deployment
        results['medium_county'] = await self.medium_county_bot.test_medium_county_deployment()
        
        # Test large county deployment
        results['large_county'] = await self.large_county_bot.test_large_county_deployment()
        
        return results

if __name__ == "__main__":
    agent = CountyDeploymentAgent()
    results = asyncio.run(agent.run_county_deployment_tests())
    print(json.dumps(results, indent=2))
