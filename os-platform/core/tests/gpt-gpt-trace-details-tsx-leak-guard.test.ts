import { registerLeakGuard } from './leak-guard-test-helpers';

const targetFile = 'frontend/apps/os-shell/src/components/gpt/GPTTraceDetails.tsx';

registerLeakGuard(targetFile, 'GPTTraceDetails.tsx');