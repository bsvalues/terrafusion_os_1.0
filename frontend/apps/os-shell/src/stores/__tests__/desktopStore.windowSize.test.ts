/**
 * Desktop Store Window Size Tests
 *
 * Verifies the canonical default window size of 1024×700.
 *
 * CANONICAL SPEC (Part 1):
 *   Windows default to 1024×700.
 *
 * @module stores/__tests__/desktopStore.windowSize.test
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Tests
// ============================================================================

describe('desktopStore window defaults', () => {
  const storePath = path.resolve(__dirname, '../desktopStore.ts');
  let storeContent: string;

  beforeAll(() => {
    storeContent = fs.readFileSync(storePath, 'utf-8');
  });

  it('DEFAULT_WINDOW_SIZE width is 1024', () => {
    expect(storeContent).toMatch(/DEFAULT_WINDOW_SIZE.*width:\s*1024/s);
  });

  it('DEFAULT_WINDOW_SIZE height is 700', () => {
    expect(storeContent).toMatch(/DEFAULT_WINDOW_SIZE.*height:\s*700/s);
  });

  it('MIN_WINDOW_SIZE width is 400', () => {
    expect(storeContent).toMatch(/MIN_WINDOW_SIZE.*width:\s*400/s);
  });

  it('MIN_WINDOW_SIZE height is 300', () => {
    expect(storeContent).toMatch(/MIN_WINDOW_SIZE.*height:\s*300/s);
  });

  it('CASCADE_OFFSET is 30', () => {
    expect(storeContent).toMatch(/CASCADE_OFFSET\s*=\s*30/);
  });

  it('TASKBAR_HEIGHT is 48', () => {
    expect(storeContent).toMatch(/TASKBAR_HEIGHT\s*=\s*48/);
  });
});
