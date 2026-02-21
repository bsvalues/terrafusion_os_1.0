import { readFileSync } from 'fs';
import { resolve } from 'path';
import { assertNoRawColorLeaks } from '@tools/ui-tokens/leak-guard';

const TSX_PATH = resolve(__dirname, '../../../components/ui/Accordion.stories.tsx');

describe('Accordion.stories.tsx – TSX token leak guard', () => {
  const raw = readFileSync(TSX_PATH, 'utf8');

  test('no raw hex/rgb/rgba/hsl color values', () => {
    assertNoRawColorLeaks(raw, { label: 'Accordion.stories.tsx' });
  });
});

