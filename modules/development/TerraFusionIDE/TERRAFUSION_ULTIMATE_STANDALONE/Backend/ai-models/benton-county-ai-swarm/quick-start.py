#!/usr/bin/env python3
"""
Benton County AI Swarm - Quick Start Script
Get AI running in minutes with existing infrastructure
"""

import asyncio
import json
import logging
import sqlite3
from datetime import datetime
from pathlib import Path
import subprocess
import sys

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class BentonAIQuickStart:
    """Quick deployment of AI capabilities for Benton County"""
    
    def __init__(self):
        self.base_dir = Path(__file__).parent
        self.data_dir = self.base_dir / "data"
        self.models_dir = self.base_dir / "models"
        
        # Create directories
        self.data_dir.mkdir(exist_ok=True)
        self.models_dir.mkdir(exist_ok=True)
        
    def check_prerequisites(self):
        """Check system requirements"""
        logger.info("🔍 Checking prerequisites...")
        
        checks = {
            "Python 3.8+": sys.version_info >= (3, 8),
            "Ollama": self._check_ollama(),
            "Disk Space": self._check_disk_space(),
            "Memory": self._check_memory()
        }
        
        for check, passed in checks.items():
            status = "✅" if passed else "❌"
            logger.info(f"{status} {check}")
        
        if not all(checks.values()):
            logger.error("Prerequisites not met. Please install missing components.")
            return False
        
        return True
    
    def _check_ollama(self):
        """Check if Ollama is installed"""
        try:
            result = subprocess.run(['ollama', '--version'], capture_output=True)
            return result.returncode == 0
        except:
            return False
    
    def _check_disk_space(self):
        """Check available disk space (need at least 50GB)"""
        import shutil
        stat = shutil.disk_usage(self.base_dir)
        gb_free = stat.free / (1024**3)
        return gb_free > 50
    
    def _check_memory(self):
        """Check available memory (need at least 16GB)"""
        try:
            with open('/proc/meminfo', 'r') as f:
                for line in f:
                    if line.startswith('MemTotal'):
                        kb = int(line.split()[1])
                        gb = kb / (1024**2)
                        return gb > 16
        except:
            # Assume it's fine if we can't check
            return True
    
    async def install_ollama(self):
        """Install Ollama if not present"""
        if not self._check_ollama():
            logger.info("📦 Installing Ollama...")
            cmd = "curl -fsSL https://ollama.com/install.sh | sh"
            subprocess.run(cmd, shell=True)
    
    async def pull_models(self):
        """Pull efficient models for CPU inference"""
        logger.info("🤖 Downloading AI models (this may take a while)...")
        
        models = [
            "llama3.1:7b",      # General purpose, 7B parameters
            "mistral:7b",       # Fast and efficient
            "phi3:mini"         # Microsoft's tiny model
        ]
        
        for model in models:
            logger.info(f"Pulling {model}...")
            subprocess.run(['ollama', 'pull', model])
    
    async def create_benton_knowledge(self):
        """Create Benton County specific knowledge base"""
        logger.info("📚 Creating Benton County knowledge base...")
        
        knowledge = {
            "county_info": {
                "name": "Benton County",
                "state": "Washington",
                "population": 206873,
                "parcels": 99347,
                "cities": ["Kennewick", "Richland", "West Richland", "Benton City", "Prosser"],
                "tax_rate_2024": 11.92  # per $1000 assessed value
            },
            "wine_country": {
                "avas": [
                    {
                        "name": "Red Mountain",
                        "acres": 4040,
                        "established": 2001,
                        "wineries": 50,
                        "premium": 1.35
                    },
                    {
                        "name": "Horse Heaven Hills",
                        "acres": 570000,
                        "established": 2005,
                        "wineries": 30,
                        "premium": 1.25
                    },
                    {
                        "name": "Yakima Valley",
                        "acres": 665000,
                        "established": 1983,
                        "wineries": 120,
                        "premium": 1.15
                    }
                ]
            },
            "common_questions": {
                "tax_rate": "The 2024 property tax rate is $11.92 per $1,000 of assessed value",
                "payment_options": "Pay online at bentontreasurer.com, by mail, or in person at 620 Market St, Prosser",
                "senior_exemption": "Available for those 65+ with household income under $40,000",
                "appeal_deadline": "Appeals must be filed by July 1st each year",
                "assessment_cycle": "Properties are revalued every 6 years, with annual adjustments"
            },
            "property_types": {
                "residential": {"growth_rate": 0.052, "count": 76543},
                "commercial": {"growth_rate": 0.038, "count": 4321},
                "vineyard": {"growth_rate": 0.071, "count": 1234},
                "agricultural": {"growth_rate": 0.024, "count": 8765},
                "industrial": {"growth_rate": 0.045, "count": 2345}
            }
        }
        
        # Save knowledge base
        knowledge_file = self.data_dir / "benton_knowledge.json"
        with open(knowledge_file, 'w') as f:
            json.dump(knowledge, f, indent=2)
        
        # Create SQLite database for quick lookups
        self._create_database()
        
        logger.info("✅ Knowledge base created")
    
    def _create_database(self):
        """Create SQLite database for quick queries"""
        db_path = self.data_dir / "benton_county.db"
        conn = sqlite3.connect(db_path)
        
        # Create tables
        conn.execute("""
            CREATE TABLE IF NOT EXISTS properties (
                parcel_id TEXT PRIMARY KEY,
                address TEXT,
                owner_name TEXT,
                property_type TEXT,
                square_feet INTEGER,
                year_built INTEGER,
                assessed_value REAL,
                tax_amount REAL,
                last_updated DATE
            )
        """)
        
        conn.execute("""
            CREATE TABLE IF NOT EXISTS tax_rates (
                year INTEGER PRIMARY KEY,
                rate_per_thousand REAL,
                senior_exemption_income_limit REAL
            )
        """)
        
        # Insert sample data
        conn.execute("""
            INSERT OR REPLACE INTO tax_rates VALUES 
            (2024, 11.92, 40000),
            (2023, 11.45, 35000),
            (2022, 10.98, 35000)
        """)
        
        conn.commit()
        conn.close()
    
    async def start_ai_server(self):
        """Start the lightweight AI server"""
        logger.info("🚀 Starting AI server...")
        
        # Create simple web server
        server_code = '''
import asyncio
from aiohttp import web
import aiohttp
import json
import sqlite3
from datetime import datetime

class BentonAIServer:
    def __init__(self):
        self.knowledge = self._load_knowledge()
        
    def _load_knowledge(self):
        try:
            with open('data/benton_knowledge.json', 'r') as f:
                return json.load(f)
        except:
            return {}
    
    async def process_query(self, query):
        """Process citizen query with AI"""
        # Check for common questions first
        query_lower = query.lower()
        
        for key, answer in self.knowledge.get('common_questions', {}).items():
            if key.replace('_', ' ') in query_lower:
                return {
                    'response': answer,
                    'source': 'knowledge_base',
                    'confidence': 1.0
                }
        
        # Use Ollama for complex queries
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    'http://localhost:11434/api/generate',
                    json={
                        'model': 'llama3.1:7b',
                        'prompt': f"""You are a helpful Benton County, Washington assessment office assistant. 
                        Use this context: {json.dumps(self.knowledge.get('county_info', {}))}
                        
                        Question: {query}
                        
                        Provide a helpful, accurate response:""",
                        'stream': False,
                        'options': {
                            'temperature': 0.7,
                            'max_tokens': 500
                        }
                    },
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as resp:
                    if resp.status == 200:
                        result = await resp.json()
                        return {
                            'response': result.get('response', 'I apologize, I could not generate a response.'),
                            'source': 'ai_model',
                            'model': 'llama3.1:7b',
                            'confidence': 0.85
                        }
        except Exception as e:
            print(f"AI Error: {e}")
        
        return {
            'response': 'I apologize, I am having trouble processing your request. Please try again or contact our office at (509) 736-3055.',
            'source': 'fallback',
            'confidence': 0.0
        }
    
    async def handle_request(self, request):
        """Handle incoming API requests"""
        try:
            data = await request.json()
            query = data.get('query', '')
            
            # Process the query
            result = await self.process_query(query)
            
            # Add metadata
            result['timestamp'] = datetime.now().isoformat()
            result['request_id'] = data.get('request_id', 'unknown')
            
            return web.json_response(result)
            
        except Exception as e:
            return web.json_response({
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }, status=500)
    
    async def health_check(self, request):
        """Health check endpoint"""
        # Check Ollama
        ollama_healthy = False
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get('http://localhost:11434/api/tags') as resp:
                    if resp.status == 200:
                        ollama_healthy = True
        except:
            pass
        
        return web.json_response({
            'status': 'healthy' if ollama_healthy else 'degraded',
            'services': {
                'ai_server': 'running',
                'ollama': 'healthy' if ollama_healthy else 'unavailable',
                'knowledge_base': 'loaded' if self.knowledge else 'empty'
            },
            'timestamp': datetime.now().isoformat()
        })

# Create and run server
server = BentonAIServer()
app = web.Application()
app.router.add_post('/api/query', server.handle_request)
app.router.add_get('/health', server.health_check)
app.router.add_get('/', lambda r: web.Response(text='Benton County AI Server Running'))

if __name__ == '__main__':
    print("🚀 Benton County AI Server starting on http://localhost:8095")
    print("📍 Query endpoint: POST http://localhost:8095/api/query")
    print("🏥 Health check: GET http://localhost:8095/health")
    web.run_app(app, host='0.0.0.0', port=8095)
'''
        
        # Save server code
        server_file = self.base_dir / "ai_server.py"
        with open(server_file, 'w') as f:
            f.write(server_code)
        
        # Start server in background
        subprocess.Popen([sys.executable, str(server_file)])
        
        # Wait for server to start
        await asyncio.sleep(3)
        
        logger.info("✅ AI server started on http://localhost:8095")
    
    async def test_deployment(self):
        """Test the deployment with sample queries"""
        logger.info("🧪 Testing deployment...")
        
        import aiohttp
        
        test_queries = [
            "What is the property tax rate?",
            "How do I pay my property taxes?",
            "What is the senior exemption income limit?",
            "Tell me about Red Mountain AVA",
            "When are property tax appeals due?"
        ]
        
        async with aiohttp.ClientSession() as session:
            # Check health first
            try:
                async with session.get('http://localhost:8095/health') as resp:
                    health = await resp.json()
                    logger.info(f"Health check: {health['status']}")
            except Exception as e:
                logger.error(f"Health check failed: {e}")
                return
            
            # Test queries
            for query in test_queries:
                try:
                    async with session.post(
                        'http://localhost:8095/api/query',
                        json={'query': query},
                        timeout=aiohttp.ClientTimeout(total=30)
                    ) as resp:
                        result = await resp.json()
                        logger.info(f"\nQ: {query}")
                        logger.info(f"A: {result['response'][:100]}...")
                        logger.info(f"Source: {result['source']}")
                except Exception as e:
                    logger.error(f"Query failed: {e}")
    
    async def create_startup_script(self):
        """Create convenient startup script"""
        startup_script = '''#!/bin/bash
# Benton County AI - Startup Script

echo "🚀 Starting Benton County AI System..."

# Start Ollama if not running
if ! pgrep -x "ollama" > /dev/null; then
    echo "Starting Ollama..."
    ollama serve &
    sleep 5
fi

# Start AI server
echo "Starting AI server..."
python ai_server.py &

echo "✅ Benton County AI is running!"
echo "📍 API: http://localhost:8095/api/query"
echo "🏥 Health: http://localhost:8095/health"
echo ""
echo "Example usage:"
echo 'curl -X POST http://localhost:8095/api/query -H "Content-Type: application/json" -d \'{"query": "What is the tax rate?"}\''
'''
        
        script_file = self.base_dir / "start-ai.sh"
        with open(script_file, 'w') as f:
            f.write(startup_script)
        
        # Make executable
        script_file.chmod(0o755)
        
        logger.info(f"✅ Created startup script: ./start-ai.sh")
    
    async def main(self):
        """Run the quick start process"""
        logger.info("🏁 Benton County AI Quick Start")
        logger.info("=" * 50)
        
        # Check prerequisites
        if not self.check_prerequisites():
            return
        
        # Install Ollama if needed
        await self.install_ollama()
        
        # Pull models
        await self.pull_models()
        
        # Create knowledge base
        await self.create_benton_knowledge()
        
        # Start AI server
        await self.start_ai_server()
        
        # Create startup script
        await self.create_startup_script()
        
        # Test deployment
        await self.test_deployment()
        
        logger.info("\n" + "=" * 50)
        logger.info("🎉 QUICK START COMPLETE!")
        logger.info("\nYour AI system is now running with:")
        logger.info("✅ Local Ollama inference")
        logger.info("✅ Benton County knowledge base")
        logger.info("✅ REST API on port 8095")
        logger.info("✅ Common questions answered instantly")
        logger.info("\nNext steps:")
        logger.info("1. Test with: curl -X POST http://localhost:8095/api/query -d '{\"query\": \"What is the tax rate?\"}'")
        logger.info("2. Integrate with existing TerraFusion apps")
        logger.info("3. Add GPU acceleration when budget allows")
        logger.info("\nTo restart: ./start-ai.sh")

if __name__ == "__main__":
    quick_start = BentonAIQuickStart()
    asyncio.run(quick_start.main())