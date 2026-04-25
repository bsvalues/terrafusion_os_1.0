import React from 'react';
import { useAtlasLiveStore } from '@/stores/atlasLiveStore';
import type { SelectionTool } from '../types/atlasLive.types';

interface ToolButtonProps {
  label: string;
  icon: string;
  tool: SelectionTool;
  title: string;
  activeTool: SelectionTool;
  onClick: () => void;
}

function ToolButton({ label, icon, tool, title, activeTool, onClick }: ToolButtonProps) {
  const isActive = activeTool === tool;
  return (
    <button
      onClick={onClick}
      title={title}
      aria-pressed={isActive}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        border: `1px solid ${isActive ? '#3b82f6' : 'rgba(255,255,255,0.12)'}`,
        borderRadius: 6,
        background: isActive ? '#3b82f6' : 'rgba(10,14,26,0.85)',
        color: isActive ? '#fff' : 'rgba(255,255,255,0.75)',
        fontSize: 12,
        fontWeight: isActive ? 700 : 400,
        cursor: 'pointer',
        backdropFilter: 'blur(8px)',
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

interface AtlasToolbarProps {
  onPublish?: () => void;
}

export function AtlasToolbar({ onPublish }: AtlasToolbarProps) {
  const { activeTool, setActiveTool, activeOverlays } = useAtlasLiveStore();

  const toggle = (tool: SelectionTool) => {
    setActiveTool(activeTool === tool ? 'none' : tool);
  };

  const overlayLabel = activeOverlays.length > 0
    ? `${activeOverlays[activeOverlays.length - 1].type.replace('projection:', '').replace('-', ' ')}`
    : 'No overlay';

  return (
    <div
      data-testid="atlas-toolbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        background: 'rgba(10,14,26,0.72)',
        backdropFilter: 'blur(12px)',
        borderRadius: 10,
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      <ToolButton
        label="Lasso"
        icon="⬡"
        tool="lasso"
        title="Draw a polygon to select parcels"
        activeTool={activeTool}
        onClick={() => toggle('lasso')}
      />
      <ToolButton
        label="Click-Select"
        icon="◎"
        tool="click"
        title="Click parcels to select them individually"
        activeTool={activeTool}
        onClick={() => toggle('click')}
      />
      <ToolButton
        label="Box"
        icon="▣"
        tool="box"
        title="Drag a box to select parcels"
        activeTool={activeTool}
        onClick={() => toggle('box')}
      />

      <div
        style={{
          padding: '4px 10px',
          borderRadius: 6,
          background: 'rgba(255,255,255,0.06)',
          fontSize: 11,
          color: 'rgba(255,255,255,0.5)',
          border: '1px solid rgba(255,255,255,0.08)',
          maxWidth: 200,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {overlayLabel}
      </div>

      <div style={{ flex: 1 }} />

      <button
        onClick={onPublish}
        title="Publish neighborhood candidate to Atlas as PublishedSpatialArtifact"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 14px',
          border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: 6,
          background: 'rgba(34,197,94,0.15)',
          color: '#22c55e',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Publish →
      </button>
    </div>
  );
}
