import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/atlas/SchoolDistrictWidget.tsx';

registerLeakGuard(targetFile, 'SchoolDistrictWidget.tsx');