export interface PopupTextPart {
  text: string;
  color?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
}

export interface PopupRow {
  parts: readonly PopupTextPart[];
  color?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  letterSpacing?: string;
  marginBottom?: string;
  marginTop?: string;
  textTransform?: string;
}

export interface GeoForgePopupContent {
  theme: 'legacy' | 'v2';
  rows: readonly PopupRow[];
  minWidth?: number;
}

function applyTextStyle(element: HTMLElement, style: PopupRow | PopupTextPart): void {
  if (style.color) element.style.color = style.color;
  if (style.fontFamily) element.style.fontFamily = style.fontFamily;
  if (style.fontSize) element.style.fontSize = style.fontSize;
  if (style.fontWeight) element.style.fontWeight = style.fontWeight;
}

function createRow(row: PopupRow): HTMLDivElement {
  const element = document.createElement('div');
  applyTextStyle(element, row);
  if (row.letterSpacing) element.style.letterSpacing = row.letterSpacing;
  if (row.marginBottom) element.style.marginBottom = row.marginBottom;
  if (row.marginTop) element.style.marginTop = row.marginTop;
  if (row.textTransform) element.style.textTransform = row.textTransform;

  for (const part of row.parts) {
    const hasStyle = Boolean(part.color || part.fontFamily || part.fontSize || part.fontWeight);
    if (!hasStyle) {
      element.append(document.createTextNode(part.text));
      continue;
    }

    const span = document.createElement('span');
    applyTextStyle(span, part);
    span.textContent = part.text;
    element.append(span);
  }

  return element;
}

export function createGeoForgePopupContent(spec: GeoForgePopupContent): HTMLDivElement {
  const container = document.createElement('div');

  if (spec.theme === 'legacy') {
    container.style.background = '#0f172a';
    container.style.border = '1px solid #334155';
    container.style.borderRadius = '6px';
    container.style.color = '#e2e8f0';
    container.style.fontSize = '11px';
    container.style.lineHeight = '1.6';
    container.style.padding = '8px 12px';
  } else {
    container.style.fontFamily = 'var(--font-primary)';
    container.style.fontSize = '10px';
  }

  if (spec.minWidth) container.style.minWidth = `${spec.minWidth}px`;
  for (const row of spec.rows) container.append(createRow(row));

  return container;
}
