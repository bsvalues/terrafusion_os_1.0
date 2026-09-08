import React, { useState } from 'react';

interface Props { content: string; disabled: boolean; onDirty: (dirty: boolean) => void; onSave: (content: string) => void }
export default function PacketNarrativeEditor({ content, disabled, onDirty, onSave }: Props) {
  const [draft, setDraft] = useState(content);
  return <div className='space-y-2'>
    <label className='block'>Packet narrative
      <textarea aria-label='Packet narrative' className='mt-2 w-full min-h-32 rounded-md border border-border bg-background p-3'
        value={draft} maxLength={16000} disabled={disabled} onChange={e => { setDraft(e.target.value); onDirty(e.target.value !== content); }} />
    </label>
    <p className='text-muted-foreground'>Save changes before finalizing. A sealed narrative must be reopened before editing.</p>
    <button className='rounded-md border border-border px-3 py-2 focus-visible:outline focus-visible:outline-2 disabled:opacity-50'
      disabled={disabled || draft === content} onClick={() => onSave(draft)}>Save narrative</button>
  </div>;
}
