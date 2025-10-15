#!/usr/bin/env python3
"""
🚨 BENTON COUNTY AI CAPABILITIES TEST SUITE
Verify all AI systems are operational and performing correctly
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime
from typing import Dict, List
import sys

# ANSI color codes
RED = '\033[91m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
PURPLE = '\033[95m'
NC = '\033[0m'  # No Color

# Configuration
OLLAMA_HOST = "http://ollama-service.benton-county-prod:11434"
WEAVIATE_HOST = "http://weaviate.benton-county-prod:8080"
MCP_HOST = "http://mcp-server.benton-county-prod:8090"
AGENT_HOST = "http://ai-agent-swarm.benton-county-prod:8095"

class BentonAITester:
    def __init__(self):
        self.results = {
            "ollama": {"status": "pending", "tests": []},
            "rag": {"status": "pending", "tests": []},
            "mcp": {"status": "pending", "tests": []},
            "agents": {"status": "pending", "tests": []}
        }
        
    async def test_ollama_inference(self) -> bool:
        """Test Ollama LLM inference capabilities"""
        print(f"\n{BLUE}{'='*60}{NC}")
        print(f"{BLUE}TESTING OLLAMA LLM INFERENCE{NC}")
        print(f"{BLUE}{'='*60}{NC}")
        
        test_prompts = [
            {
                "name": "Property Valuation",
                "prompt": "What factors should I consider when assessing a vineyard property in Red Mountain AVA?",
                "model": "llama3.1:70b"
            },
            {
                "name": "Tax Code Query",
                "prompt": "Explain Washington State property tax exemptions for senior citizens.",
                "model": "mistral"
            },
            {
                "name": "Code Analysis",
                "prompt": "Write a SQL query to find all properties with assessments over $1M in Benton County.",
                "model": "codellama:34b"
            }
        ]
        
        all_passed = True
        
        for test in test_prompts:
            print(f"\n{YELLOW}Testing: {test['name']}{NC}")
            start_time = time.time()
            
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        f"{OLLAMA_HOST}/api/generate",
                        json={
                            "model": test["model"],
                            "prompt": test["prompt"],
                            "stream": False
                        }
                    ) as response:
                        if response.status == 200:
                            result = await response.json()
                            inference_time = time.time() - start_time
                            
                            print(f"{GREEN}✓ Success{NC} - Model: {test['model']} - Time: {inference_time:.2f}s")
                            print(f"Response preview: {result['response'][:100]}...")
                            
                            self.results["ollama"]["tests"].append({
                                "test": test["name"],
                                "status": "passed",
                                "time": inference_time,
                                "model": test["model"]
                            })
                        else:
                            print(f"{RED}✗ Failed{NC} - Status: {response.status}")
                            all_passed = False
                            
            except Exception as e:
                print(f"{RED}✗ Error: {str(e)}{NC}")
                all_passed = False
        
        self.results["ollama"]["status"] = "passed" if all_passed else "failed"
        return all_passed
    
    async def test_rag_system(self) -> bool:
        """Test RAG document retrieval and search"""
        print(f"\n{BLUE}{'='*60}{NC}")
        print(f"{BLUE}TESTING RAG SYSTEM (WEAVIATE){NC}")
        print(f"{BLUE}{'='*60}{NC}")
        
        # Create test schema
        schema = {
            "class": "BentonProperty",
            "properties": [
                {"name": "parcelNumber", "dataType": ["string"]},
                {"name": "address", "dataType": ["string"]},
                {"name": "assessedValue", "dataType": ["number"]},
                {"name": "propertyType", "dataType": ["string"]},
                {"name": "description", "dataType": ["text"]}
            ]
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                # Create schema
                async with session.post(
                    f"{WEAVIATE_HOST}/v1/schema",
                    json=schema
                ) as response:
                    print(f"Schema creation: {'✓' if response.status in [200, 422] else '✗'}")
                
                # Test document ingestion
                test_property = {
                    "class": "BentonProperty",
                    "properties": {
                        "parcelNumber": "123456",
                        "address": "1000 Red Mountain Road",
                        "assessedValue": 2500000,
                        "propertyType": "Vineyard",
                        "description": "Premium vineyard in Red Mountain AVA with established Cabernet Sauvignon vines"
                    }
                }
                
                async with session.post(
                    f"{WEAVIATE_HOST}/v1/objects",
                    json=test_property
                ) as response:
                    if response.status == 200:
                        print(f"{GREEN}✓ Document ingestion successful{NC}")
                
                # Test vector search
                search_query = {
                    "nearText": {
                        "concepts": ["vineyard Red Mountain high value"]
                    },
                    "limit": 5
                }
                
                async with session.post(
                    f"{WEAVIATE_HOST}/v1/graphql",
                    json={
                        "query": """
                        {
                            Get {
                                BentonProperty(nearText: {concepts: ["vineyard Red Mountain"]}) {
                                    parcelNumber
                                    address
                                    assessedValue
                                }
                            }
                        }
                        """
                    }
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        print(f"{GREEN}✓ Vector search successful{NC}")
                        self.results["rag"]["status"] = "passed"
                        return True
                        
        except Exception as e:
            print(f"{RED}✗ RAG test error: {str(e)}{NC}")
            self.results["rag"]["status"] = "failed"
            return False
    
    async def test_mcp_servers(self) -> bool:
        """Test MCP server integrations"""
        print(f"\n{BLUE}{'='*60}{NC}")
        print(f"{BLUE}TESTING MCP SERVERS{NC}")
        print(f"{BLUE}{'='*60}{NC}")
        
        mcp_tests = [
            {
                "name": "Filesystem Server",
                "endpoint": "/mcp/filesystem/list",
                "data": {"path": "/data/benton/assessments"}
            },
            {
                "name": "Database Server",
                "endpoint": "/mcp/postgres/query",
                "data": {"query": "SELECT COUNT(*) FROM parcels"}
            },
            {
                "name": "Assessment Server",
                "endpoint": "/mcp/assessment/evaluate",
                "data": {"parcel_id": "123456"}
            }
        ]
        
        all_passed = True
        
        for test in mcp_tests:
            print(f"\n{YELLOW}Testing: {test['name']}{NC}")
            
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        f"{MCP_HOST}{test['endpoint']}",
                        json=test["data"]
                    ) as response:
                        if response.status == 200:
                            print(f"{GREEN}✓ {test['name']} operational{NC}")
                        else:
                            print(f"{RED}✗ {test['name']} failed - Status: {response.status}{NC}")
                            all_passed = False
                            
            except Exception as e:
                print(f"{RED}✗ Error: {str(e)}{NC}")
                all_passed = False
        
        self.results["mcp"]["status"] = "passed" if all_passed else "failed"
        return all_passed
    
    async def test_ai_agents(self) -> bool:
        """Test specialized AI agents"""
        print(f"\n{BLUE}{'='*60}{NC}")
        print(f"{BLUE}TESTING AI AGENTS{NC}")
        print(f"{BLUE}{'='*60}{NC}")
        
        agent_tests = [
            {
                "name": "Wine Country Valuation Agent",
                "endpoint": "/agent/wine-country/assess",
                "data": {
                    "parcel_id": "RMV-2024-001",
                    "acres": 25,
                    "varietals": ["Cabernet Sauvignon", "Merlot"],
                    "vine_age": 15,
                    "ava": "Red Mountain"
                }
            },
            {
                "name": "Hanford Compliance Bot",
                "endpoint": "/agent/hanford/compliance-check",
                "data": {
                    "parcel_id": "HNF-2024-001",
                    "location": "Section 10, T10N, R28E",
                    "agency": "DOE"
                }
            },
            {
                "name": "Assessment Intelligence Agent",
                "endpoint": "/agent/assessment/analyze",
                "data": {
                    "query": "Find all commercial properties in Kennewick with values over $5M"
                }
            }
        ]
        
        all_passed = True
        
        for test in agent_tests:
            print(f"\n{YELLOW}Testing: {test['name']}{NC}")
            
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        f"{AGENT_HOST}{test['endpoint']}",
                        json=test["data"],
                        timeout=aiohttp.ClientTimeout(total=30)
                    ) as response:
                        if response.status == 200:
                            result = await response.json()
                            print(f"{GREEN}✓ {test['name']} responded successfully{NC}")
                            print(f"  Result preview: {str(result)[:100]}...")
                        else:
                            print(f"{RED}✗ {test['name']} failed - Status: {response.status}{NC}")
                            all_passed = False
                            
            except Exception as e:
                print(f"{RED}✗ Error: {str(e)}{NC}")
                all_passed = False
        
        self.results["agents"]["status"] = "passed" if all_passed else "failed"
        return all_passed
    
    async def run_all_tests(self):
        """Run complete AI capability test suite"""
        print(f"{PURPLE}{'='*60}{NC}")
        print(f"{PURPLE}BENTON COUNTY AI CAPABILITIES TEST SUITE{NC}")
        print(f"{PURPLE}{'='*60}{NC}")
        print(f"Test Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Run all tests
        ollama_ok = await self.test_ollama_inference()
        rag_ok = await self.test_rag_system()
        mcp_ok = await self.test_mcp_servers()
        agents_ok = await self.test_ai_agents()
        
        # Generate report
        print(f"\n{PURPLE}{'='*60}{NC}")
        print(f"{PURPLE}TEST RESULTS SUMMARY{NC}")
        print(f"{PURPLE}{'='*60}{NC}")
        
        all_passed = all([ollama_ok, rag_ok, mcp_ok, agents_ok])
        
        components = [
            ("Ollama LLM Server", self.results["ollama"]["status"]),
            ("RAG System (Weaviate)", self.results["rag"]["status"]),
            ("MCP Servers", self.results["mcp"]["status"]),
            ("AI Agents", self.results["agents"]["status"])
        ]
        
        for name, status in components:
            symbol = "✓" if status == "passed" else "✗"
            color = GREEN if status == "passed" else RED
            print(f"{color}{symbol} {name}: {status.upper()}{NC}")
        
        print(f"\n{PURPLE}{'='*60}{NC}")
        
        if all_passed:
            print(f"{GREEN}🎉 ALL AI SYSTEMS OPERATIONAL! 🎉{NC}")
            print(f"{GREEN}Benton County has the most advanced AI-powered{NC}")
            print(f"{GREEN}assessment system in the nation!{NC}")
        else:
            print(f"{RED}⚠️  SOME SYSTEMS NEED ATTENTION ⚠️{NC}")
            print(f"{YELLOW}Please check the logs and retry deployment{NC}")
        
        # Save detailed report
        with open("ai-test-report.json", "w") as f:
            json.dump({
                "test_date": datetime.now().isoformat(),
                "overall_status": "passed" if all_passed else "failed",
                "results": self.results
            }, f, indent=2)
        
        print(f"\nDetailed report saved to: ai-test-report.json")
        
        return 0 if all_passed else 1

async def main():
    tester = BentonAITester()
    return await tester.run_all_tests()

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)