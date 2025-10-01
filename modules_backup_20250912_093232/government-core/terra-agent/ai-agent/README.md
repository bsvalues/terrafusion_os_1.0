# TerraAgent AI Agent

Advanced artificial intelligence agent for real estate with natural language
processing, multi-model AI integration, and comprehensive domain expertise.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your API keys

# Build
npm run build

# Start server
npm start
```

## API Endpoints

- `POST /api/chat` - Natural language conversations
- `GET /api/health` - System health check
- `GET /api/capabilities` - Agent capabilities
- `POST /api/feedback` - Learning feedback

## Features

- 🤖 **Multi-Model AI**: OpenAI GPT-4 + Anthropic Claude
- 🧠 **Natural Language Processing**: Advanced NLP pipeline
- 💾 **Memory Management**: Vector-based episodic memory
- 📚 **Knowledge Base**: Real estate domain expertise
- 🔧 **MCP Integration**: Property analysis tools
- 📊 **Learning System**: Continuous improvement

## Example Usage

```bash
curl -X POST http://localhost:\${{TF_SHELL_PORT:-3001}}/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Find me a 3-bedroom house under $400k"}'
```

Built as part of TerraFusion OS MIT PhD Enhancement Program - Day 3
