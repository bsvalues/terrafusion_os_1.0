import type { BrowserContext } from '@playwright/test';

export async function injectNetworkChaos(context: BrowserContext, opts?: { latencyMs?: [number, number], drop?: number }) {
  const [min, max] = opts?.latencyMs ?? [100, 1200];
  const drop = opts?.drop ?? 0.02;

  await context.route('**/*', async route => {
    if (Math.random() < drop) return route.abort('failed');
    const delay = Math.floor(Math.random() * (max - min)) + min;
    setTimeout(() => route.continue(), delay);
  });
}