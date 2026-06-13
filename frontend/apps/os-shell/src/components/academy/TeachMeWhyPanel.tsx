/**
 * Teach Me Why — reusable institutional-intelligence side panel
 * ====================================================================
 * The core Academy interaction, extracted as a shared component so it
 * can be opened from any major TerraFusion surface (Academy today;
 * Home, Forge, Atlas, Dossier, Notice, Trace, Workbench next).
 *
 * Usage:
 *   1. Wrap a subtree in <TeachMeWhyProvider>.
 *   2. Anywhere inside, call const { openTeach } = useTeachMeWhy();
 *      then openTeach('cov-cycle') from a "Teach me why" button.
 *
 * The panel explains: why it matters · evidence required · common
 * mistakes · prior county example · related playbook · approved public
 * language · certification tie-in — plus the "Turn this into a lesson"
 * moat that drafts a county memory record from live reasoning.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Sparkles,
  ClipboardList,
  XCircle,
  History,
  BookMarked,
  Quote,
  BadgeCheck,
  CheckCircle2,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { TEACH_TOPICS, type TeachTopic, type TeachTopicId } from './teachMeWhyContent';

interface TeachMeWhyContextValue {
  /** Open the Teach Me Why panel for a given topic. */
  openTeach: (topicId: TeachTopicId) => void;
  /** Close the panel. */
  close: () => void;
}

const TeachMeWhyContext = createContext<TeachMeWhyContextValue | null>(null);

export function useTeachMeWhy(): TeachMeWhyContextValue {
  const ctx = useContext(TeachMeWhyContext);
  if (!ctx) {
    throw new Error('useTeachMeWhy must be used within a <TeachMeWhyProvider>');
  }
  return ctx;
}

export function TeachMeWhyProvider({ children }: { children: ReactNode }) {
  const [topicId, setTopicId] = useState<TeachTopicId | null>(null);
  const openTeach = useCallback((id: TeachTopicId) => setTopicId(id), []);
  const close = useCallback(() => setTopicId(null), []);
  const value = useMemo<TeachMeWhyContextValue>(() => ({ openTeach, close }), [openTeach, close]);

  return (
    <TeachMeWhyContext.Provider value={value}>
      {children}
      <TeachMeWhyPanel topicId={topicId} onClose={close} />
    </TeachMeWhyContext.Provider>
  );
}

interface TeachMeWhyPanelProps {
  topicId: TeachTopicId | null;
  onClose: () => void;
}

const eyebrow = 'text-[10px] font-bold uppercase tracking-[0.16em]';

/**
 * Controlled panel. Exported for callers that prefer to own the open
 * state directly instead of using the provider/hook.
 */
export function TeachMeWhyPanel({ topicId, onClose }: TeachMeWhyPanelProps) {
  // Derive the active topic synchronously so the SheetTitle is always
  // present while the panel is open (Radix a11y requirement). `retained`
  // keeps content rendered through the slide-out animation after the
  // topic is cleared to null.
  const activeTopic: TeachTopic | null = topicId ? TEACH_TOPICS[topicId] : null;
  const [retained, setRetained] = useState<TeachTopic | null>(null);
  const [captured, setCaptured] = useState(false);
  const shown = activeTopic ?? retained;

  useEffect(() => {
    if (activeTopic) {
      setRetained(activeTopic);
      setCaptured(false);
    }
  }, [activeTopic]);

  const handleCapture = useCallback(() => {
    // Honesty: this is a local, in-session draft affordance only. There is no
    // API / store / trace write yet, so we do not mint a record id or claim
    // the lesson was queued for review.
    setCaptured(true);
  }, []);

  return (
    <Sheet
      open={topicId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side='right'
        className='flex w-full flex-col gap-0 border-l p-0 sm:max-w-[540px]'
        style={{ background: 'hsl(var(--tf-surface))', borderColor: 'hsl(var(--tf-border))' }}
        data-testid='teach-me-why-panel'
      >
        {shown && (
          <>
            {/* Header */}
            <div
              className='shrink-0 px-6 pb-4 pt-5'
              style={{ borderBottom: '1px solid hsl(var(--tf-border))' }}
            >
              <div
                className={`flex items-center gap-2 ${eyebrow}`}
                style={{ color: 'hsl(var(--tf-accent))' }}
              >
                <Sparkles size={13} /> Teach Me Why
              </div>
              <SheetTitle
                className='mt-3 pr-8 text-xl font-semibold'
                style={{ color: 'hsl(var(--tf-fg))' }}
              >
                {shown.title}
              </SheetTitle>
              <SheetDescription className='mt-1 text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                {shown.context}
              </SheetDescription>
            </div>

            {/* Body */}
            <div className='min-h-0 flex-1 overflow-y-auto px-6'>
              <Block icon={<Sparkles size={13} />} label='Why this matters'>
                <p className='text-sm leading-relaxed' style={{ color: 'hsl(var(--tf-fg))' }}>
                  {shown.why}
                </p>
              </Block>

              <Block icon={<ClipboardList size={13} />} label='Evidence required'>
                <BulletList items={shown.evidence} />
              </Block>

              <Block icon={<XCircle size={13} />} label='Common mistakes'>
                <ul className='space-y-2'>
                  {shown.mistakes.map((m) => (
                    <li
                      key={m}
                      className='flex gap-2 text-[13px]'
                      style={{ color: 'hsl(var(--tf-muted))' }}
                    >
                      <span style={{ color: 'hsl(var(--tf-error))' }}>✕</span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </Block>

              <Block icon={<History size={13} />} label='Prior county example'>
                <div
                  className='rounded-lg border p-3 text-[13px] leading-relaxed'
                  style={{
                    borderColor: 'hsl(var(--tf-border))',
                    background: 'hsl(var(--tf-surface-2))',
                    color: 'hsl(var(--tf-muted))',
                  }}
                >
                  <span
                    className={`mb-1.5 block ${eyebrow}`}
                    style={{ color: 'hsl(var(--tf-accent))' }}
                  >
                    Benton County · institutional memory
                  </span>
                  {shown.example}
                </div>
              </Block>

              <Block icon={<BookMarked size={13} />} label='Related playbook'>
                <span
                  className='inline-flex rounded-full border px-3 py-1 text-xs font-medium'
                  style={{
                    borderColor: 'hsl(var(--tf-accent) / 0.4)',
                    color: 'hsl(var(--tf-accent))',
                  }}
                >
                  {shown.playbook}
                </span>
              </Block>

              <Block icon={<Quote size={13} />} label='Approved public language'>
                <div
                  className='rounded-r-lg py-3 pl-4 pr-3 text-sm leading-relaxed'
                  style={{
                    borderLeft: '3px solid hsl(var(--tf-success))',
                    background: 'hsl(var(--tf-success) / 0.08)',
                    color: 'hsl(var(--tf-fg))',
                  }}
                >
                  {shown.language}
                </div>
              </Block>

              <div className='pb-5'>
                <Block icon={<BadgeCheck size={13} />} label='Certification tie-in' last>
                  <div
                    className='flex items-center gap-3 rounded-lg border p-3'
                    style={{
                      borderColor: 'hsl(var(--tf-border))',
                      background: 'hsl(var(--tf-surface-2))',
                    }}
                  >
                    <div
                      className='grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold'
                      style={{ background: 'hsl(var(--tf-accent))', color: 'hsl(var(--tf-surface))' }}
                    >
                      {shown.cert.code}
                    </div>
                    <div>
                      <div className='text-sm font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>
                        {shown.cert.name}
                      </div>
                      <div className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                        {shown.cert.note}
                      </div>
                    </div>
                  </div>
                </Block>
              </div>
            </div>

            {/* Moat: Turn this into a lesson */}
            <button
              type='button'
              onClick={handleCapture}
              disabled={captured}
              data-testid='teach-me-why-capture'
              className='mx-4 mb-3 flex shrink-0 items-center gap-3 rounded-lg border p-3 text-left transition-transform disabled:cursor-default'
              style={{
                borderColor: 'hsl(var(--tf-success) / 0.45)',
                background: 'hsl(var(--tf-success) / 0.08)',
              }}
            >
              <div
                className='grid h-9 w-9 shrink-0 place-items-center rounded-lg'
                style={{ background: 'hsl(var(--tf-success))', color: 'hsl(var(--tf-surface))' }}
              >
                {captured ? <CheckCircle2 size={17} /> : <Sparkles size={17} />}
              </div>
              <div className='min-w-0 flex-1'>
                <div className='text-sm font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>
                  {captured ? 'Lesson draft started' : 'Turn this into a lesson'}
                </div>
                <div className='text-[11px]' style={{ color: 'hsl(var(--tf-muted))' }}>
                  {captured
                    ? 'Held locally for this session only — saving to a governed county memory record is not wired up yet.'
                    : 'Capture this reasoning toward a county memory record — so the next person inherits it.'}
                </div>
              </div>
              <span
                className={eyebrow}
                style={{ color: 'hsl(var(--tf-success))', whiteSpace: 'nowrap' }}
              >
                {captured ? 'Draft · local' : 'Capture →'}
              </span>
            </button>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Block({
  icon,
  label,
  children,
  last,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className='py-4'
      style={last ? undefined : { borderBottom: '1px solid hsl(var(--tf-border) / 0.6)' }}
    >
      <div
        className={`mb-2.5 flex items-center gap-2 ${eyebrow}`}
        style={{ color: 'hsl(var(--tf-muted))' }}
      >
        <span
          className='grid h-5 w-5 place-items-center rounded'
          style={{ background: 'hsl(var(--tf-accent) / 0.14)', color: 'hsl(var(--tf-accent))' }}
        >
          {icon}
        </span>
        {label}
      </div>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className='space-y-2'>
      {items.map((item) => (
        <li key={item} className='flex gap-2 text-[13px]' style={{ color: 'hsl(var(--tf-muted))' }}>
          <span style={{ color: 'hsl(var(--tf-accent))' }}>—</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
