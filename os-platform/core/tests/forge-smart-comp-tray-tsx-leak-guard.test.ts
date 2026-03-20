import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/forge/SmartCompTray.tsx';

registerLeakGuard(targetFile, 'SmartCompTray.tsx');