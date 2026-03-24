import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/forge/PropertyRecommendationCarousel.tsx';

registerLeakGuard(targetFile, 'PropertyRecommendationCarousel.tsx');