import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/levy/visualizations/LevyCharts.tsx';

registerLeakGuard(targetFile, 'LevyCharts.tsx');