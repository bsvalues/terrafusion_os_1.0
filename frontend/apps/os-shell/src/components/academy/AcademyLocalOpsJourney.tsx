import { BookOpen, BrainCircuit, LoaderCircle, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

import {
  askAcademyLocalOps,
  type AcademyLocalOpsQuestionId,
  type AcademyLocalOpsResponse,
} from '../../api/academyLocalOpsApi';

const QUESTIONS: ReadonlyArray<{ id: AcademyLocalOpsQuestionId; label: string }> = [
  { id: 'localops-safety-boundary', label: 'Why is LocalOps read-only?' },
  { id: 'source-grounded-evidence', label: 'Why must answers cite local sources?' },
];

export function AcademyLocalOpsJourney() {
  const [questionId, setQuestionId] = useState<AcademyLocalOpsQuestionId>(
    'localops-safety-boundary'
  );
  const [result, setResult] = useState<AcademyLocalOpsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [networkFailure, setNetworkFailure] = useState(false);

  async function askLocalModel() {
    setLoading(true);
    setResult(null);
    setNetworkFailure(false);
    try {
      setResult(await askAcademyLocalOps({ questionId }));
    } catch {
      setNetworkFailure(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className='pt-7' aria-labelledby='academy-localops-title'>
      <div
        className='overflow-hidden rounded-2xl border'
        style={{
          borderColor: 'hsl(var(--tf-accent) / 0.38)',
          background: 'hsl(var(--tf-surface))',
        }}
      >
        <div className='grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]'>
          <div className='p-6 sm:p-7'>
            <div
              className='flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em]'
              style={{ color: 'hsl(var(--tf-accent))' }}
            >
              <BrainCircuit size={14} /> Ask Academy · local reasoning desk
            </div>
            <h2
              id='academy-localops-title'
              className='mt-3 text-2xl font-semibold'
              style={{ color: 'hsl(var(--tf-fg))' }}
            >
              Ask a local model why the boundary matters.
            </h2>
            <p
              className='mt-2 max-w-2xl text-sm leading-relaxed'
              style={{ color: 'hsl(var(--tf-muted))' }}
            >
              Choose a synthetic doctrine question. Academy sends only that allowlisted question
              through TerraPilot LocalOps; it cannot browse, run commands, read county systems, or
              change state.
            </p>

            <div className='mt-5 flex flex-col gap-3 sm:flex-row'>
              <label className='min-w-0 flex-1'>
                <span className='sr-only'>Synthetic Academy question</span>
                <select
                  value={questionId}
                  onChange={(event) =>
                    setQuestionId(event.target.value as AcademyLocalOpsQuestionId)
                  }
                  className='h-11 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-2'
                  style={{
                    borderColor: 'hsl(var(--tf-border))',
                    background: 'hsl(var(--tf-surface-2))',
                    color: 'hsl(var(--tf-fg))',
                  }}
                >
                  {QUESTIONS.map((question) => (
                    <option key={question.id} value={question.id}>
                      {question.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type='button'
                onClick={askLocalModel}
                disabled={loading}
                className='inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold disabled:cursor-wait disabled:opacity-70'
                style={{
                  background: 'hsl(var(--tf-accent))',
                  color: 'hsl(var(--tf-surface))',
                }}
              >
                {loading ? (
                  <LoaderCircle size={16} className='animate-spin' />
                ) : (
                  <BrainCircuit size={16} />
                )}
                {loading ? 'Asking local model…' : 'Ask local model'}
              </button>
            </div>

            {networkFailure && (
              <FailureCard message='Could not reach LocalOps. No answer was generated and no external provider was called.' />
            )}
            {result && !result.ok && (
              <FailureCard message={result.message} alternatives={result.safeAlternatives} />
            )}
            {result?.ok && (
              <div
                data-testid='academy-localops-answer'
                className='mt-5 rounded-xl border p-5'
                style={{
                  borderColor: 'hsl(var(--tf-success) / 0.38)',
                  background: 'hsl(var(--tf-success) / 0.07)',
                }}
              >
                <div
                  className='flex flex-wrap items-center gap-2 text-[11px]'
                  style={{ color: 'hsl(var(--tf-muted))' }}
                >
                  <span className='font-semibold' style={{ color: 'hsl(var(--tf-success))' }}>
                    Source-grounded
                  </span>
                  <span>·</span>
                  <span>{result.provider.name}</span>
                  <span>·</span>
                  <span>{result.provider.model}</span>
                </div>
                <p className='mt-3 text-sm leading-7' style={{ color: 'hsl(var(--tf-fg))' }}>
                  {result.answer.text}
                </p>
                <div
                  className='mt-4 space-y-2 border-t pt-3'
                  style={{ borderColor: 'hsl(var(--tf-border))' }}
                >
                  {result.answer.sources.map((source) => (
                    <div
                      key={`${source.sourceFile}:${source.heading ?? ''}`}
                      className='flex gap-2 text-xs'
                    >
                      <BookOpen
                        size={13}
                        className='mt-0.5 shrink-0'
                        style={{ color: 'hsl(var(--tf-accent))' }}
                      />
                      <div>
                        <div className='font-mono' style={{ color: 'hsl(var(--tf-fg))' }}>
                          {source.sourceFile}
                        </div>
                        {source.heading && (
                          <div style={{ color: 'hsl(var(--tf-muted))' }}>{source.heading}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside
            className='border-t p-6 lg:border-l lg:border-t-0'
            style={{
              borderColor: 'hsl(var(--tf-border))',
              background: 'hsl(var(--tf-surface-2) / 0.55)',
            }}
          >
            <div
              className='flex items-center gap-2 text-xs font-semibold'
              style={{ color: 'hsl(var(--tf-fg))' }}
            >
              <ShieldCheck size={15} style={{ color: 'hsl(var(--tf-success))' }} /> Approved
              boundary
            </div>
            <div
              className='mt-4 space-y-2 font-mono text-[11px]'
              style={{ color: 'hsl(var(--tf-muted))' }}
            >
              <BoundaryStep label='TerraFusion UI' />
              <BoundaryStep label='TerraPilot LocalOps' />
              <BoundaryStep label='Hermes tunnel' />
              <BoundaryStep label='Ollama · llama3.2:3b' last />
            </div>
            <div className='mt-5 space-y-1 text-[11px]' style={{ color: 'hsl(var(--tf-muted))' }}>
              <div>External providers: off</div>
              <div>Shell · files · database: off</div>
              <div>Mutations: off</div>
              <div>Unavailable means stopped—not rerouted.</div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function BoundaryStep({ label, last = false }: { label: string; last?: boolean }) {
  return (
    <div>
      <div
        className='rounded-md border px-2.5 py-2'
        style={{ borderColor: 'hsl(var(--tf-border))' }}
      >
        {label}
      </div>
      {!last && (
        <div className='py-1 pl-3' aria-hidden='true'>
          ↓
        </div>
      )}
    </div>
  );
}

function FailureCard({ message, alternatives }: { message: string; alternatives?: string[] }) {
  return (
    <div
      role='alert'
      className='mt-5 rounded-xl border p-4 text-sm'
      style={{
        borderColor: 'hsl(var(--tf-warning) / 0.45)',
        background: 'hsl(var(--tf-warning) / 0.08)',
        color: 'hsl(var(--tf-fg))',
      }}
    >
      <div className='font-semibold'>LocalOps unavailable</div>
      <div className='mt-1' style={{ color: 'hsl(var(--tf-muted))' }}>
        {message}
      </div>
      {alternatives?.map((alternative) => (
        <div key={alternative} className='mt-2 text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
          Next: {alternative}
        </div>
      ))}
    </div>
  );
}
