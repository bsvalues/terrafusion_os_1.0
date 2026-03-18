import React from 'react';

// BIV-090: Mass appraisal model diagnostics

interface QualityDimension {
  name: 'completeness' | 'consistency' | 'accuracy' | 'timeliness';
  score: number; // 0-100
  issues: QualityIssue[];
}

interface QualityIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  affectedRecords?: number;
}

interface QualityControlPanelProps {
  dimensions: QualityDimension[];
  loading: boolean;
}

type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

function computeOverallGrade(dimensions: QualityDimension[]): Grade {
  if (dimensions.length === 0) return 'F';
  const avg = dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length;
  if (avg >= 90) return 'A';
  if (avg >= 80) return 'B';
  if (avg >= 70) return 'C';
  if (avg >= 60) return 'D';
  return 'F';
}

const gradeColors: Record<Grade, string> = {
  A: '#22c55e',
  B: '#84cc16',
  C: '#eab308',
  D: '#f97316',
  F: '#ef4444',
};

const severityIcons: Record<string, string> = {
  critical: '\u26D4',
  warning: '\u26A0',
  info: '\u2139',
};

const severityColors: Record<string, string> = {
  critical: '#ef4444',
  warning: '#eab308',
  info: '#3b82f6',
};

function DimensionBar({ dimension }: { dimension: QualityDimension }) {
  const label = dimension.name.charAt(0).toUpperCase() + dimension.name.slice(1);
  const barColor =
    dimension.score >= 80 ? '#22c55e' : dimension.score >= 60 ? '#eab308' : '#ef4444';

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, color: '#94a3b8' }}>{dimension.score}%</span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 4,
          backgroundColor: '#1e293b',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${dimension.score}%`,
            backgroundColor: barColor,
            borderRadius: 4,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}

export default function QualityControlPanel({ dimensions, loading }: QualityControlPanelProps) {
  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
        Analyzing model quality...
      </div>
    );
  }

  const grade = computeOverallGrade(dimensions);
  const allIssues = dimensions
    .flatMap((d) => d.issues)
    .sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 };
      return order[a.severity] - order[b.severity];
    });

  return (
    <div>
      <h2 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600 }}>
        Mass Appraisal Quality Control
      </h2>

      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        {/* Overall grade */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: 120,
            height: 120,
            borderRadius: 12,
            border: `2px solid ${gradeColors[grade]}`,
            background: `${gradeColors[grade]}10`,
          }}
        >
          <div style={{ fontSize: 48, fontWeight: 800, color: gradeColors[grade] }}>{grade}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Overall Grade</div>
        </div>

        {/* Dimension bars */}
        <div style={{ flex: 1 }}>
          {dimensions.map((dim) => (
            <DimensionBar key={dim.name} dimension={dim} />
          ))}
        </div>
      </div>

      {/* Issue list */}
      {allIssues.length > 0 && (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            Issues ({allIssues.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {allIssues.map((issue) => (
              <div
                key={issue.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 6,
                  backgroundColor: '#0f172a',
                  border: `1px solid ${severityColors[issue.severity]}22`,
                }}
              >
                <span style={{ fontSize: 14 }}>{severityIcons[issue.severity]}</span>
                <span style={{ flex: 1, fontSize: 13 }}>{issue.message}</span>
                {issue.affectedRecords != null && (
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>
                    {issue.affectedRecords.toLocaleString()} records
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
