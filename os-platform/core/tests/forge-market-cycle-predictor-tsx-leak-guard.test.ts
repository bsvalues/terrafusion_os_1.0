import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/forge/MarketCyclePredictor.tsx';

registerLeakGuard(targetFile, 'MarketCyclePredictor.tsx');