# TerraFusion OS Documentation - Elite Government Engineering Instructions

## Project Architecture Overview

TerraFusion OS Documentation serves as the authoritative knowledge base for the elite government OS:
- `docs/` - Comprehensive documentation and knowledge management (current workspace)
- `backend/` - API specifications and backend architecture documentation
- `frontend/` - UI/UX guidelines and Divine Design System documentation
- `SDK/` - Integration guides and developer resources
- `infrastructure/` - Deployment guides and architecture documentation
- `config/` - Configuration management and environment documentation

## Key Development Workflows

### Production Deployment
Follows the standardized TerraFusion deployment pattern:
```bash
python scripts/execute-production-deployment.py
```
Available as VS Code task "Deploy Production".

### Documentation Excellence Philosophy
- **Living Documentation**: All docs automatically updated with code changes
- **Government Standards**: Documentation meets federal technical writing standards
- **Accessibility First**: All documentation WCAG 2.1 AA compliant
- **Multi-Modal**: Text, diagrams, video, and interactive documentation

## Elite Documentation Standards

### API Documentation
- OpenAPI 3.0 specifications for all backend services
- Interactive API documentation with authentication examples
- Government security patterns and compliance notes
- Performance benchmarks and SLA documentation

### Architecture Documentation
- System architecture diagrams with security boundaries
- Data flow diagrams showing government compliance points
- Infrastructure as code documentation
- Disaster recovery and business continuity plans

### Developer Experience Documentation
- Onboarding guides for new elite developers
- Development environment setup with security configurations
- Code review standards and government compliance checklists
- Elite engineering best practices and patterns

## Project-Specific Conventions

### Documentation Architecture
- `api/` - API specifications and integration guides
- `architecture/` - System design and technical architecture
- `deployment/` - Infrastructure and deployment documentation
- `security/` - Security protocols and compliance documentation
- `user-guides/` - End-user documentation and training materials

### Quality Standards
- **Technical Writing Excellence**: Government technical communication standards
- **Visual Design**: Consistent with Divine Design System
- **Accessibility**: Beyond WCAG 2.1 AA compliance
- **Security**: Sanitized documentation with appropriate classification levels

## Development Guidelines

### When Creating Documentation
- Follow government technical writing standards
- Include security considerations in all documentation
- Maintain consistency with Divine Design System
- Validate accessibility and mobile responsiveness

### When Updating Documentation
- Coordinate with relevant workspace teams
- Update related documentation across all workspaces
- Validate links and cross-references
- Test interactive examples and code samples

### Cross-Workspace Integration
- **API Changes**: Auto-update API documentation from backend changes
- **UI Updates**: Sync component documentation with frontend changes
- **Configuration**: Document all config changes from config workspace
- **Infrastructure**: Maintain deployment documentation currency

## Integration Patterns

### Documentation Flow
```
Code Changes → Auto-Documentation → Review → Publication → Distribution
```

### Quality Assurance Pipeline
```
Content Review → Technical Review → Security Review → Accessibility Validation → Publication
```

## Critical Commands & Tasks

### Documentation Development
- Use "Deploy Production" VS Code task for documentation deployment
- Run accessibility validation on all documentation
- Test interactive examples and code samples
- Validate cross-references and link integrity

### Quality Gates
- All documentation must pass government writing standards
- Technical accuracy validated by relevant workspace teams
- Security review required for all public documentation
- Accessibility compliance mandatory for all content

## Getting Started Quickly
1. Review existing documentation architecture and standards
2. Understand cross-workspace documentation dependencies
3. Validate documentation changes across relevant workspaces
4. Use VS Code "Deploy Production" task for deployment validation
5. Coordinate with Master Coordination team for strategic documentation initiatives
