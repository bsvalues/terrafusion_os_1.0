List and validate all TerraFusion Skills in the registry.

1. Read tools/dx/skills/registry.json
2. For each registered skill:
   - Verify SKILL.md exists at the skill path
   - Verify contract.json exists
   - Check dependencies are satisfied
   - Report skill status (active/draft/deprecated)
3. Group skills by owner lane (dev, governance, security, ops, data)
4. Report total counts and any validation issues

This is equivalent to running: tdc skill validate
