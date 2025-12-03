/**
 * WorkspaceHealthHUD – Universal health strip for any workspace.
 *
 * A slim, reusable bar that shows:
 * - TerraSphere (workspace health indicator)
 * - Status chip
 * - Quick commands (via existing command system)
 *
 * All neutral, spine-compliant. Drop into any workspace body.
 *
 * @see docs/WORKSPACE_EXPERIENCE_V1.md Section 3.1
 */
import React, { useMemo } from 'react';
import { WorkspaceTerraSphere } from '../os/ui/WorkspaceTerraSphere';
import { resolveOSObjectComponent } from '../catalog/osObjects';
import { useWorkspaceCommands } from '../core/command/useWorkspaceCommands';
import { useOmniIntent } from '../core/state/OmniIntentContext';

const WorkspaceStatusChip = resolveOSObjectComponent('workspace_status_chip');

export interface WorkspaceHealthHUDProps {
  workspaceId: string;
  maxQuickCommands?: number;
  testId?: string;
}

export const WorkspaceHealthHUD: React.FC<WorkspaceHealthHUDProps> = ({
  workspaceId,
  maxQuickCommands = 3,
  testId,
}) => {
  const { commands, loading } = useWorkspaceCommands(workspaceId);
  const { setIntent } = useOmniIntent();

  const quickCommands = useMemo(() => {
    if (loading) return [];
    // Neutral heuristic: prefer commands in "Health" category, then anything
    const health = commands.filter((c) => c.category?.toLowerCase() === 'health');
    const remaining = commands.filter((c) => c.category?.toLowerCase() !== 'health');
    return [...health, ...remaining].slice(0, maxQuickCommands);
  }, [commands, loading, maxQuickCommands]);

  const handleCommandClick = (cmdId: string, label: string) => {
    setIntent('workspace_command_invoked', {
      workspaceId,
      commandId: cmdId,
      label,
    });
  };

  return (
    <div
      data-testid={testId ?? 'workspace-health-hud'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 10px',
        borderRadius: 999,
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(20,20,20,0.45)',
        backdropFilter: 'blur(12px) saturate(140%)',
        WebkitBackdropFilter: 'blur(12px) saturate(140%)',
      }}
    >
      {/* Left: TerraSphere + label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <WorkspaceTerraSphere
          workspaceId={workspaceId}
          size="small"
          testId={`${testId ?? 'workspace-health-hud'}-sphere`}
        />
        <span
          style={{
            fontSize: 12,
            opacity: 0.9,
          }}
        >
          Workspace health
        </span>
      </div>

      {/* Middle: status chip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {WorkspaceStatusChip && <WorkspaceStatusChip workspaceId={workspaceId} />}
      </div>

      {/* Right: quick commands */}
      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {loading ? (
          <span
            data-testid="workspace-health-hud-loading"
            style={{
              fontSize: 11,
              opacity: 0.7,
            }}
          >
            Loading commands…
          </span>
        ) : quickCommands.length === 0 ? (
          <span
            data-testid="workspace-health-hud-empty"
            style={{
              fontSize: 11,
              opacity: 0.7,
            }}
          >
            No quick actions
          </span>
        ) : (
          quickCommands.map((cmd) => (
            <button
              key={cmd.id}
              type="button"
              data-testid="workspace-health-hud-command"
              onClick={() => handleCommandClick(cmd.id, cmd.label)}
              style={{
                padding: '2px 8px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(0,0,0,0.35)',
                fontSize: 11,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                color: 'inherit',
              }}
            >
              {cmd.label}
            </button>
          ))
        )}
      </div>
    </div>
  );
};
