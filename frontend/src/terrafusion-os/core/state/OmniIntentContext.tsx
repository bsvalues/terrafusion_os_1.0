import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { recordActivityFromIntent, type IntentPayload } from '../activity';
import type { WorkspaceId } from './WorkspaceContext';

type WorkspacePanelKey = WorkspaceId | 'parcels' | 'levyWorkbench';

export interface ContextPanel {
  id: string;
  title: string;
  type: 'tool' | 'data' | 'action';
  relevanceScore: number; // 0–1
  subtitle?: string;
}

interface IntentGravityWell {
  activePanels: ContextPanel[];
}

/**
 * Right-rail panel identifiers.
 * - workspace-health: Health timeline panel
 * - workspace-activity-detail: Activity detail panel
 */
export type RightRailPanelId = 'workspace-health' | 'workspace-activity-detail' | null;

export interface RightRailState {
  panel: RightRailPanelId;
  props: {
    workspaceId?: string;
    activityId?: string;
    focusActivityId?: string;
    type?: string;
  };
}

interface OmniIntentState {
  currentIntent: string | null;
  gravityWell: IntentGravityWell;
  rightRail: RightRailState;
  setIntent: (intent: string, contextData?: any) => void;
  emitIntent: (intent: string, contextData?: any) => void;
  clearIntent: () => void;
  setRightRail: (state: RightRailState) => void;
  closeRightRail: () => void;
}

const OmniIntentContext = createContext<OmniIntentState | undefined>(undefined);

const DEFAULT_RIGHT_RAIL: RightRailState = { panel: null, props: {} };

export const OmniIntentProvider = ({ children }: { children: ReactNode }) => {
  const [currentIntent, setCurrentIntent] = useState<string | null>(null);
  const [gravityWell, setGravityWell] = useState<IntentGravityWell>({
    activePanels: [],
  });
  const [rightRail, setRightRailState] = useState<RightRailState>(DEFAULT_RIGHT_RAIL);

  const setRightRail = useCallback((state: RightRailState) => {
    setRightRailState(state);
  }, []);

  const closeRightRail = useCallback(() => {
    setRightRailState(DEFAULT_RIGHT_RAIL);
  }, []);

  const workspacePanels = useMemo<Record<WorkspacePanelKey, ContextPanel[]>>(
    () => ({
      home: [
        {
          id: 'home-system-heartbeat',
          title: 'Government Heartbeat',
          subtitle: 'Systems nominal • 99.9% availability',
          type: 'data',
          relevanceScore: 0.9,
        },
        {
          id: 'home-recent-missions',
          title: 'Recent Missions',
          subtitle: 'Review last 3 executive actions',
          type: 'action',
          relevanceScore: 0.78,
        },
        {
          id: 'home-expert-calls',
          title: 'Expert Channels',
          subtitle: 'Route to levy, parcels, or AI ops',
          type: 'tool',
          relevanceScore: 0.74,
        },
      ],
      parcels: [
        {
          id: 'parcel-summary-panel',
          title: 'Parcel Summary',
          subtitle: 'Parcel dossier + jurisdiction context',
          type: 'data',
          relevanceScore: 0.96,
        },
        {
          id: 'parcel-nearby-sales',
          title: 'Nearby Sales Radar',
          subtitle: 'Within 1.5mi • 12 comps waiting',
          type: 'data',
          relevanceScore: 0.88,
        },
        {
          id: 'parcel-trend',
          title: 'Assessment Trend Sparkline',
          subtitle: 'COD guardrails + drift alert',
          type: 'tool',
          relevanceScore: 0.8,
        },
      ],
      propertyWorkbench: [
        {
          id: 'pw-valuation-queue',
          title: 'Valuation Queue',
          subtitle: '19 properties staged for review',
          type: 'data',
          relevanceScore: 0.92,
        },
        {
          id: 'pw-field-review',
          title: 'Field Review Dispatch',
          subtitle: 'Assign appraisers with AI assist',
          type: 'action',
          relevanceScore: 0.87,
        },
        {
          id: 'pw-comps-monitor',
          title: 'Comparable Monitor',
          subtitle: 'Fresh models ready • COD 11.4%',
          type: 'tool',
          relevanceScore: 0.82,
        },
      ],
      levyWorkbench: [
        {
          id: 'levy-forecast',
          title: 'Forecast Models',
          subtitle: 'Next levy scenario sandboxes',
          type: 'data',
          relevanceScore: 0.94,
        },
        {
          id: 'levy-scenarios',
          title: 'Scenario Drafts',
          subtitle: '3 drafts awaiting fiscal approval',
          type: 'tool',
          relevanceScore: 0.86,
        },
        {
          id: 'levy-risk',
          title: 'Risk Indicators',
          subtitle: 'Bond coverage • Voter sentiment',
          type: 'data',
          relevanceScore: 0.8,
        },
      ],
      levyStudio: [
        {
          id: 'levyStudio-forecast',
          title: 'Forecast Models',
          subtitle: 'Scenario libraries synced',
          type: 'data',
          relevanceScore: 0.9,
        },
        {
          id: 'levyStudio-drafts',
          title: 'Scenario Drafts',
          subtitle: 'Draft, publish, and audit',
          type: 'tool',
          relevanceScore: 0.84,
        },
        {
          id: 'levyStudio-risk',
          title: 'Risk Perimeter',
          subtitle: 'AI monitors compliance drift',
          type: 'data',
          relevanceScore: 0.78,
        },
      ],
      quantumLab: [
        {
          id: 'quantum-tuning',
          title: 'L9 Model Tuning Sliders',
          subtitle: 'Beam coherence + consciousness gain',
          type: 'tool',
          relevanceScore: 1,
        },
        {
          id: 'quantum-drift',
          title: 'Model Drift Predictor',
          subtitle: 'IAAO guardrails • Drift horizon 72h',
          type: 'data',
          relevanceScore: 0.9,
        },
        {
          id: 'quantum-explain',
          title: 'Explain Model State',
          subtitle: 'Claude Supreme narrative ready',
          type: 'action',
          relevanceScore: 0.85,
        },
      ],
      gisWorkspace: [
        {
          id: 'gis-map',
          title: 'Geospatial Layers',
          subtitle: 'Floodplain + levy buffers engaged',
          type: 'data',
          relevanceScore: 0.9,
        },
        {
          id: 'gis-alerts',
          title: 'Spatial Alerts',
          subtitle: '3 anomalies flagged for review',
          type: 'action',
          relevanceScore: 0.82,
        },
        {
          id: 'gis-export',
          title: 'Map Export Tools',
          subtitle: 'Parcel grids • FEMA overlays',
          type: 'tool',
          relevanceScore: 0.78,
        },
      ],
    }),
    []
  );

  const buildGenericPanels = useCallback((contextData?: any): ContextPanel[] => {
    const summary = contextData?.response?.message ?? 'Awaiting TerraCommand response';
    const nextStep =
      contextData?.response?.suggestedNextStep ?? 'Let TerraCommand suggest the next action';
    const recent = contextData?.response?.recentContext ?? 'Pulling recent workspace state…';

    return [
      {
        id: 'command-summary',
        title: 'Command Summary',
        subtitle: summary,
        type: 'data',
        relevanceScore: 0.95,
      },
      {
        id: 'recent-work-context',
        title: 'Recent Work Context',
        subtitle: recent,
        type: 'data',
        relevanceScore: 0.8,
      },
      {
        id: 'predicted-next-step',
        title: 'Predicted Next Step',
        subtitle: nextStep,
        type: 'action',
        relevanceScore: 0.75,
      },
    ];
  }, []);

  const resolveIntentToPanels = useCallback(
    (intent: string, contextData?: any): ContextPanel[] => {
      if (intent === 'object_selected' && contextData?.objectId) {
        const id = contextData.objectId as string;
        return [
          {
            id: 'object-summary',
            title: `Signal Summary • ${id}`,
            subtitle: 'Attributes, relationships, and last activity',
            type: 'data',
            relevanceScore: 0.95,
          },
          {
            id: 'object-links',
            title: 'Linked Systems',
            subtitle: 'Nearest work surfaces + dependent modules',
            type: 'tool',
            relevanceScore: 0.82,
          },
          {
            id: 'object-history',
            title: 'Timeline & Drift',
            subtitle: 'Change log • signal drift predictions',
            type: 'data',
            relevanceScore: 0.76,
          },
        ];
      }

      if (intent === 'workspace_status_selected' && contextData?.workspaceId) {
        const wsId = contextData.workspaceId as string;
        return [
          {
            id: 'ws-status-summary',
            title: `Workspace Health • ${wsId}`,
            subtitle: 'Current status, uptime, and SLA',
            type: 'data',
            relevanceScore: 0.94,
          },
          {
            id: 'ws-status-incidents',
            title: 'Recent Incidents',
            subtitle: 'Open alerts and resolved issues',
            type: 'data',
            relevanceScore: 0.85,
          },
          {
            id: 'ws-status-actions',
            title: 'Quick Actions',
            subtitle: 'Restart, inspect logs, escalate',
            type: 'action',
            relevanceScore: 0.78,
          },
        ];
      }

      if (intent === 'workspace_activity_selected' && contextData?.activityId) {
        const activityId = contextData.activityId as string;
        const activityType = (contextData.type as string) || 'info';
        const wsId = (contextData.workspaceId as string) || 'unknown';
        return [
          {
            id: 'activity-detail',
            title: `Activity Detail • ${activityId}`,
            subtitle: `Type: ${activityType} • Workspace: ${wsId}`,
            type: 'data',
            relevanceScore: 0.96,
          },
          {
            id: 'activity-timeline',
            title: 'Activity Timeline',
            subtitle: 'Related events and causation chain',
            type: 'data',
            relevanceScore: 0.84,
          },
          {
            id: 'activity-actions',
            title: 'Response Actions',
            subtitle: 'Acknowledge, investigate, escalate',
            type: 'action',
            relevanceScore: 0.76,
          },
        ];
      }

      // workspace_status_changed: log-only, no UI panels (activity logged via bridge)
      if (intent === 'workspace_status_changed') {
        return [];
      }

      // workspace_command_invoked: minimal panel confirming command execution
      if (intent === 'workspace_command_invoked' && contextData?.commandId) {
        const commandId = contextData.commandId as string;
        const label = (contextData.label as string) || commandId;
        return [
          {
            id: 'command-ack',
            title: `Command Executed • ${label}`,
            subtitle: `Invoked via OS Command Palette`,
            type: 'action',
            relevanceScore: 0.9,
          },
        ];
      }

      if (intent === 'terra_command' || intent === 'terra_command_generic') {
        const workspaceId = contextData?.response?.workspaceId as WorkspacePanelKey | undefined;
        if (workspaceId && workspacePanels[workspaceId]) {
          return workspacePanels[workspaceId];
        }
        return buildGenericPanels(contextData);
      }

      return [];
    },
    [buildGenericPanels, workspacePanels]
  );

  const setIntent = useCallback(
    (intent: string, contextData?: any) => {
      setCurrentIntent(intent);
      const panels = resolveIntentToPanels(intent, contextData);
      setGravityWell({ activePanels: panels });

      // Open right-rail for specific intents
      const workspaceId =
        (contextData?.workspaceId as string) ||
        (contextData?.response?.workspaceId as string) ||
        'home';

      // Handle command palette invocation intents
      if (intent === 'workspace_command_invoked' && contextData?.commandId) {
        const commandId = contextData.commandId as string;

        // Route known commands to appropriate panels
        if (commandId === 'open-health-timeline') {
          setRightRailState({
            panel: 'workspace-health',
            props: { workspaceId },
          });
        } else if (commandId === 'open-activity-feed') {
          setRightRailState({
            panel: 'workspace-activity-detail',
            props: { workspaceId },
          });
        }
        // 'refresh-workspace' and unknown commands: logged via activity bridge, no panel
      }

      // Health-related intents open the health timeline panel
      if (intent === 'workspace_status_selected' || intent === 'workspace_status_changed') {
        setRightRailState({
          panel: 'workspace-health',
          props: { workspaceId },
        });
      } else if (intent === 'workspace_activity_selected' && contextData?.activityId) {
        setRightRailState({
          panel: 'workspace-activity-detail',
          props: {
            workspaceId,
            activityId: contextData.activityId as string,
            type: contextData.type as string,
          },
        });
      }

      // Bridge: record activity for audit trail
      const intentPayload: IntentPayload = {
        type: intent,
        objectType: contextData?.objectType,
        objectId: contextData?.objectId ?? contextData?.activityId,
        workspaceId,
        value: contextData?.value ?? contextData?.response?.message,
        metadata: contextData,
      };

      // Fire-and-forget – don't block intent resolution
      recordActivityFromIntent(workspaceId, intentPayload).catch((err) => {
        console.warn('[OmniIntent] Activity recording failed:', err);
      });
    },
    [resolveIntentToPanels]
  );

  const clearIntent = useCallback(() => {
    setCurrentIntent(null);
    setGravityWell({ activePanels: [] });
  }, []);

  return (
    <OmniIntentContext.Provider
      value={{
        currentIntent,
        gravityWell,
        rightRail,
        setIntent,
        emitIntent: setIntent,
        clearIntent,
        setRightRail,
        closeRightRail,
      }}
    >
      {children}
    </OmniIntentContext.Provider>
  );
};

export const useOmniIntent = (): OmniIntentState => {
  const ctx = useContext(OmniIntentContext);
  if (!ctx) {
    throw new Error('useOmniIntent must be used within OmniIntentProvider');
  }
  return ctx;
};
