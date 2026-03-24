import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/governance/DemoDataBanner.tsx';

registerLeakGuard(targetFile, 'DemoDataBanner.tsx');