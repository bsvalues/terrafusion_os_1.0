import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/forge/NeighborhoodTrendsGrid.tsx';

registerLeakGuard(targetFile, 'NeighborhoodTrendsGrid.tsx');