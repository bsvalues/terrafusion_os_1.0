import {
  isConferenceWorkspaceManifest,
  WACO_CONFERENCE_WORKSPACE,
} from '../conferenceWorkspace';

describe('WACO conference workspace manifest', () => {
  it('is deterministic and local-only', () => {
    expect(isConferenceWorkspaceManifest(WACO_CONFERENCE_WORKSPACE)).toBe(true);
    expect(WACO_CONFERENCE_WORKSPACE.startup).toEqual({
      mode: 'cold',
      networkPolicy: 'local-only',
    });
    expect(WACO_CONFERENCE_WORKSPACE.views.map((view) => view.id)).toEqual([
      'shell',
      'counties-hub',
      'sales-forge',
      'terra-canon',
    ]);
    expect(WACO_CONFERENCE_WORKSPACE.views.map((view) => view.route)).toEqual([
      '/',
      '/forge/county-studio',
      '/forge',
      '/canon',
    ]);
  });

  it('rejects duplicate views and external routes', () => {
    const invalid = {
      ...WACO_CONFERENCE_WORKSPACE,
      views: [
        ...WACO_CONFERENCE_WORKSPACE.views,
        {
          ...WACO_CONFERENCE_WORKSPACE.views[0],
          id: 'external',
          route: 'https://example.invalid',
        },
      ],
    };

    expect(isConferenceWorkspaceManifest(invalid)).toBe(false);
  });
});
