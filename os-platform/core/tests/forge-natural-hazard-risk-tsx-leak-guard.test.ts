import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/forge/NaturalHazardRisk.tsx';

registerLeakGuard(targetFile, 'NaturalHazardRisk.tsx');