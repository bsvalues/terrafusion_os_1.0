/**
 * Codex notification truth contract
 *
 * @vitest-environment jsdom
 */

import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const SRC_ROOT = path.resolve(__dirname, '../..');
const REPO_ROOT = path.resolve(SRC_ROOT, '../../../..');

function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(SRC_ROOT, relPath), 'utf-8');
}

function readRepo(relPath: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf-8');
}

describe('codex notification truth contract', () => {
  it('NotificationPreferences uses authStorage and in-surface status instead of browser-storage hacks or alert popups', () => {
    const src = readSrc('components/codex/NotificationPreferences.tsx');

    expect(src).toContain("from '@/auth/authStorage'");
    expect(src).toContain('const token = getToken();');
    expect(src).not.toContain('BROWSER_STORE_PROPERTY');
    expect(src).not.toContain('window[');
    expect(src).not.toContain('alert(');
    expect(src).toContain('connectionStatus');
    expect(src).toContain('/api/codex/notifications/preferences');
    expect(src).toContain('/api/codex/collaboration/${platform}/test');
  });

  it('CodexEmailNotificationPanel uses authStorage and keeps history explicitly unavailable', () => {
    const src = readSrc('components/codex/CodexEmailNotificationPanel.tsx');

    expect(src).toContain("from '@/auth/authStorage'");
    expect(src).toContain('const token = getToken();');
    expect(src).not.toContain('BROWSER_STORE_PROPERTY');
    expect(src).not.toContain('window[');
    expect(src).toContain('/api/codex/notifications/test');
    expect(src).toContain('codex-notification-history-unavailable');
    expect(src).toContain('Notification history retrieval is unavailable.');
  });

  it('CodexNotificationController keeps history honest instead of returning placeholder rows', () => {
    const src = readRepo('backend/src/TerraFusion.API/Controllers/CodexNotificationController.cs');

    expect(src).toContain('StatusCodes.Status501NotImplemented');
    expect(src).toContain('Placeholder audit counts were removed');
    expect(src).not.toContain('History will be available after first notifications are sent');
    expect(src).not.toContain('placeholder response');
  });
});
