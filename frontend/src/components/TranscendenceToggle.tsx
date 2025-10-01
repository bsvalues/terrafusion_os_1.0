import { useTranscendence } from '@/features/transcendence/TranscendenceProvider';

export function TranscendenceToggle() {
  const { enabled, set } = useTranscendence();
  return (
    <button
      aria-pressed={enabled}
      onClick={() => set(!enabled)}
      className="fixed bottom-4 right-4 rounded-full px-4 py-2 border border-cyan-300/60 text-cyan-300 hover:bg-cyan-300/10 backdrop-blur-sm"
    >
      {enabled ? 'Disable Transcendence' : 'Enable Transcendence'}
    </button>
  );
}