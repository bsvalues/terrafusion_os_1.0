Run a governance posture check across all TerraFusion lanes.

Check each governance lane and report posture scores:
- **dev**: Test infrastructure, lint configuration, build status
- **governance**: Evidence pack, skills registry, command contracts, compliance
- **security**: Security project, audit logging, authentication, encryption
- **ops**: CI workflows, deployment configuration, monitoring
- **data**: Database layer, migrations, data integrity

For each lane, provide a score (0-100) and status (pass/warn/fail).
Calculate an overall weighted posture score and report the status.

This is equivalent to running: tdc posture check
