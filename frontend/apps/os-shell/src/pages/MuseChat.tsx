import React, { useEffect, useRef, useState } from 'react';
import { getSession } from '../auth/session';
import { useCompanionStore } from '../stores/companionStore';
import type { EditorMarker } from '../stores/companionStore';
import type { Property } from '../types/domain';
import { usePropertyStore } from '../stores/propertyStore';

// ============================================================================
// Design tokens — matches TerraFusion light warm theme
// Derived from computed values: --tf-surface 44 16% 97%, --tf-text 30 20% 8%
// --tf-border 38 18% 78%, --tf-muted 33 14% 44%, --tf-transcend-cyan-hs 192 58%
// ============================================================================

const C = {
  bg:           'hsl(44 16% 97%)',
  bgBubbleMuse: 'hsl(42 18% 92%)',
  bgBubbleUser: 'hsla(192, 58%, 42%, 0.08)',
  bgInput:      'hsl(44 18% 94%)',
  bgSendActive: 'hsl(192 58% 40%)',
  bgSendIdle:   'hsl(42 18% 88%)',
  bgSourceTag:  'hsl(42 16% 90%)',

  text:         'hsl(30 20% 8%)',
  textMuted:    'hsl(33 14% 44%)',
  textDim:      'hsl(33 10% 60%)',
  textUser:     'hsl(192 55% 28%)',
  textSend:     'hsl(44 16% 97%)',
  textSourceTag:'hsl(33 14% 50%)',
  textPlaceholder: 'hsl(33 10% 62%)',

  borderSubtle: 'hsl(38 18% 84%)',
  borderInput:  'hsl(38 18% 80%)',
  borderInputFocus: 'hsla(192, 58%, 42%, 0.5)',
  borderBubbleMuse: 'hsl(38 18% 86%)',
  borderBubbleUser: 'hsla(192, 58%, 42%, 0.18)',
  borderSourceTag:  'hsl(38 18% 84%)',

  cyan:         'hsl(192 58% 45%)',
  cyanGlow:     'hsla(192, 58%, 45%, 0.4)',
  amber:        'hsl(32 86% 50%)',
  amberGlow:    'hsla(32, 86%, 50%, 0.4)',
} as const;

// ============================================================================
// Types
// ============================================================================

interface MuseSource {
  type: string;
  reference: string;
}

interface ExplainApiResponse {
  explanation: string;
  sources: MuseSource[];
  confidence: number;
  traceId: string;
}

type MessageRole = 'user' | 'muse' | 'system';

interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  sources?: MuseSource[];
  confidence?: number;
  timestamp: Date;
}

interface ExplainContext {
  activeParcelId: string | null;
  activeSuite: string | null;
  activeTab: string | null;
  activeBranch: string | null;
  activeFile: string | null;
  buildStatus: string;
  editorMarkers: EditorMarker[];
}

// ============================================================================
// Helpers
// ============================================================================

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function buildWelcome(): ChatMessage {
  return {
    id: makeId(),
    role: 'muse',
    text: "Hello. I'm Muse — your AI assessor. Ask me anything about the current parcel, comparable sales, valuation methodology, or Washington statute.",
    timestamp: new Date(),
  };
}

export function buildParcelSummary(
  parcel: Property | null,
  activeParcelId: string | null
): Record<string, unknown> | undefined {
  if (!parcel || !activeParcelId || parcel.parcelId !== activeParcelId) return undefined;
  return {
    // Identity
    address: parcel.address,
    city: parcel.city,
    propertyType: parcel.propertyType,
    propertyUseCode: parcel.propertyUseCode,
    assessmentYear: parcel.assessmentYear,
    assessmentStatus: parcel.assessmentStatus,
    // Values
    totalAssessedValue: parcel.totalAssessedValue,
    landValue: parcel.landValue,
    improvementValue: parcel.improvementValue,
    marketValue: parcel.marketValue,
    taxableValue: parcel.taxableValue,
    // Physical
    yearBuilt: parcel.yearBuilt,
    buildingSquareFeet: parcel.buildingSquareFeet,
    landAcreage: parcel.landAcreage,
    // Sales
    lastSaleDate: parcel.lastSaleDate,
    lastSalePrice: parcel.lastSalePrice,
    // Geo — specialDistricts is string[] on the type; join before serialization
    // so the backend receives a plain string, not a JSON array
    neighborhood: parcel.neighborhood,
    zoning: parcel.zoning,
    taxDistrictName: parcel.taxDistrictName,
    specialDistricts: parcel.specialDistricts?.join(', '),
    latitude: parcel.latitude,
    longitude: parcel.longitude,
  };
}

/**
 * Build a stable signature from the current context so we can detect
 * meaningful changes without firing on every re-render.
 */
function buildContextSignature(ctx: ExplainContext): string {
  // Include error count (not full messages) so Muse re-greets when errors appear or clear.
  const errorCount = ctx.editorMarkers.filter((m) => m.severity === 'error').length;
  return [
    ctx.activeParcelId ?? '',
    ctx.activeSuite ?? '',
    ctx.activeTab ?? '',
    ctx.activeBranch ?? '',
    ctx.activeFile ?? '',
    ctx.buildStatus,
    String(errorCount),
  ].join('|');
}

export async function callExplain(
  query: string,
  countyId: string,
  actorId: string,
  context: ExplainContext,
  parcelSummary?: Record<string, unknown>
): Promise<ExplainApiResponse> {
  const body: Record<string, unknown> = {
    query,
    countyId,
    actorId,
    source: 'terra-pilot',
    context,
  };
  // Keep legacy parcelId at top level for backward compat with existing backend handler
  if (context.activeParcelId) body.parcelId = context.activeParcelId;
  if (parcelSummary) body.parcelSummary = parcelSummary;

  const res = await fetch('/api/pilot/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json() as Promise<ExplainApiResponse>;
}

// ============================================================================
// Message Bubble
// ============================================================================

const MuseBubble: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
  const isUser = msg.role === 'user';
  const isSystem = msg.role === 'system';

  if (isSystem) {
    return (
      <div
        style={{
          textAlign: 'center',
          fontSize: 11,
          color: C.textDim,
          padding: '4px 0',
          userSelect: 'none',
          letterSpacing: '0.03em',
        }}
      >
        {msg.text}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        gap: 4,
        marginBottom: 2,
      }}
    >
      <div
        style={{
          maxWidth: '86%',
          padding: '10px 13px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          fontSize: 13,
          lineHeight: 1.55,
          wordBreak: 'break-word',
          background: isUser ? C.bgBubbleUser : C.bgBubbleMuse,
          border: `1px solid ${isUser ? C.borderBubbleUser : C.borderBubbleMuse}`,
          color: isUser ? C.textUser : C.text,
        }}
      >
        {msg.text}
      </div>

      {!isUser && msg.sources && msg.sources.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: '86%' }}>
          {msg.sources.map((s, i) => (
            <span
              key={i}
              title={s.reference}
              style={{
                fontSize: 10,
                padding: '1px 7px',
                borderRadius: 4,
                background: C.bgSourceTag,
                border: `1px solid ${C.borderSourceTag}`,
                color: C.textSourceTag,
                letterSpacing: '0.02em',
                cursor: 'default',
                maxWidth: 150,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {s.type}: {s.reference}
            </span>
          ))}
        </div>
      )}

      <span
        style={{
          fontSize: 10,
          color: C.textDim,
          paddingLeft: isUser ? 0 : 2,
          paddingRight: isUser ? 2 : 0,
        }}
      >
        {formatTime(msg.timestamp)}
      </span>
    </div>
  );
};

// ============================================================================
// Thinking indicator
// ============================================================================

const ThinkingDots: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 8 }}>
    <div
      style={{
        padding: '10px 16px',
        borderRadius: '16px 16px 16px 4px',
        background: C.bgBubbleMuse,
        border: `1px solid ${C.borderBubbleMuse}`,
        display: 'flex',
        gap: 5,
        alignItems: 'center',
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: C.cyan,
            animation: `muse-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

export function MuseChat(): React.ReactElement {
  const {
    activeParcelId,
    activeSuite,
    activeTab,
    activeBranch,
    activeFile,
    buildStatus,
    editorMarkers,
  } = useCompanionStore();

  const activeParcel = usePropertyStore((s) => s.activeParcel);

  const session = getSession();
  const countyId = session?.countyId ?? 'benton';
  const actorId = session?.userId ?? 'operator';

  const [messages, setMessages] = useState(() => [buildWelcome()]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [offline, setOffline] = useState(false);

  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Signature guard: tracks the last context we auto-explained so we never
  // fire a proactive message for the same state twice.
  const lastExplainSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages, thinking]);

  // System notification when parcel context changes
  const prevParcelRef = useRef<string | null>(null);
  useEffect(() => {
    if (activeParcelId && activeParcelId !== prevParcelRef.current) {
      prevParcelRef.current = activeParcelId;
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: 'system' as MessageRole,
          text: `Context: parcel ${activeParcelId}`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [activeParcelId]);

  // ── Proactive awareness ───────────────────────────────────────────────────
  // Fires when meaningful context exists and the signature has changed.
  // Allowed triggers: first mount with real context, parcel/suite/branch/build change.
  // Not allowed: unchanged context re-renders, duplicate messages for same state.
  useEffect(() => {
    const ctx: ExplainContext = {
      activeParcelId,
      activeSuite,
      activeTab,
      activeBranch,
      activeFile,
      buildStatus,
      editorMarkers,
    };

    // Need at least one meaningful signal to proactively greet
    const hasMeaningfulContext = !!(activeParcelId || activeSuite || activeBranch);
    if (!hasMeaningfulContext) return;

    const sig = buildContextSignature(ctx);
    if (sig === lastExplainSignatureRef.current) return;

    // Build change only triggers when Pilot is already open — don't spam on every hot reload.
    // For parcel/suite changes, always fire.
    if (thinking) return;

    lastExplainSignatureRef.current = sig;

    let cancelled = false;
    setThinking(true);

    const question = activeParcelId
      ? 'What should I know about this parcel right now?'
      : activeBranch
        ? `I just switched to branch "${activeBranch}". What's the current development context?`
        : `I'm now in the ${activeSuite} suite. What's relevant here?`;

    callExplain(question, countyId, actorId, ctx, buildParcelSummary(activeParcel, activeParcelId))
      .then((data) => {
        if (cancelled) return;
        setMessages((prev) => [
          ...prev,
          {
            id: makeId(),
            role: 'muse',
            text: data.explanation,
            sources: data.sources ?? [],
            confidence: data.confidence,
            timestamp: new Date(),
          },
        ]);
      })
      .catch(() => { /* silent — backend may not be running */ })
      .finally(() => { if (!cancelled) setThinking(false); });

    return () => { cancelled = true; };
  // Deliberately broad dep array — we want to re-evaluate whenever any context field changes.
  // The signature ref is the actual dedup guard.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeParcel, activeParcelId, activeSuite, activeTab, activeBranch, activeFile, buildStatus]);

  // ── Manual send ───────────────────────────────────────────────────────────
  const send = async () => {
    const query = input.trim();
    if (!query || thinking) return;

    setInput('');
    setOffline(false);

    const userMsg: ChatMessage = { id: makeId(), role: 'user', text: query, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setThinking(true);

    const ctx: ExplainContext = {
      activeParcelId,
      activeSuite,
      activeTab,
      activeBranch,
      activeFile,
      buildStatus,
      editorMarkers,
    };

    try {
      const data = await callExplain(query, countyId, actorId, ctx, buildParcelSummary(activeParcel, activeParcelId));
      const museMsg: ChatMessage = {
        id: makeId(),
        role: 'muse',
        text: data.explanation,
        sources: data.sources ?? [],
        confidence: data.confidence,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, museMsg]);
    } catch {
      setOffline(true);
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: 'muse',
          text: 'Muse is unavailable. The AI service is not reachable right now.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  // ── Context label (header subtitle) ──────────────────────────────────────
  const contextLabel = (() => {
    if (activeParcelId) return `Parcel ${activeParcelId}`;
    if (activeSuite) return `Suite: ${activeSuite}`;
    if (activeBranch) return `Branch: ${activeBranch}`;
    return 'No context';
  })();

  return (
    <>
      <style>{`
        @keyframes muse-pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.85); }
          40% { opacity: 1; transform: scale(1); }
        }
        .muse-input::placeholder { color: ${C.textPlaceholder}; }
      `}</style>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          background: C.bg,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 16px 10px',
            borderBottom: `1px solid ${C.borderSubtle}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              flexShrink: 0,
              background: offline ? C.amber : C.cyan,
              boxShadow: `0 0 6px ${offline ? C.amberGlow : C.cyanGlow}`,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: C.text,
                lineHeight: 1.2,
              }}
            >
              MUSE
            </div>
            <div
              style={{
                fontSize: 10,
                color: C.textMuted,
                marginTop: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {contextLabel}
            </div>
          </div>
          {buildStatus === 'error' && (
            <div
              title="Build error detected"
              style={{
                fontSize: 9,
                letterSpacing: '0.06em',
                color: C.amber,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              BUILD ERR
            </div>
          )}
        </div>

        {/* Thread */}
        <div
          ref={threadRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 14px 6px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            scrollbarWidth: 'thin',
            scrollbarColor: `${C.borderSubtle} transparent`,
          }}
        >
          {messages.map((msg) => (
            <MuseBubble key={msg.id} msg={msg} />
          ))}
          {thinking && <ThinkingDots />}
        </div>

        {/* Input bar */}
        <div
          style={{
            padding: '10px 12px',
            borderTop: `1px solid ${C.borderSubtle}`,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <textarea
            ref={inputRef}
            className="muse-input"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask Muse..."
            rows={1}
            disabled={thinking}
            style={{
              flex: 1,
              resize: 'none',
              border: `1px solid ${C.borderInput}`,
              borderRadius: 10,
              background: C.bgInput,
              color: C.text,
              fontSize: 13,
              padding: '8px 11px',
              outline: 'none',
              lineHeight: 1.5,
              fontFamily: 'inherit',
              overflowY: 'hidden',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => { e.target.style.borderColor = C.borderInputFocus; }}
            onBlur={(e) => { e.target.style.borderColor = C.borderInput; }}
          />
          <button
            onClick={() => void send()}
            disabled={!input.trim() || thinking}
            aria-label="Send"
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              border: 'none',
              flexShrink: 0,
              cursor: input.trim() && !thinking ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: input.trim() && !thinking ? C.bgSendActive : C.bgSendIdle,
              transition: 'background 0.15s',
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke={input.trim() && !thinking ? C.textSend : C.textDim}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

export default MuseChat;
