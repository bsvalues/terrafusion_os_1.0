---
slug: /
title: Developer Documentation
sidebar_position: 1
---

# Terrafusion Developer Documentation

Welcome to the Terrafusion Developer Documentation. This guide provides comprehensive information for developers working with the Terrafusion platform, whether you're building plugins, integrating with our APIs, or contributing to the core codebase.

## Platform Architecture

Terrafusion is built on a modern monorepo architecture using TurboRepo and pnpm workspaces. This architecture provides several advantages:

- **Modular Design**: Components are separated into logical packages
- **Shared Dependencies**: Common libraries are shared efficiently
- **Consistent Tooling**: Build, test, and lint configurations are standardized
- **Optimized Builds**: Builds are cached and dependencies are managed efficiently

The core packages in the monorepo include:

- **core-models**: Shared data models and schema definitions
- **plugin-loader**: Plugin system architecture including payment integration
- **ui-components**: Reusable UI component library
- **geo-api**: Unified geospatial API with provider adapters

## Development Setup

To set up your development environment:

1. Start with the [Setup Guide](./setup.md) to configure your local environment
2. Review the [Architecture Overview](./architecture.md) to understand the system components
3. Explore the [Core Packages](./core-packages/core-models.md) documentation

## Plugin Development

Terrafusion supports an extensible plugin architecture. To develop plugins:

1. Learn about the [Plugin Creation Process](./plugins/creating-plugins.md)
2. Review the [Plugin API Reference](./plugins/plugin-api.md)
3. For premium plugins, see the [Payment Integration Guide](./plugins/payment-integration.md)

## API Reference

Terrafusion offers several APIs for integration:

- [REST API](./api/rest-api.md): HTTP endpoints for data access and manipulation
- [WebSocket API](./api/websocket-api.md): Real-time communication channels
- [GeoAPI](./api/geo-api.md): Geospatial data and mapping operations

## Contributing

We welcome contributions to the Terrafusion platform:

1. Review our [Contribution Guidelines](./contributing/guidelines.md)
2. Follow our [Code Style Guide](./contributing/code-style.md)
3. Ensure you write tests following our [Testing Guidelines](./contributing/testing.md)

Thank you for being part of the Terrafusion developer community!
