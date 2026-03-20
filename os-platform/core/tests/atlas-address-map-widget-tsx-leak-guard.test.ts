import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/atlas/AddressMapWidget.tsx';

registerLeakGuard(targetFile, 'AddressMapWidget.tsx');