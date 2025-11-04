# Terrafusion Playground MCP Server

A custom Model Context Protocol (MCP) server designed specifically for Terrafusion Playground development and maintenance. This MCP server provides specialized tools to help with building, maintaining, and optimizing your Terrafusion geospatial applications.

## Features

The Terrafusion Playground MCP provides the following tools:

### 🏥 Project Health & Diagnostics

- **tf_project_health**: Comprehensive project health analysis
- **tf_code_quality**: Code quality checks and linting validation
- **tf_dependency_audit**: Dependency management and security auditing

### 🔧 Development Tools

- **tf_component_generator**: Generate React components, hooks, and services with Terrafusion best practices
- **tf_environment_setup**: Environment validation and setup assistance
- **tf_performance_check**: Bundle analysis and performance optimization

### 🌍 Geospatial Specialized Tools

- **tf_geospatial_tools**: Geospatial data validation and optimization utilities
- **tf_deployment_check**: Deployment readiness validation for different environments

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- TypeScript

### Setup

1. **Install dependencies in the MCP server directory:**

```bash
cd mcp-server
npm install
```

2. **Build the MCP server:**

```bash
npm run build
```

3. **Configure Cursor to use the MCP server:**

Add the following configuration to your Cursor MCP settings or create a `mcp-config.json` file in your project root:

```json
{
  "mcpServers": {
    "terrafusion-playground": {
      "command": "node",
      "args": ["./mcp-server/dist/index.js"],
      "cwd": ".",
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

## Usage

Once configured, you can use the Terrafusion MCP tools directly in Cursor. Here are some example use cases:

### Check Project Health

```
Use tf_project_health to analyze the current state of the Terrafusion project
```

### Generate a React Component

```
Use tf_component_generator with type="component", name="MapViewer", includeTests=true
```

### Audit Dependencies

```
Use tf_dependency_audit to check for outdated packages and security vulnerabilities
```

### Performance Analysis

```
Use tf_performance_check to analyze bundle size and performance metrics
```

### Geospatial Data Validation

```
Use tf_geospatial_tools to validate GeoJSON files and check mapping libraries
```

## Available Tools

### tf_project_health

Analyzes project health including:

- Package.json validation
- Essential files check
- Dependencies status
- Configuration validation

**Parameters:**

- `checkDependencies` (boolean): Check node_modules existence
- `checkLinting` (boolean): Validate linting configuration
- `checkSecurity` (boolean): Run security checks

### tf_code_quality

Validates code quality setup:

- ESLint configuration
- Prettier setup
- TypeScript configuration
- Best practices compliance

**Parameters:**

- `fix` (boolean): Attempt to fix issues automatically
- `includeTests` (boolean): Include test files in analysis

### tf_component_generator

Generates components with Terrafusion best practices:

- React components with TypeScript
- Custom hooks
- Service classes
- API endpoints
- Test files

**Parameters:**

- `type` (string): "component", "service", "hook", "page", or "api"
- `name` (string): Component name
- `path` (string): Target directory path
- `includeTests` (boolean): Generate test files
- `includeStories` (boolean): Generate Storybook stories

### tf_dependency_audit

Manages project dependencies:

- Version checking
- Security vulnerability scanning
- Update recommendations
- Terrafusion-specific dependencies

**Parameters:**

- `checkOutdated` (boolean): Check for outdated packages
- `checkVulnerabilities` (boolean): Scan for security issues
- `suggestUpdates` (boolean): Provide update recommendations

### tf_environment_setup

Environment validation and setup:

- Node.js version checking
- Docker validation
- Environment file creation
- Development tools verification

**Parameters:**

- `createEnvFile` (boolean): Create .env from .env.example
- `validateDocker` (boolean): Check Docker availability
- `setupDatabase` (boolean): Database setup assistance

### tf_performance_check

Performance analysis and optimization:

- Bundle size analysis
- Memory usage checking
- Performance optimization suggestions
- Code splitting recommendations

**Parameters:**

- `analyzeBundles` (boolean): Analyze build output
- `checkMemoryUsage` (boolean): Check memory usage patterns
- `generateReport` (boolean): Generate performance report

### tf_geospatial_tools

Geospatial data utilities:

- GeoJSON validation
- Image optimization
- Coordinate system checking
- Mapping library verification

**Parameters:**

- `validateGeoJSON` (boolean): Validate GeoJSON files
- `optimizeImages` (boolean): Optimize map images
- `checkProjections` (boolean): Validate coordinate systems
- `dataPath` (string): Path to geospatial data

### tf_deployment_check

Deployment readiness validation:

- Configuration validation
- Environment-specific checks
- Security scanning
- Build process verification

**Parameters:**

- `environment` (string): "development", "staging", or "production"
- `checkSecrets` (boolean): Validate secret management
- `validateConfig` (boolean): Check configuration files

## Development

### Running in Development Mode

```bash
npm run dev
```

### Building

```bash
npm run build
```

### Watching for Changes

```bash
npm run watch
```

## Customization

The MCP server can be extended with additional tools specific to your Terrafusion workflow. To add new tools:

1. Add the tool definition to the `ListToolsRequestSchema` handler
2. Implement the tool logic as a private method
3. Add the tool to the `CallToolRequestSchema` handler switch statement

Example:

```typescript
private async myCustomTool(args: any) {
  // Your tool implementation
  return {
    content: [
      {
        type: 'text',
        text: 'Tool output'
      }
    ]
  };
}
```

## Best Practices

### Component Generation

- Use consistent naming conventions
- Include TypeScript interfaces
- Add proper JSDoc comments
- Generate accompanying tests
- Follow Terrafusion architectural patterns

### Code Quality

- Maintain ESLint and Prettier configurations
- Use TypeScript strict mode
- Implement comprehensive testing
- Follow accessibility guidelines

### Performance

- Monitor bundle sizes
- Implement lazy loading for large components
- Optimize geospatial data handling
- Use appropriate caching strategies

### Geospatial Development

- Validate coordinate systems
- Optimize data formats for web display
- Implement proper error handling for map operations
- Consider offline capabilities

## Troubleshooting

### Common Issues

**MCP Server Not Starting:**

- Ensure Node.js 18+ is installed
- Check that dependencies are installed: `npm install`
- Verify the build completed successfully: `npm run build`

**Tools Not Available in Cursor:**

- Check the MCP configuration in Cursor
- Ensure the server path is correct
- Restart Cursor after configuration changes

**Permission Errors:**

- Ensure the MCP server has read/write permissions to the project directory
- Check that the user has permissions to execute Node.js

### Debug Mode

To run the MCP server with debug output:

```bash
NODE_ENV=development npm run dev
```

## Contributing

To contribute to the Terrafusion Playground MCP:

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests for new functionality
5. Update documentation
6. Submit a pull request

## License

This MCP server is part of the Terrafusion Playground project and is licensed under the MIT License.

## Support

For issues and questions:

- Check the troubleshooting section above
- Review the Terrafusion Playground documentation
- Create an issue in the project repository

---

_TerraFusion Playground MCP Server - Empowering geospatial development with intelligent tooling._
