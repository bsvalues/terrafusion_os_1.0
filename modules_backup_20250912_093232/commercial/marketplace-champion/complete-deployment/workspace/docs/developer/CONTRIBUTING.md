# Contributing to Terrafusion Platform

Thank you for your interest in contributing to Terrafusion! This document
provides guidelines and instructions for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Process](#development-process)
4. [Coding Standards](#coding-standards)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Testing Requirements](#testing-requirements)
8. [Documentation](#documentation)
9. [Community](#community)

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Show empathy towards other community members
- Respect differing viewpoints and experiences

### Unacceptable Behavior

- Harassment or discriminatory language
- Personal attacks or trolling
- Publishing private information
- Other conduct deemed inappropriate

### Enforcement

Violations should be reported to conduct@terrafusion.gov. All complaints will be
reviewed and investigated promptly and fairly.

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Python 3.10+
- Docker and Docker Compose
- Git
- PostgreSQL 14+ (for local development)
- Redis 6+

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/terrafusion.git
   cd terrafusion
   ```

### Setup Development Environment

1. Install dependencies:

   ```bash
   npm install
   pip install -r requirements.txt
   ```

2. Copy environment template:

   ```bash
   cp .env.example .env
   ```

3. Configure your local environment variables

4. Start local services:
   ```bash
   docker-compose up -d
   npm run dev
   ```

### Development Branch Structure

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Emergency fixes for production

## Development Process

### 1. Find or Create an Issue

- Check existing issues before creating new ones
- Use issue templates for bugs and features
- Get issue assigned before starting work

### 2. Create a Branch

```bash
git checkout -b feature/issue-number-description
# Example: git checkout -b feature/123-add-quantum-service
```

### 3. Make Your Changes

- Write clean, readable code
- Follow coding standards
- Add/update tests
- Update documentation

### 4. Test Your Changes

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --testPathPattern=quantum

# Run linting
npm run lint

# Run type checking
npm run typecheck
```

### 5. Commit Your Changes

Follow our commit message convention:

```
type(scope): subject

body

footer
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions/modifications
- `chore`: Maintenance tasks

Example:

```
feat(quantum): add quantum entanglement service

- Implement QuantumEntanglementService class
- Add unit tests for quantum state management
- Update documentation with quantum examples

Closes #123
```

### 6. Push and Create Pull Request

```bash
git push origin feature/123-add-quantum-service
```

Then create a pull request on GitHub.

## Coding Standards

### TypeScript/JavaScript

```typescript
// Use meaningful variable names
const userAuthenticationToken = generateToken(); // Good
const token = genTok(); // Bad

// Use async/await over promises
// Good
async function fetchUser(id: string): Promise<User> {
  try {
    const user = await userService.findById(id);
    return user;
  } catch (error) {
    logger.error('Failed to fetch user', { id, error });
    throw new UserNotFoundError(id);
  }
}

// Avoid nested callbacks
// Bad
getUserById(id, (err, user) => {
  if (err) {
    handleError(err);
  } else {
    getPermissions(user.id, (err, permissions) => {
      // Nested callback hell
    });
  }
});

// Use interfaces for type definitions
interface CreateTenantRequest {
  name: string;
  domain: string;
  adminEmail: string;
  metadata?: Record<string, unknown>;
}

// Document complex functions
/**
 * Calculates quantum state probability distribution
 * @param qubits - Array of qubit states
 * @param measurementBasis - Basis for measurement (X, Y, or Z)
 * @returns Probability distribution for each possible outcome
 */
function calculateProbabilityDistribution(
  qubits: QubitState[],
  measurementBasis: MeasurementBasis
): ProbabilityDistribution {
  // Implementation
}
```

### Python

```python
# Follow PEP 8 style guide
# Use type hints
from typing import List, Optional, Dict
from dataclasses import dataclass

@dataclass
class QuantumState:
    """Represents a quantum state in the system."""
    amplitude: complex
    phase: float
    entangled_with: Optional[List[str]] = None

def process_quantum_circuit(
    circuit: QuantumCircuit,
    backend: str = "simulator"
) -> QuantumResult:
    """
    Process a quantum circuit on specified backend.

    Args:
        circuit: The quantum circuit to execute
        backend: Backend to run on ('simulator' or 'hardware')

    Returns:
        QuantumResult containing measurement outcomes

    Raises:
        QuantumBackendError: If backend is unavailable
    """
    try:
        backend_instance = get_backend(backend)
        job = backend_instance.run(circuit)
        return job.result()
    except BackendException as e:
        logger.error(f"Backend error: {e}")
        raise QuantumBackendError(f"Failed to execute on {backend}")

# Use context managers for resources
with quantum_connection() as qc:
    result = qc.execute(circuit)

# Prefer list comprehensions for simple transformations
# Good
squared_values = [x**2 for x in values if x > 0]

# Less readable
squared_values = []
for x in values:
    if x > 0:
        squared_values.append(x**2)
```

### General Guidelines

- Keep functions small and focused (< 50 lines)
- Use meaningful names for variables and functions
- Comment complex logic
- Avoid global variables
- Handle errors appropriately
- Write self-documenting code

## Testing Requirements

### Unit Tests

- Minimum 80% code coverage
- Test edge cases and error conditions
- Use descriptive test names

```typescript
describe('QuantumEntanglementService', () => {
  it('should create entangled qubit pair with Bell state', async () => {
    const service = new QuantumEntanglementService();
    const [qubit1, qubit2] = await service.createBellPair();

    expect(qubit1.isEntangled()).toBe(true);
    expect(qubit2.isEntangled()).toBe(true);
    expect(qubit1.entangledWith).toContain(qubit2.id);
  });

  it('should throw error when entangling already entangled qubits', async () => {
    const service = new QuantumEntanglementService();
    const [q1, q2] = await service.createBellPair();
    const q3 = await service.createQubit();

    await expect(service.entangle(q1, q3)).rejects.toThrow(
      'Qubit is already entangled'
    );
  });
});
```

### Integration Tests

- Test API endpoints
- Test service interactions
- Use test databases

```typescript
describe('POST /api/v1/tenants', () => {
  it('should create a new tenant with valid data', async () => {
    const response = await request(app)
      .post('/api/v1/tenants')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test County',
        domain: 'testcounty.gov',
        adminEmail: 'admin@testcounty.gov',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Test County');
  });
});
```

### E2E Tests

- Test critical user flows
- Use Cypress or Playwright
- Run in CI/CD pipeline

## Documentation

### AI Agent Protocols

All AI agent operational protocols, deployment strategies, and swarm
instructions are now centralized in the `/ai-agent-instructions/` folder at the
workspace root. Contributors must consult this folder for:

- Master agent governance protocols
- Subagent swarm build and deployment instructions
- Historical protocols and deployment scripts

When contributing to any AI agent, automation, or swarm-related functionality,
update the relevant protocol files in `/ai-agent-instructions/` to ensure
canonical documentation and operational consistency.

### Code Documentation

- Document all public APIs
- Include examples in documentation
- Keep README files updated

### API Documentation

- Use OpenAPI/Swagger annotations
- Document request/response schemas
- Include authentication requirements

```typescript
/**
 * @swagger
 * /api/v1/quantum/compute:
 *   post:
 *     summary: Submit quantum computation job
 *     tags: [Quantum]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuantumJobRequest'
 *     responses:
 *       202:
 *         description: Job accepted for processing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuantumJob'
 */
```

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Self-review of code completed
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No merge conflicts

### PR Description Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist

- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing unit tests pass locally
```

### Review Process

1. Automated checks must pass
2. Code review by at least 2 maintainers
3. All conversations resolved
4. Branch up to date with target

### After Merge

- Delete your feature branch
- Update your local main branch
- Close related issues

## Release Process

### Version Numbering

We follow Semantic Versioning (MAJOR.MINOR.PATCH):

- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

### Release Checklist

1. Update version in package.json
2. Update CHANGELOG.md
3. Create release branch
4. Run full test suite
5. Create GitHub release
6. Deploy to staging
7. Deploy to production

## Community

### Communication Channels

- **Discord**: [Terrafusion Community](https://discord.gg/terrafusion)
- **Forums**: [community.terrafusion.gov](https://community.terrafusion.gov)
- **Twitter**: [@TerraFusionGov](https://twitter.com/terrafusiongov)

### Getting Help

- Check documentation first
- Search existing issues
- Ask in Discord #help channel
- Create detailed issue if needed

### Recognition

Contributors are recognized through:

- CONTRIBUTORS.md file
- GitHub contributor badge
- Community spotlight features
- Conference speaking opportunities

---

Thank you for contributing to Terrafusion! Your efforts help build better
government technology for everyone.
