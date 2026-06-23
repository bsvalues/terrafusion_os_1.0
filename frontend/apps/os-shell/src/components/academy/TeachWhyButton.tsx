/**
 * Teach Why Button — the reusable "Teach me why" trigger.
 * ====================================================================
 * A small affordance any surface can drop in to open the shared
 * <TeachMeWhyPanel> for a doctrine/evidence topic. Must be rendered
 * inside a <TeachMeWhyProvider>.
 *
 *   <TeachMeWhyProvider>
 *     ...
 *     <TeachWhyButton topic="boe-packet" />
 *   </TeachMeWhyProvider>
 */

import { Sparkles } from 'lucide-react';
import { useTeachMeWhy } from './TeachMeWhyPanel';
import type { TeachTopicId } from './teachMeWhyContent';

interface TeachWhyButtonProps {
  topic: TeachTopicId;
  label?: string;
  className?: string;
}

export function TeachWhyButton({ topic, label = 'Teach me why', className }: TeachWhyButtonProps) {
  const { openTeach } = useTeachMeWhy();
  return (
    <button
      type='button'
      onClick={() => openTeach(topic)}
      data-testid={`teach-why-${topic}`}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${className ?? ''}`}
      style={{
        borderColor: 'hsl(var(--tf-accent) / 0.4)',
        color: 'hsl(var(--tf-accent))',
        background: 'hsl(var(--tf-accent) / 0.08)',
      }}
    >
      <Sparkles size={11} /> {label}
    </button>
  );
}
