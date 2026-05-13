const explicitToken =
  process.env.TF_RUNTIME_BEARER_TOKEN ?? process.env.TERRAFUSION_RUNTIME_BEARER_TOKEN ?? null;

function mergeHeaders(headers) {
  return new Headers(headers ?? {});
}

async function fetchDevelopmentToken(endpoint) {
  if (process.env.TF_RUNTIME_AUTH_AUTO_DEV_TOKEN === '0') {
    return null;
  }

  try {
    const tokenUrl = new URL('/api/auth/dev-token', endpoint).toString();
    const response = await fetch(tokenUrl, { headers: { accept: 'application/json' } });
    if (!response.ok) return null;

    const payload = await response.json();
    return typeof payload?.token === 'string' && payload.token.length > 0 ? payload.token : null;
  } catch {
    return null;
  }
}

export async function runtimeFetch(endpoint, init = {}) {
  const headers = mergeHeaders(init.headers);
  if (!headers.has('accept')) {
    headers.set('accept', 'application/json');
  }
  if (explicitToken && !headers.has('authorization')) {
    headers.set('authorization', `Bearer ${explicitToken}`);
  }

  const response = await fetch(endpoint, { ...init, headers });
  if (response.status !== 401 || headers.has('authorization')) {
    return response;
  }

  const developmentToken = await fetchDevelopmentToken(endpoint);
  if (!developmentToken) {
    return response;
  }

  const retryHeaders = mergeHeaders(init.headers);
  if (!retryHeaders.has('accept')) {
    retryHeaders.set('accept', 'application/json');
  }
  retryHeaders.set('authorization', `Bearer ${developmentToken}`);

  return fetch(endpoint, { ...init, headers: retryHeaders });
}
