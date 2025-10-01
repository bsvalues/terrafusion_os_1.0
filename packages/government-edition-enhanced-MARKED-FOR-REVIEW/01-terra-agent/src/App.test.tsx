import {describe, it, expect} from 'vitest';
import App from './App';

describe('Terra Agent App', () => {it('should be defined', () => {
    expect(App).toBeDefined();});

  it('should be a function component', () => {expect(typeof App).toBe('function');});
});
