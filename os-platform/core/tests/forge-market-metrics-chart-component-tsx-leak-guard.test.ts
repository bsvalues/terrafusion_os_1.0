import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/forge/MarketMetricsChartComponent.tsx';

registerLeakGuard(targetFile, 'MarketMetricsChartComponent.tsx');