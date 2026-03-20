import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/levy/Map/DistrictMap.tsx';

registerLeakGuard(targetFile, 'DistrictMap.tsx');