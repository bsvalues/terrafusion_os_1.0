/// <reference types="vitest" />
/**
 * gpt-quick-chat.contract.test.ts
 *
 * Contract tests for GptQuickChat + GptSuiteHome studio activation.
 *
 * GATE 1: GptQuickChat component file exists with correct data-testids
 * GATE 2: GptQuickChat uses gptAPI.getSystemGPTs (canonical system GPT fetch)
 * GATE 3: GptQuickChat embeds GPTChatInterface
 * GATE 4: GptSuiteHome imports GptQuickChat
 * GATE 5: GptSuiteHome has 'studio' in LIVE_WORKSPACE_VIEWS
 * GATE 6: GptSuiteHome routes case 'studio' to GptQuickChat render
 * GATE 7: GptSuiteHome onChatWithGPT callback routes to studio view
 * GATE 8: GptQuickChat handles empty-state (no system GPTs configured)
 * GATE 9: GptQuickChat handles error-state
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(__dirname, '../../..');
const QUICK_CHAT = fs.readFileSync(
  path.join(ROOT, 'src/components/gpt/GptQuickChat.tsx'),
  'utf8',
);
const SUITE_HOME = fs.readFileSync(
  path.join(ROOT, 'src/pages/suites/GptSuiteHome.tsx'),
  'utf8',
);

describe('GptQuickChat — contract gates', () => {
  it('GATE 1: component file has required data-testid attributes', () => {
    expect(QUICK_CHAT).toContain('data-testid="gpt-quick-chat"');
    expect(QUICK_CHAT).toContain('data-testid="gpt-quick-chat-loading"');
    expect(QUICK_CHAT).toContain('data-testid="gpt-quick-chat-empty"');
    expect(QUICK_CHAT).toContain('data-testid="gpt-quick-chat-error"');
    expect(QUICK_CHAT).toContain('data-testid="gpt-chat-embed"');
  });

  it('GATE 2: calls gptAPI.getSystemGPTs for canonical fetch', () => {
    expect(QUICK_CHAT).toContain('.getSystemGPTs');
    expect(QUICK_CHAT).toContain("from '@/services/gptAPI'");
  });

  it('GATE 3: embeds GPTChatInterface', () => {
    expect(QUICK_CHAT).toContain('GPTChatInterface');
    expect(QUICK_CHAT).toContain("from '@/components/gpt/GPTChatInterface'");
  });

  it('GATE 4: GptSuiteHome imports GptQuickChat', () => {
    expect(SUITE_HOME).toContain("import { GptQuickChat }");
    expect(SUITE_HOME).toContain('GptQuickChat');
  });

  it('GATE 5: GptSuiteHome includes studio in LIVE_WORKSPACE_VIEWS', () => {
    expect(SUITE_HOME).toMatch(/LIVE_WORKSPACE_VIEWS[^=]*=.*\[.*'studio'/s);
  });

  it('GATE 6: GptSuiteHome routes case studio to GptQuickChat', () => {
    expect(SUITE_HOME).toContain("case 'studio':");
    expect(SUITE_HOME).toContain('<GptQuickChat');
  });

  it('GATE 7: GPTManagementDashboard onChatWithGPT routes to studio', () => {
    expect(SUITE_HOME).toContain("onChatWithGPT={() => setWorkspaceView('studio')}");
  });

  it('GATE 8: handles empty state when no system GPTs exist', () => {
    expect(QUICK_CHAT).toContain("'empty'");
    expect(QUICK_CHAT).toContain('gpt-quick-chat-empty');
    expect(QUICK_CHAT).toContain('No system GPTs configured');
  });

  it('GATE 9: handles error state from failed getSystemGPTs', () => {
    expect(QUICK_CHAT).toContain("'error'");
    expect(QUICK_CHAT).toContain('gpt-quick-chat-error');
    expect(QUICK_CHAT).toContain('Failed to load GPT configurations');
  });
});
