import React from 'react';

// BIV-117: Market phase forecasting display

type MarketPhase = 'Recovery' | 'Expansion' | 'Hyper-Supply' | 'Recession';

interface PhaseData {
  currentPhase: MarketPhase;
  phaseProgress: number; // 0-100, how far into current phase
  nextPhase: MarketPhase;
  estimatedTransition: string; // e.g. "Q3 2026"
  confidence: number; // 0-100
  indicators: { name: string; value: string; supports: MarketPhase }[];
}

interface MarketCyclePredictorProps {
  data: PhaseData | null;
  loading: boolean;
}

const phaseOrder: MarketPhase[] = ['Recovery', 'Expansion', 'Hyper-Supply', 'Recession'];

const phaseColors: Record<MarketPhase, string> = {
  Recovery: '#22c55e',
  Expansion: '#3b82f6',
  'Hyper-Supply': '#f97316',
  Recession: '#ef4444',
};

export default function MarketCyclePredictor({ data, loading }: MarketCyclePredictorProps) {
  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
        Generating market cycle forecast...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
        No market cycle data available.
      </div>
    );
  }

  const currentIndex = phaseOrder.indexOf(data.currentPhase);

  return (
    <div>
      <h2 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600 }}>
        Market Cycle Predictor
      </h2>

      {/* Phase timeline */}
      <div
        style={{
          display: 'flex',
          marginBottom: 24,
          borderRadius: 8,
          overflow: 'hidden',
          border: '1px solid #1e293b',
        }}
      >
        {phaseOrder.map((phase, idx) => {
          const isCurrent = idx === currentIndex;
          const isPast = idx < currentIndex;
          return (
            <div
              key={phase}
              style={{
                flex: 1,
                padding: '12px 8px',
                textAlign: 'center',
                backgroundColor: isCurrent
                  ? `${phaseColors[phase]}20`
                  : isPast
                    ? '#0f172a'
                    : '#020617',
                borderRight: idx < 3 ? '1px solid #1e293b' : 'none',
                position: 'relative',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: isCurrent ? 700 : 400,
                  color: isCurrent ? phaseColors[phase] : '#64748b',
                }}
              >
                {phase}
              </div>
              {isCurrent && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: 3,
                    width: `${data.phaseProgress}%`,
                    backgroundColor: phaseColors[phase],
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Forecast summary */}
        <div
          style={{
            padding: 16,
            borderRadius: 8,
            border: '1px solid #1e293b',
            backgroundColor: '#0f172a',
          }}
        >
          <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600 }}>Forecast</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#94a3b8' }}>Current Phase</span>
              <span style={{ fontWeight: 600, color: phaseColors[data.currentPhase] }}>
                {data.currentPhase}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#94a3b8' }}>Phase Progress</span>
              <span>{data.phaseProgress}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#94a3b8' }}>Next Phase</span>
              <span style={{ color: phaseColors[data.nextPhase] }}>{data.nextPhase}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#94a3b8' }}>Est. Transition</span>
              <span>{data.estimatedTransition}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#94a3b8' }}>Confidence</span>
              <span>{data.confidence}%</span>
            </div>
          </div>
        </div>

        {/* Supporting indicators */}
        <div
          style={{
            padding: 16,
            borderRadius: 8,
            border: '1px solid #1e293b',
            backgroundColor: '#0f172a',
          }}
        >
          <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600 }}>
            Supporting Indicators
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.indicators.map((ind) => (
              <div
                key={ind.name}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 13,
                }}
              >
                <span style={{ color: '#94a3b8' }}>{ind.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{ind.value}</span>
                  <span
                    style={{
                      fontSize: 10,
                      padding: '1px 6px',
                      borderRadius: 3,
                      backgroundColor: `${phaseColors[ind.supports]}20`,
                      color: phaseColors[ind.supports],
                    }}
                  >
                    {ind.supports}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
