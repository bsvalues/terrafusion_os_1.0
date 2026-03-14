/**
 * OperationalQueue — Recent parcel activity lane for suite homes
 *
 * Reads from propertyStore.recentParcels (shared across all suites in v1).
 * Each item routes the user into the Property Workbench with that parcel.
 *
 * Honest limitation: all 5 suites share the same recentParcels source.
 * Suite-specific queues require per-domain activity tracking (future).
 */

import { activateModule } from '../../orchestration/moduleActivation';
import { usePropertyStore } from '../../stores/propertyStore';

interface OperationalQueueProps {
  title: string;
  emptyMessage?: string;
  accentVar?: string;
}

const fmtCurrency = (n: number) => `$${n.toLocaleString()}`;

export function OperationalQueue({
  title,
  emptyMessage = 'No recent activity',
  accentVar = '--tf-accent',
}: OperationalQueueProps) {
  const recentParcels = usePropertyStore((s) => s.recentParcels);

  const handleOpen = (parcelId: string) => {
    activateModule('property-workbench', {
      source: 'start_menu',
      metadata: { parcelId },
    });
  };

  if (recentParcels.length === 0) {
    return (
      <div className="px-6 pb-4">
        <h3
          className="text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: 'hsl(var(--tf-muted))' }}
        >
          {title}
        </h3>
        <p className="text-xs" style={{ color: 'hsl(var(--tf-muted) / 0.6)' }}>
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="px-6 pb-4">
      <h3
        className="text-xs font-semibold uppercase tracking-wider mb-2"
        style={{ color: 'hsl(var(--tf-muted))' }}
      >
        {title}
      </h3>
      <div className="space-y-1">
        {recentParcels.slice(0, 8).map((p) => (
          <button
            key={p.parcelId}
            onClick={() => handleOpen(p.parcelId)}
            className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-white/5"
            style={{ border: '1px solid transparent' }}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm truncate" style={{ color: 'hsl(var(--tf-fg))' }}>
                {p.address}
              </p>
              <p className="text-xs truncate" style={{ color: 'hsl(var(--tf-muted))' }}>
                {p.parcelId} · {p.city}
              </p>
            </div>
            <span
              className="text-xs font-medium shrink-0"
              style={{ color: `hsl(var(${accentVar}))` }}
            >
              {fmtCurrency(p.totalAssessedValue)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
