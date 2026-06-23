#!/usr/bin/env node
import { loadCanonIndex, loadEngineeringWriteLanes, queryCanon } from '../src/os-platform/canon/index.js';

async function main() {
  const [, , command, ...args] = process.argv;

  if (command === 'query') {
    const intent = args.join(' ') || 'inspect os-canon shell launch drift';
    const index = await loadCanonIndex();
    const lanes = await loadEngineeringWriteLanes();
    const answer = queryCanon(index, lanes, {
      taskId: `cli-${Date.now()}`,
      intent,
      surface: 'cli',
      state: 'Draft',
      risk: 'medium',
      scope: {
        allowedPaths: ['frontend/apps/os-shell/src/**', 'os-platform/canon/**'],
        forbiddenPaths: ['ARCHIVE/**', 'specialized/**']
      },
      requiredGates: []
    });
    console.log(JSON.stringify(answer, null, 2));
    return;
  }

  console.log(`tf canon commands:
  query <intent>
  plan <task.json>
  gates <task.json>
  trace seal <evidence.json>
`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
