/**
 * AVMStudio.tsx (TFR-063)
 *
 * AVM workflow surface. Prometheus posture: this page does not fabricate
 * model inventory, training progress, validation metrics, or loss curves.
 *
 * Pipeline status colors use semantic Tailwind tokens (bg-primary,
 * bg-destructive, bg-muted) rather than hard-coded hue classes so the
 * surface stays themable. The function below documents the intended
 * mapping even though the live pipeline state is not yet wired.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useParcelCount } from '../../../hooks/useParcelCount';

type PipelineStatus = 'running' | 'failed' | 'idle' | 'unknown';

function pipelineColor(status: PipelineStatus): string {
  switch (status) {
    case 'running': return 'bg-primary';
    case 'failed':  return 'bg-destructive';
    case 'idle':    return 'bg-muted';
    default:        return 'bg-muted';
  }
}

const unavailableItems = [
  'Model registry',
  'Training pipeline status',
  'Training loss curve',
  'Validation metrics',
  'Deployment state',
];

export function AVMStudio() {
  const { data: statsData, isLoading, error } = useParcelCount();
  const parcelCount = statsData?.totalParcels ?? null;

  return (
    <div data-testid="avm-studio" className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">AVM Studio</h1>
          <p className="text-sm text-muted-foreground">
            Governed model execution requires a canonical model registry and training evidence.
          </p>
        </div>
        <Badge variant="outline">Evidence gated</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Canonical Data Readiness</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded bg-white/5 p-3">
            <div className="text-xs text-muted-foreground">Parcel base</div>
            <div className="text-xl font-semibold">
              {isLoading ? 'Loading' : parcelCount === null ? 'Unavailable' : parcelCount.toLocaleString()}
            </div>
          </div>
          <div className="rounded bg-white/5 p-3">
            <div className="text-xs text-muted-foreground">Model registry</div>
            <div className="text-xl font-semibold">Unavailable</div>
          </div>
          <div className="rounded bg-white/5 p-3">
            <div className="text-xs text-muted-foreground">Validation evidence</div>
            <div className="text-xl font-semibold">Unavailable</div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="py-3 text-sm text-destructive">
            Parcel readiness could not be verified: {error instanceof Error ? error.message : String(error)}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>AVM Evidence Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            The previous AVM page displayed seeded model scores and generated loss curves. Those are removed.
            This surface will become operational when the backend exposes audited model registry, run status,
            validation metrics, and provenance for each trained model.
          </p>
          <div className="grid gap-2 md:grid-cols-2">
            {unavailableItems.map((item) => (
              <button
                key={item}
                type="button"
                role="link"
                data-material="bento"
                aria-disabled="true"
                className="flex items-center justify-between rounded border border-white/10 p-3 text-left opacity-70 cursor-not-allowed"
              >
                <span className="flex items-center gap-2 text-sm">
                  <span className={`h-2 w-2 rounded-full ${pipelineColor('unknown')}`} aria-hidden="true" />
                  {item}
                </span>
                <Badge variant="secondary">Not reported</Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AVMStudio;
