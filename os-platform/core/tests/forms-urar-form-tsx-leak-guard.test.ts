import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/forms/URARForm.tsx';

registerLeakGuard(targetFile, 'URARForm.tsx');