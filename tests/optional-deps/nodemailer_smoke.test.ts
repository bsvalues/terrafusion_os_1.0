/**
 * Bucket C Smoke Test: nodemailer transport contract
 *
 * Purpose: Verify nodemailer 7.x maintains the expected API contract
 * before merging PR #58 (nodemailer 6.10.1 → 7.0.11)
 *
 * Skips entirely if nodemailer isn't installed (graceful degradation).
 */
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Check if nodemailer is installed before running tests
const nodemailerInstalled = existsSync(resolve(process.cwd(), 'node_modules/nodemailer'));

describe.skipIf(!nodemailerInstalled)('nodemailer smoke', async () => {
  // Only import if installed to avoid Vite resolution errors
  const nodemailer = nodemailerInstalled ? await import('nodemailer') : null;

  it('createTransport API exists', async () => {
    if (!nodemailer) return;

    expect(typeof nodemailer.createTransport).toBe('function');
    expect(typeof nodemailer.createTestAccount).toBe('function');
    expect(typeof nodemailer.getTestMessageUrl).toBe('function');
  });

  it('can construct streamTransport and send (no network)', async () => {
    if (!nodemailer) return;

    // Use streamTransport to avoid network
    const transport = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });

    expect(transport).toBeTruthy();
    expect(typeof transport.sendMail).toBe('function');
    expect(typeof transport.verify).toBe('function');

    // Send a test email (no network - goes to buffer)
    const info = await transport.sendMail({
      from: 'noreply@terrafusion.local',
      to: 'devnull@terrafusion.local',
      subject: 'Bucket C Smoke Test',
      text: 'This is a test email for nodemailer 7.x upgrade validation.',
    });

    expect(info).toBeTruthy();
    expect(info.messageId).toBeTruthy();

    // Buffer should contain the email
    expect(info.message).toBeInstanceOf(Buffer);
    expect(info.message.length).toBeGreaterThan(0);
  });

  it('transport can be closed', async () => {
    if (!nodemailer) return;

    const transport = nodemailer.createTransport({
      streamTransport: true,
    });

    // close() should not throw
    expect(() => transport.close()).not.toThrow();
  });
});
