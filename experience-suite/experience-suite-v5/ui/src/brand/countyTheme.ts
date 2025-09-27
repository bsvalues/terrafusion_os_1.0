// ui/src/brand/countyTheme.ts
export type County = 'Benton' | 'Yakima' | string;

export function applyCountyTheme(county: County) {
  const head = document.head;
  const baseHref = '/brand/tokens-base.css';
  const countyHref = county === 'Benton' ? '/brand/tokens-benton.css'
                    : county === 'Yakima' ? '/brand/tokens-yakima.css'
                    : null;
  ensureStylesheet('tf-base', baseHref);
  if (countyHref) ensureStylesheet('tf-county', countyHref);
}

function ensureStylesheet(id: string, href: string) {
  let link = document.getElementById(id) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = id; link.rel = 'stylesheet'; link.href = href;
    document.head.appendChild(link);
  } else if (link.href !== href) { link.href = href; }
}
