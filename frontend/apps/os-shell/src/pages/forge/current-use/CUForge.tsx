import './CUForge.css';
import CurrentUseCaseDeskPage from './CurrentUseCaseDeskPage';

// ── Main Component ───────────────────────────────────────────────────────────

export interface CUForgeProps {
  metadata?: Record<string, unknown>;
}

export default function CUForge({ metadata: _metadata }: CUForgeProps = {}) {
  return <CurrentUseCaseDeskPage />;
}
