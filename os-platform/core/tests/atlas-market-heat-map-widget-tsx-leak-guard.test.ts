import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/atlas/MarketHeatMapWidget.tsx';

registerLeakGuard(targetFile, 'MarketHeatMapWidget.tsx');