import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/atlas/SentimentHeatMapWidget.tsx';

registerLeakGuard(targetFile, 'SentimentHeatMapWidget.tsx');