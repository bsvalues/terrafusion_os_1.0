import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/canon/CanonSnippetsPanel.tsx';

registerLeakGuard(targetFile, 'CanonSnippetsPanel.tsx');