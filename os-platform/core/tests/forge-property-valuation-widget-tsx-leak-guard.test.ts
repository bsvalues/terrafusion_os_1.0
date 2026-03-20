import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/forge/PropertyValuationWidget.tsx';

registerLeakGuard(targetFile, 'PropertyValuationWidget.tsx');