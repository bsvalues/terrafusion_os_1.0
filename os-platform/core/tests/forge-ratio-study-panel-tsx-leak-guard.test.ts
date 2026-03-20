import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/forge/RatioStudyPanel.tsx';

registerLeakGuard(targetFile, 'RatioStudyPanel.tsx');