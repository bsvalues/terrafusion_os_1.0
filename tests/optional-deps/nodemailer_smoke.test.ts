/**
 * Bucket C Smoke Test: nodemailer transport contract
 *
 * Purpose: Verify nodemailer 7.x maintains the expected API contract
 * before merging PR #58 (nodemailer 6.10.1 → 7.0.11)
 *
 * Skips entirely if nodemailer isn't installed (graceful degradation).
 */
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

async function importNodemailer() {
  const entry = require.resolve('nodemailer');
  return import(entry);
}

async function hasNodemailer(): Promise<boolean> {
  try {
    require.resolve('nodemailer');
    return true;
  } catch {
    return false;
  }
}

const hasDep = await hasNodemailer();

describe.skipIf(!hasDep)('optional-deps: nodemailer smoke', () => {
  it('can import nodemailer', async () => {
    const mod = await importNodemailer();
    expect(mod).toBeTruthy();
  });

  it('createTransport API exists', async () => {
    const nodemailer = await importNodemailer();

    expect(typeof nodemailer.createTransport).toBe('function');
    expect(typeof nodemailer.createTestAccount).toBe('function');
    expect(typeof nodemailer.getTestMessageUrl).toBe('function');
  });

  it('can construct streamTransport and send (no network)', async () => {
    const nodemailer = await importNodemailer();

    // Use streamTransport to avoid network.
    const transport = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });

    expect(transport).toBeTruthy();
    expect(typeof transport.sendMail).toBe('function');
    expect(typeof transport.verify).toBe('function');

    // Send a test email (no network - goes to buffer).
    const info = await transport.sendMail({
      from: 'noreply@terrafusion.local',
      to: 'devnull@terrafusion.local',
      subject: 'Bucket C Smoke Test',
      text: 'This is a test email for nodemailer 7.x upgrade validation.',
    });

    expect(info).toBeTruthy();
    expect(info.messageId).toBeTruthy();

    // Buffer should contain the email.
    expect(info.message).toBeInstanceOf(Buffer);
    expect(info.message.length).toBeGreaterThan(0);
  });

  it('transport can be closed', async () => {
    const nodemailer = await importNodemailer();
    const transport = nodemailer.createTransport({
      streamTransport: true,
    });

    // close() should not throw.
    expect(() => transport.close()).not.toThrow();
  });
});
