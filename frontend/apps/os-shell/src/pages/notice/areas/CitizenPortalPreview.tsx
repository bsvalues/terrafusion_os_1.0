/**
 * TN-GUI-009 — Citizen Portal Preview.
 *
 * The QR landing page a citizen reaches from the printed notice: a plain
 * explanation, parcel summary, appeal guidance, and a language / accessibility
 * toggle. This is a preview of citizen-facing content, not the live portal.
 *
 * @module pages/notice/areas/CitizenPortalPreview
 */

import React, { useState } from 'react';
import type { NoticeConsoleSnapshot } from '../types';
import { SectionCard, StatusPill } from '../components/primitives';

export const CitizenPortalPreview: React.FC<{ snapshot: NoticeConsoleSnapshot }> = ({ snapshot }) => {
  const langs = snapshot.county.languageDefaults;
  const [lang, setLang] = useState(langs[0] ?? 'English (en-US)');
  const [highContrast, setHighContrast] = useState(false);

  return (
    <div className="space-y-5" data-testid="notice-area-citizen-portal">
      <SectionCard
        title="Accessibility & Language"
        chip={<StatusPill label="Preview only" variant="outline" />}
      >
        <div className="flex flex-wrap items-center gap-2">
          {langs.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className="px-3 py-1.5 rounded-full text-sm transition-colors"
              style={{
                background: l === lang ? 'hsl(var(--tf-accent) / 0.15)' : 'hsl(var(--tf-card-bg) / 0.4)',
                color: l === lang ? 'hsl(var(--tf-accent))' : 'hsl(var(--tf-fg))',
                border: `1px solid hsl(var(--tf-border) / ${l === lang ? 0.4 : 0.15})`,
              }}
            >
              {l}
            </button>
          ))}
          <label className="flex items-center gap-2 text-sm ml-2 cursor-pointer">
            <input type="checkbox" checked={highContrast} onChange={() => setHighContrast((v) => !v)} />
            High-contrast view
          </label>
        </div>
      </SectionCard>

      <div
        className="rounded-xl p-6 max-w-2xl mx-auto"
        style={{
          background: highContrast ? 'hsl(0 0% 8%)' : 'hsl(var(--tf-card-bg) / 0.6)',
          color: highContrast ? 'hsl(0 0% 98%)' : 'hsl(var(--tf-fg))',
          border: '1px solid hsl(var(--tf-border) / 0.3)',
        }}
        data-testid="citizen-portal-landing"
      >
        {/* QR + header */}
        <div className="flex items-center gap-4 pb-4" style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.3)' }}>
          <div
            className="w-16 h-16 rounded grid place-items-center text-[10px] font-mono"
            style={{ background: highContrast ? 'hsl(0 0% 98%)' : 'hsl(var(--tf-fg) / 0.9)', color: highContrast ? 'hsl(0 0% 8%)' : 'hsl(var(--tf-bg))' }}
            aria-label="QR code placeholder"
          >
            QR
          </div>
          <div>
            <div className="text-lg font-semibold">{snapshot.county.countyName} — {snapshot.county.program}</div>
            <div className="text-sm opacity-70">Tax Year {snapshot.county.taxYear} · {lang}</div>
          </div>
        </div>

        {/* Notice explanation */}
        <section className="pt-4 space-y-2">
          <h3 className="font-semibold">What this notice means</h3>
          <p className="text-sm opacity-80">
            This notice tells you the assessed value of your property for the {snapshot.county.taxYear} tax year.
            It is not a bill. If you believe the value is incorrect, you have the right to appeal within the
            statutory window described below.
          </p>
        </section>

        {/* Parcel summary */}
        <section className="pt-4 space-y-1">
          <h3 className="font-semibold">Your parcel</h3>
          <dl className="text-sm grid grid-cols-2 gap-x-4 gap-y-1 opacity-80">
            <dt>Parcel ID</dt><dd className="text-right font-mono">SAMPLE-PARCEL</dd>
            <dt>Assessed value</dt><dd className="text-right font-mono">$ —</dd>
            <dt>Prior value</dt><dd className="text-right font-mono">$ —</dd>
          </dl>
          <p className="text-[11px] opacity-60 pt-1">Parcel values are populated from the freeze snapshot at issue time.</p>
        </section>

        {/* Appeal guidance */}
        <section className="pt-4 space-y-2">
          <h3 className="font-semibold">How to appeal</h3>
          <ol className="text-sm opacity-80 list-decimal list-inside space-y-1">
            <li>Review the value and supporting information.</li>
            <li>File a petition with the Board of Equalization before the deadline on your notice.</li>
            <li>Provide evidence (recent sales, appraisal, condition).</li>
          </ol>
        </section>
      </div>
    </div>
  );
};

export default CitizenPortalPreview;
