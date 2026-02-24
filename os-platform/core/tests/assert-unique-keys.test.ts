import { assertUniqueKeys } from '../../../frontend/apps/os-shell/src/utils/assertUniqueKeys';

describe('assertUniqueKeys', () => {
  it('does nothing when keys are unique', () => {
    expect(() =>
      assertUniqueKeys([{ id: 'a' }, { id: 'b' }, { id: 'c' }], x => x.id, 'test')
    ).not.toThrow();
  });

  it('throws when keys are duplicated', () => {
    expect(() =>
      assertUniqueKeys([{ id: 'new-file' }, { id: 'new-file' }], x => x.id, 'test')
    ).toThrow(/Duplicate keys detected/);
  });

  it('reports the correct count for triplicates', () => {
    expect(() =>
      assertUniqueKeys([{ id: 'x' }, { id: 'x' }, { id: 'x' }], x => x.id, 'triples')
    ).toThrow('x (x3)');
  });

  it('accepts an empty array', () => {
    expect(() => assertUniqueKeys([], (x: { id: string }) => x.id, 'empty')).not.toThrow();
  });
});
