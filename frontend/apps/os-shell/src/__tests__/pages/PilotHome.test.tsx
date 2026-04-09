import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PilotHome } from '../../pages/PilotHome';

vi.mock('../../components/pilot/MuseRouterObservatory', () => ({
  MuseRouterObservatory: () => <div data-testid="muse-router-observatory" />,
}));

vi.mock('../../pages/MuseChat', () => ({
  default: () => <div data-testid="muse-chat" />,
  MuseChat: () => <div data-testid="muse-chat" />,
}));

describe('PilotHome', () => {
  it('renders MuseRouterObservatory above TerraPilotPanel / MuseChat', () => {
    render(<PilotHome />);
    const observatory = screen.getByTestId('muse-router-observatory');
    const chat = screen.getByTestId('muse-chat');
    expect(observatory).toBeDefined();
    expect(chat).toBeDefined();

    // Observatory must appear before chat in the DOM
    const container = observatory.parentElement!;
    const children = Array.from(container.children);
    expect(children.indexOf(observatory)).toBeLessThan(children.indexOf(chat.parentElement ?? chat));
  });
});
