import { assertUniqueBy } from '../../../frontend/apps/os-shell/src/utils/assertUniqueBy';

describe('assertUniqueBy', () => {
  it('does nothing when keys are unique', () => {
    expect(() =>
      assertUniqueBy([{ id: 'a' }, { id: 'b' }, { id: 'c' }], x => x.id, 'test')
    ).not.toThrow();
  });

  it('throws when keys are duplicated', () => {
    expect(() =>
      assertUniqueBy([{ id: 'new-file' }, { id: 'new-file' }], x => x.id, 'test')
    ).toThrow(/Duplicate keys detected/);
  });

  it('reports the correct count for triplicates', () => {
    expect(() =>
      assertUniqueBy([{ id: 'x' }, { id: 'x' }, { id: 'x' }], x => x.id, 'triples')
    ).toThrow('x (x3)');
  });

  it('accepts an empty array', () => {
    expect(() => assertUniqueBy([], (x: { id: string }) => x.id, 'empty')).not.toThrow();
  });
});
