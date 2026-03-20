import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/forge/CompGridDropzone.tsx';

registerLeakGuard(targetFile, 'CompGridDropzone.tsx');