# Contributing to TerraFusionPro

Thank you for your interest in contributing to TerraFusionPro! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Branching Strategy](#branching-strategy)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Code Style and Standards](#code-style-and-standards)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

Our project adheres to a Code of Conduct that we expect all contributors to follow. Please read and understand this code before contributing.

- Be respectful and inclusive
- Be collaborative
- Take responsibility for your actions
- Be careful in the words you choose
- Focus on what is best for the community and project

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- PostgreSQL 14.x or higher
- Git

### Local Development Setup

1. Fork the repository
2. Clone your fork:
   ```
   git clone https://github.com/your-username/terrafusionpro.git
   ```
3. Add the original repository as the upstream remote:
   ```
   git remote add upstream https://github.com/origorg/terrafusionpro.git
   ```
4. Install dependencies:
   ```
   npm install
   ```
5. Set up the local database:
   ```
   npm run db:push
   ```
6. Start the development environment:
   ```
   npm start
   ```

## Development Workflow

TerraFusionPro follows a microservices architecture in a monorepo structure. Each service and package has its own responsibilities and concerns.

### Monorepo Structure

- `packages/`: Shared libraries and modules used across multiple services
- `services/`: Microservices that comprise the TerraFusionPro platform
- `infrastructure/`: Kubernetes and deployment configurations

### Running Specific Services

You can run individual services for development:

```bash
# Start the web client
npm start

# Start the API gateway
npm run start:api

# Start specific services
npm run start:property
npm run start:user
npm run start:form
npm run start:analysis
npm run start:report
```

## Branching Strategy

We follow a feature branch workflow:

1. Create a branch from `main` for your feature or bugfix:
   ```
   git checkout -b feature/your-feature-name
   ```
   or
   ```
   git checkout -b fix/your-bugfix-name
   ```

2. Make your changes in that branch
3. Submit a pull request to the `main` branch

## Commit Message Guidelines

We follow the Conventional Commits specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types include:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc)
- `refactor`: Code refactoring without changing functionality
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

Example:
```
feat(property): add geocoding capability to property service

Add integration with mapping API to automatically geocode properties when they are created.

Closes #123
```

## Pull Request Process

1. Ensure your PR addresses a specific issue or implements a specific feature
2. Update documentation as needed
3. Add tests for new functionality
4. Make sure all tests pass
5. Get at least one code review from a maintainer
6. Once approved, a maintainer will merge your PR

## Testing Guidelines

- Write unit tests for all new code
- Ensure all tests pass before submitting a PR
- Write integration tests for new features that span multiple services
- Aim for at least 80% test coverage

## Code Style and Standards

- Follow the ESLint rules defined in the project
- Use async/await for asynchronous code
- Use descriptive variable and function names
- Document complex logic with comments
- Follow the principle of least surprise

## Documentation

- Update documentation when changing functionality
- Include JSDoc comments for functions and classes
- Update API documentation when changing endpoints
- Keep README and other documents up to date

## Issue Reporting

- Use the issue template when creating new issues
- Provide detailed reproduction steps
- Include version information
- Note the expected vs. actual behavior
- Include screenshots, logs, or other relevant information

Thank you for contributing to TerraFusionPro!