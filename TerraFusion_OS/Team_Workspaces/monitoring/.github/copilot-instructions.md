# TerraFusion OS Monitoring - Elite Government Engineering Instructions

## Project Architecture Overview

TerraFusion OS Monitoring provides omniscient visibility and predictive analytics across the entire system:
- `monitoring/` - Central monitoring and observability orchestration (current workspace)
- `monitoring/qa/` - Quality assurance dashboards and metrics
- `monitoring/performance/` - Performance analytics and optimization insights
- `monitoring/security/` - Security event monitoring and threat detection
- `monitoring/infrastructure/` - Infrastructure health and capacity monitoring
- `monitoring/compliance/` - Government compliance and audit monitoring

## Key Development Workflows

### Production Deployment
Follows the standardized TerraFusion deployment pattern:
```bash
python scripts/execute-production-deployment.py
```
Available as VS Code task "Deploy Production".

### Elite Monitoring Philosophy
- **Predictive Analytics**: Prevent issues before they impact users
- **Real-Time Visibility**: Sub-second monitoring and alerting
- **Government Compliance**: Comprehensive audit trails and compliance monitoring
- **Performance Excellence**: Continuous optimization through data-driven insights
- **Security First**: Proactive threat detection and incident response

## Elite Monitoring Stack

### Observability Platform
- **Metrics**: Prometheus with long-term storage in Thanos
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana) with security extensions
- **Tracing**: Jaeger with OpenTelemetry for distributed tracing
- **Dashboards**: Grafana with government-compliant visualization templates
- **Alerting**: PagerDuty integration with escalation policies

### Quality Assurance Monitoring
- **Performance Budgets**: Automated performance budget validation
- **Accessibility Monitoring**: Continuous WCAG compliance monitoring
- **Security Scanning**: Real-time vulnerability assessment and compliance
- **Code Quality**: SonarQube with government security rules
- **Test Coverage**: Real-time test coverage monitoring and reporting

### Infrastructure Monitoring
- **Cloud Resources**: Multi-cloud monitoring with cost optimization
- **Container Orchestration**: Kubernetes monitoring with security policies
- **Network Performance**: Network latency and security monitoring
- **Database Performance**: Query optimization and performance analytics
- **Auto-Scaling**: Intelligent scaling based on predictive analytics

## Project-Specific Conventions

### Monitoring Architecture
- `dashboards/` - Grafana dashboards and visualization configurations
- `alerts/` - Alert rules and escalation policies
- `scripts/` - Monitoring automation and data collection scripts
- `compliance/` - Government compliance monitoring and reporting
- `security/` - Security event monitoring and incident response

### Government Compliance Standards
- **Audit Logging**: Comprehensive audit trails for all system activities
- **Data Retention**: Government-compliant data retention policies
- **Security Monitoring**: Continuous security event monitoring and analysis
- **Performance SLAs**: Government service level agreement monitoring
- **Compliance Reporting**: Automated compliance reporting and validation

## Development Guidelines

### When Implementing Monitoring
- Implement monitoring-first approach for all new features
- Include government compliance monitoring from the start
- Add predictive analytics for proactive issue resolution
- Ensure all monitoring data is encrypted and access-controlled

### When Creating Dashboards
- Follow government accessibility standards for all dashboards
- Include security context and compliance status in all views
- Implement role-based access controls for sensitive monitoring data
- Provide mobile-responsive dashboards for incident response

### Cross-Workspace Monitoring Integration
- **Backend Monitoring**: API performance, security events, and compliance
- **Frontend Monitoring**: User experience, accessibility, and performance
- **Infrastructure Monitoring**: Resource utilization, security, and scaling
- **Configuration Monitoring**: Configuration drift and compliance validation

## Integration Patterns

### Monitoring Data Flow
```
All Workspaces → Monitoring Collectors → Data Processing → Dashboards → Alerts
```

### Incident Response Flow
```
Event Detection → Alert Generation → Escalation → Response → Resolution → Analysis
```

## Elite Monitoring Tools and Integrations

### Performance Monitoring
- **Backend Performance**: Application Performance Monitoring (APM) with New Relic
- **Frontend Performance**: Real User Monitoring (RUM) with SpeedCurve
- **Infrastructure Performance**: Infrastructure monitoring with DataDog
- **Database Performance**: Database monitoring with Percona

### Security Monitoring
- **SIEM Integration**: Splunk integration for security information and event management
- **Threat Detection**: CrowdStrike integration for endpoint detection and response
- **Vulnerability Management**: Rapid7 integration for vulnerability assessment
- **Compliance Monitoring**: ServiceNow integration for compliance management

### Quality Assurance Monitoring
- **Test Monitoring**: TestRail integration for test execution monitoring
- **Code Quality**: SonarCloud integration for continuous code quality monitoring
- **Accessibility Monitoring**: axe-monitor for continuous accessibility compliance
- **Performance Budget**: Lighthouse CI for continuous performance monitoring

## Critical Commands & Tasks

### Monitoring Setup
- Use "Deploy Production" VS Code task for monitoring deployment
- Configure government-compliant data retention policies
- Set up role-based access controls for monitoring dashboards
- Validate security monitoring and incident response procedures

### Quality Gates
- All monitoring must pass government security and compliance requirements
- Performance monitoring must detect issues within 30 seconds
- Security monitoring must provide real-time threat detection
- Compliance monitoring must provide automated reporting capabilities

## Getting Started Quickly
1. Review existing monitoring architecture and government compliance requirements
2. Understand cross-workspace monitoring integration patterns
3. Set up local monitoring environment with security configurations
4. Use VS Code "Deploy Production" task for monitoring deployment validation
5. Coordinate with Security Operations and Performance Excellence teams for optimization
