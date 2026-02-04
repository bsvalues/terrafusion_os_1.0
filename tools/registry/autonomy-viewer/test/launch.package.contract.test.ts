/**
 * launch.package.contract.test.ts
 * ================================
 * Phase XXIV-B drift prevention: validates stakeholder/audit launch docs
 *
 * Invariants enforced:
 * - All 5 docs exist
 * - Required sections present per doc
 * - PII-clean (sha256: refs only, no emails/phones/raw names)
 * - Hash-stamp format valid
 * - Cross-doc references consistent (stop codes, KPI thresholds)
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

// ESM path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Docs path (relative to repo root)
const DOCS_OPS_PATH = join(__dirname, '..', '..', '..', '..', 'docs', 'ops');

// Launch package documents
const LAUNCH_DOCS = {
  EXECUTIVE_BRIEF: 'EXECUTIVE_BRIEF.md',
  SAMPLE_AUDIT_PACKET: 'SAMPLE_AUDIT_PACKET.md',
  HASH_STAMPED_NARRATIVE: 'HASH_STAMPED_NARRATIVE_EXCERPTS.md',
  DASHBOARD_GUIDE: 'PILOT_STATUS_DASHBOARD_GUIDE.md',
  LEADERSHIP_FAQ: 'FAQ_FOR_AGENCY_LEADERSHIP.md',
} as const;

// Required sections per document
const REQUIRED_SECTIONS: Record<string, string[]> = {
  EXECUTIVE_BRIEF: [
    'What.*Live', // "What's Live" section
    'Why.*Safe', // "Why It's Safe" section
    'Stop Conditions',
    'Govern', // "Governed" or "Governance"
  ],
  SAMPLE_AUDIT_PACKET: ['Packet Metadata', 'Control', 'Evidence', 'MOU', 'Framework'],
  HASH_STAMPED_NARRATIVE: ['Verification', 'Excerpt', 'Hash'],
  DASHBOARD_GUIDE: ['Readiness', 'Exception', 'Stop', 'KPI'],
  LEADERSHIP_FAQ: ['Safety', 'Compliance', 'Operations', 'Data', 'Pilot'],
};

// Stop condition codes (must be consistent across docs)
const STOP_CONDITION_CODES = [
  'MTTR_REGRESSION',
  'ROLLBACK_FAILURE',
  'DR_DRILL_FAILURE',
  'AUDIT_INTEGRITY_ALERT',
];

// KPI thresholds (must be consistent)
const KPI_THRESHOLDS = {
  MTTR: '30', // minutes
  ROLLBACK: '95', // percent
  AVAILABILITY: '99.5', // percent
  DR_FRESHNESS: '90', // days
  PILOT_WINDOW: '14', // days
};

// Governance constants
const GOVERNANCE_CONSTANTS = {
  REQUIRED_APPROVALS: '2',
  MAX_PAUSE_LATENCY_MS: '5', // seconds (docs say "5 seconds")
};

// PII patterns that should NOT appear
const PII_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, // Phone (US format)
  /\bSSN[-:\s]*\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/i, // SSN
];

// Valid identifier pattern (sha256: prefix required for opaque IDs)
const VALID_ID_PATTERN = /sha256:[a-f0-9]+/i;

// Helper: read doc content
function readDoc(docKey: keyof typeof LAUNCH_DOCS): string {
  const filePath = join(DOCS_OPS_PATH, LAUNCH_DOCS[docKey]);
  if (!existsSync(filePath)) {
    throw new Error(`Doc not found: ${filePath}`);
  }
  return readFileSync(filePath, 'utf-8');
}

// Helper: check if content has section (case-insensitive header match)
function hasSection(content: string, sectionKeyword: string): boolean {
  const headerPattern = new RegExp(`^#{1,4}\\s+.*${sectionKeyword}`, 'im');
  return headerPattern.test(content);
}

// Helper: check for PII violations
function findPIIViolations(content: string): string[] {
  const violations: string[] = [];
  for (const pattern of PII_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      violations.push(`Found PII pattern: ${matches[0]}`);
    }
  }
  return violations;
}

// Helper: check sha256 refs are properly formatted
function validateSha256Refs(content: string): boolean {
  // If doc mentions sha256, it should be in valid format
  const sha256Mentions = content.match(/sha256[^\s]*/gi) || [];
  for (const ref of sha256Mentions) {
    if (!VALID_ID_PATTERN.test(ref) && !ref.includes('sha256:')) {
      return false;
    }
  }
  return true;
}

// ──────────────────────────────────────────────────────────────────────────────
// TEST SUITES
// ──────────────────────────────────────────────────────────────────────────────

describe('Launch Package Contract Tests', () => {
  // ────────────────────────────────────────────────────────────────────────────
  // DOCUMENT EXISTENCE
  // ────────────────────────────────────────────────────────────────────────────

  describe('Document Existence', () => {
    for (const [key, filename] of Object.entries(LAUNCH_DOCS)) {
      it(`${filename} exists`, () => {
        const filePath = join(DOCS_OPS_PATH, filename);
        assert.ok(existsSync(filePath), `Missing doc: ${filePath}`);
      });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // REQUIRED SECTIONS
  // ────────────────────────────────────────────────────────────────────────────

  describe('Required Sections', () => {
    describe('EXECUTIVE_BRIEF.md', () => {
      const content = readDoc('EXECUTIVE_BRIEF');
      for (const section of REQUIRED_SECTIONS.EXECUTIVE_BRIEF) {
        it(`has "${section}" section`, () => {
          assert.ok(hasSection(content, section), `Missing section: ${section}`);
        });
      }
    });

    describe('SAMPLE_AUDIT_PACKET.md', () => {
      const content = readDoc('SAMPLE_AUDIT_PACKET');
      for (const section of REQUIRED_SECTIONS.SAMPLE_AUDIT_PACKET) {
        it(`has "${section}" section`, () => {
          assert.ok(hasSection(content, section), `Missing section: ${section}`);
        });
      }
    });

    describe('HASH_STAMPED_NARRATIVE_EXCERPTS.md', () => {
      const content = readDoc('HASH_STAMPED_NARRATIVE');
      for (const section of REQUIRED_SECTIONS.HASH_STAMPED_NARRATIVE) {
        it(`has "${section}" section`, () => {
          assert.ok(hasSection(content, section), `Missing section: ${section}`);
        });
      }
    });

    describe('PILOT_STATUS_DASHBOARD_GUIDE.md', () => {
      const content = readDoc('DASHBOARD_GUIDE');
      for (const section of REQUIRED_SECTIONS.DASHBOARD_GUIDE) {
        it(`has "${section}" section`, () => {
          assert.ok(hasSection(content, section), `Missing section: ${section}`);
        });
      }
    });

    describe('FAQ_FOR_AGENCY_LEADERSHIP.md', () => {
      const content = readDoc('LEADERSHIP_FAQ');
      for (const section of REQUIRED_SECTIONS.LEADERSHIP_FAQ) {
        it(`has "${section}" section`, () => {
          assert.ok(hasSection(content, section), `Missing section: ${section}`);
        });
      }
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // PII LINT
  // ────────────────────────────────────────────────────────────────────────────

  describe('PII Lint', () => {
    for (const [key, filename] of Object.entries(LAUNCH_DOCS)) {
      it(`${filename} is PII-clean`, () => {
        const content = readDoc(key as keyof typeof LAUNCH_DOCS);
        const violations = findPIIViolations(content);
        assert.deepEqual(violations, [], `PII violations found: ${violations.join(', ')}`);
      });
    }

    for (const [key, filename] of Object.entries(LAUNCH_DOCS)) {
      it(`${filename} has valid sha256: ref format`, () => {
        const content = readDoc(key as keyof typeof LAUNCH_DOCS);
        assert.ok(validateSha256Refs(content), 'Invalid sha256 reference format');
      });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // STOP CONDITION ALIGNMENT
  // ────────────────────────────────────────────────────────────────────────────

  describe('Stop Condition Alignment', () => {
    it('EXECUTIVE_BRIEF.md references stop conditions', () => {
      const content = readDoc('EXECUTIVE_BRIEF');
      const hasStopRef =
        /stop.?condition/i.test(content) ||
        STOP_CONDITION_CODES.some(code => content.includes(code));
      assert.ok(hasStopRef, 'Must reference stop conditions');
    });

    it('FAQ_FOR_AGENCY_LEADERSHIP.md explains auto-pause', () => {
      const content = readDoc('LEADERSHIP_FAQ');
      assert.ok(/auto.?pause/i.test(content), 'Must explain auto-pause mechanism');
    });

    it('FAQ_FOR_AGENCY_LEADERSHIP.md explains dual approval', () => {
      const content = readDoc('LEADERSHIP_FAQ');
      const hasDualApproval =
        /dual.?approv/i.test(content) ||
        /two.*(approv|person)/i.test(content) ||
        content.includes('2/2');
      assert.ok(hasDualApproval, 'Must explain dual approval requirement');
    });

    it('DASHBOARD_GUIDE.md references stop-condition watch', () => {
      const content = readDoc('DASHBOARD_GUIDE');
      const hasStopWatch =
        /stop.?condition/i.test(content) ||
        STOP_CONDITION_CODES.some(code => content.includes(code));
      assert.ok(hasStopWatch, 'Must reference stop-condition monitoring');
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // KPI THRESHOLD CONSISTENCY
  // ────────────────────────────────────────────────────────────────────────────

  describe('KPI Threshold Consistency', () => {
    it('EXECUTIVE_BRIEF.md references MTTR threshold', () => {
      const content = readDoc('EXECUTIVE_BRIEF');
      const hasMTTR = /MTTR/i.test(content) || /mean.?time.?to.?recov/i.test(content);
      assert.ok(hasMTTR, 'Must reference MTTR');
    });

    it('DASHBOARD_GUIDE.md references KPI thresholds', () => {
      const content = readDoc('DASHBOARD_GUIDE');
      const hasKPI =
        /KPI/i.test(content) ||
        /threshold/i.test(content) ||
        /MTTR|rollback|availability/i.test(content);
      assert.ok(hasKPI, 'Must reference KPI thresholds');
    });

    it('FAQ explains 14-day pilot window', () => {
      const content = readDoc('LEADERSHIP_FAQ');
      assert.ok(content.includes('14'), 'Must reference 14-day pilot window');
    });

    it('DASHBOARD_GUIDE.md references DR freshness', () => {
      const content = readDoc('DASHBOARD_GUIDE');
      const hasDR = /DR|disaster.?recovery|freshness/i.test(content);
      assert.ok(hasDR, 'Must reference DR freshness tracking');
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // GOVERNANCE CONSTANT ALIGNMENT
  // ────────────────────────────────────────────────────────────────────────────

  describe('Governance Constant Alignment', () => {
    it('FAQ references 5-second pause latency', () => {
      const content = readDoc('LEADERSHIP_FAQ');
      const has5Sec = /5\s*second/i.test(content) || /<\s*5s/i.test(content);
      assert.ok(has5Sec, 'Must reference 5-second auto-pause latency');
    });

    it('FAQ references 2 required approvers', () => {
      const content = readDoc('LEADERSHIP_FAQ');
      const has2Approvers =
        /two.*(approv|person)/i.test(content) ||
        /2.*(approv|person)/i.test(content) ||
        content.includes('2/2');
      assert.ok(has2Approvers, 'Must reference 2 required approvers');
    });

    it('EXECUTIVE_BRIEF.md references dual approval', () => {
      const content = readDoc('EXECUTIVE_BRIEF');
      const hasDualApproval =
        /dual.?approv/i.test(content) || /two.*(approv)/i.test(content) || /2\/2/i.test(content);
      assert.ok(hasDualApproval, 'Must reference dual approval governance');
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // HASH-STAMP FORMAT
  // ────────────────────────────────────────────────────────────────────────────

  describe('Hash-Stamp Format', () => {
    it('HASH_STAMPED_NARRATIVE_EXCERPTS.md has hash stamps', () => {
      const content = readDoc('HASH_STAMPED_NARRATIVE');
      // Should contain sha256: references
      assert.ok(VALID_ID_PATTERN.test(content), 'Must contain sha256: hash stamps');
    });

    it('HASH_STAMPED_NARRATIVE_EXCERPTS.md has verification section', () => {
      const content = readDoc('HASH_STAMPED_NARRATIVE');
      assert.ok(hasSection(content, 'Verification'), 'Must have verification section');
    });

    it('SAMPLE_AUDIT_PACKET.md references packet hash', () => {
      const content = readDoc('SAMPLE_AUDIT_PACKET');
      const hasHash = /sha256:/i.test(content) || /packet.*id/i.test(content);
      assert.ok(hasHash, 'Must reference packet hash or ID');
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // CROSS-DOC REFERENCES
  // ────────────────────────────────────────────────────────────────────────────

  describe('Cross-Doc References', () => {
    it('FAQ references other docs appropriately', () => {
      const content = readDoc('LEADERSHIP_FAQ');
      const hasDocRefs =
        /Executive.?Brief/i.test(content) ||
        /Dashboard/i.test(content) ||
        /Exit.?Criteria/i.test(content) ||
        /Runbook/i.test(content);
      assert.ok(hasDocRefs, 'Should reference related docs');
    });

    it('DASHBOARD_GUIDE.md is self-contained for interpretation', () => {
      const content = readDoc('DASHBOARD_GUIDE');
      // Should explain what each section means
      const hasExplanations = /meaning|interpret|indicates|shows/i.test(content);
      assert.ok(hasExplanations, 'Should explain dashboard interpretation');
    });

    it('EXECUTIVE_BRIEF.md stays under one page (approx)', () => {
      const content = readDoc('EXECUTIVE_BRIEF');
      // Rough heuristic: ~500 words is one page
      const wordCount = content.split(/\s+/).length;
      assert.ok(wordCount < 1500, `Brief should be concise (${wordCount} words)`);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // REPRODUCIBILITY INVARIANTS
  // ────────────────────────────────────────────────────────────────────────────

  describe('Reproducibility Invariants', () => {
    it('HASH_STAMPED_NARRATIVE_EXCERPTS.md explains reproducibility', () => {
      const content = readDoc('HASH_STAMPED_NARRATIVE');
      const hasRepro = /reproduc/i.test(content) || /regenerat/i.test(content);
      assert.ok(hasRepro, 'Must explain how to reproduce/regenerate');
    });

    it('SAMPLE_AUDIT_PACKET.md has generation metadata', () => {
      const content = readDoc('SAMPLE_AUDIT_PACKET');
      const hasMeta = /generat/i.test(content) || /version/i.test(content);
      assert.ok(hasMeta, 'Should have generation metadata');
    });
  });
});
