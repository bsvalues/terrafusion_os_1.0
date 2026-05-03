/**
 * BIV-120: Neighborhood Sentiment Dashboard
 * ------------------------------------------------------------------
 * Governed Atlas surface for neighborhood sentiment.
 *
 * Current truth:
 * - Atlas does not yet expose a governed list feed for neighborhood sentiment.
 * - No seeded Richland sentiment ranks or pseudo-heat bubbles are rendered.
 * - The dashboard stays mounted with explicit unavailable disclosure until
 *   the live feed exists.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SentimentCategory {
  name: string;
  score: number;
}

export interface NeighborhoodSentiment {
  id: string;
  name: string;
  overallScore: number;
  trend: number[];
  categories: SentimentCategory[];
  center: [number, number];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SentimentDashboard() {
  return (
    <div data-testid="sentiment-dashboard" className="flex h-full bg-terra-midnight text-white">
      {/* Map area */}
      <main className="flex-1 relative overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="sent-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#sent-grid)" />
          </svg>
        </div>

        <div
          data-testid="sentiment-dashboard-unavailable"
          className="absolute inset-0 flex items-center justify-center p-6"
        >
          <div className="max-w-xl rounded-xl border border-white/10 bg-terra-midnight/75 p-6 text-center backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terra-cyan">
              Governed Atlas Required
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Neighborhood sentiment unavailable.
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Atlas does not have a governed neighborhood sentiment list feed for this page, and
              no seeded Richland ranking or pseudo-heat bubbles are rendered here.
            </p>
            <p className="mt-4 text-xs text-white/50">
              This surface remains mounted so the route contract stays stable while the live feed is
              built.
            </p>
          </div>
        </div>
      </main>

      {/* Right panel */}
      <aside className="w-80 flex-shrink-0 border-l border-white/10 overflow-y-auto p-4 space-y-4">
        <h1 className="text-lg font-semibold text-terra-cyan">Sentiment Dashboard</h1>

        {/* Rankings */}
        <Card variant="glass" data-material="bento">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Rankings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-white/80">Governed neighborhood sentiment rankings unavailable.</p>
            <p className="text-xs leading-5 text-white/55">
              This panel stays mounted without seeded neighborhood rows until Atlas exposes a live
              sentiment index and list feed.
            </p>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
