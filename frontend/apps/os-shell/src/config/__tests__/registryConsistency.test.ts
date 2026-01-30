import { MODULES } from '../modules';
import { ModuleRenderer } from '../moduleComponents';

describe('registry consistency', () => {
  it('every module has an entry', () => {
    for (const module of MODULES) {
      expect(module.id).toBeTruthy();
      expect(module.entry).toBeTruthy();
    }
  });

  it('renderer accepts module without throwing', () => {
    expect(() => ModuleRenderer({ module: MODULES[0] })).not.toThrow();
  });
});
