Run a FISMA-HIGH compliance check on the TerraFusion codebase.

Check these NIST 800-53 control families:
- AC (Access Control): JWT auth, RBAC, MFA, session management
- AU (Audit & Accountability): Audit logging, record retention, integrity
- IA (Identification & Authentication): Password policies, token validation
- SC (System & Communications Protection): HTTPS, encryption, key management
- SI (System & Information Integrity): Vulnerability scanning, monitoring
- CM (Configuration Management): Drift detection, change control

For each control, report pass/warn/fail with details.
Calculate overall compliance score as percentage.

This is equivalent to running: tdc compliance check --verbose
