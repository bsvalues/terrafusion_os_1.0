import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/forge/MarketAnalyticsDashboard.tsx';

registerLeakGuard(targetFile, 'MarketAnalyticsDashboard.tsx');