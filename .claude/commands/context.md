Regenerate the TerraFusion Context Pack.

1. Read the current context pack at .terrafusion/context/latest.json
2. Check the context pack schema at tools/dx/context-pack/schema.json
3. Assess the current workspace state:
   - Git branch and status
   - Service health (ports 5000, 3002, 3004)
   - Skills registry status
   - Evidence pack status
   - Contract drift status
   - TODOs (critical, high, medium, low)
4. Generate an updated context pack summary
5. Provide the top 5 recommended next actions

This is equivalent to running: tdc context regenerate
