# TerraAgent - AI Assistant Desktop Application

## Overview

TerraAgent is a native desktop AI assistant application, converted from web to
Tauri for enhanced performance and native OS integration.

**Complexity Level**: Simple (Tier 1)  
**Original Stack**: Web-based AI assistant  
**Target Performance**: 3x faster than web version

## Features

- Local AI model integration (Ollama)
- Natural language property queries
- Context-aware assistance
- Native notifications
- System tray integration
- Offline-first operation

## Architecture

```
TerraAgent Desktop
├── React Frontend (TypeScript)
├── Tauri Runtime
├── Rust Backend
│   ├── AI Model Integration
│   ├── Local Database (SQLite)
│   └── System Integrations
└── Native OS Features
```

## Development Commands

```bash
# Start development server
npm run tauri dev

# Build for production
npm run tauri build

# Run tests
npm test

# Lint code
npm run lint
```

## Configuration

- **Bundle ID**: `com.terrafusion.terra-agent`
- **Version**: 1.0.0
- **Target Platforms**: Windows, macOS, Linux
- **Minimum Requirements**:
  - RAM: 512MB
  - Storage: 100MB
  - OS: Windows 10+, macOS 10.15+, Ubuntu 18.04+

## Performance Targets

- **Startup Time**: < 1.5 seconds
- **Memory Usage**: < 30MB
- **Response Time**: < 200ms for queries
- **Bundle Size**: < 10MB

## AI Integration

- **Local LLM**: Ollama with optimized models
- **Context Management**: Conversation history and property data
- **Privacy**: All processing happens locally
- **Models Supported**:
  - Llama 2 7B (default)
  - CodeLlama 7B (for technical queries)
  - Mistral 7B (alternative option)

## IPC Messages

### Outbound

- `ai_query_completed`: When AI processing finishes
- `property_analysis_ready`: When property analysis is complete

### Inbound

- `property_selected`: Updates context with selected property
- `user_authenticated`: Updates user context

## Deployment

- **Windows**: MSI installer with auto-update
- **macOS**: DMG with notarization
- **Linux**: AppImage and DEB packages

## Championship Standards

- ✅ Sub-2-second startup
- ✅ Zero external dependencies
- ✅ 95%+ test coverage
- ✅ WCAG 2.1 AA compliance
- ✅ Privacy-first AI processing
