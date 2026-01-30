import React from 'react';
import { resolveAmbientMode, type AmbientMode } from './ambientPolicy';
import { CanvasAmbient } from './modes/CanvasAmbient';
import { CssAmbient } from './modes/CssAmbient';
import { WebglAmbient } from './modes/WebglAmbient';

type Props = {
  forcedMode?: AmbientMode;
};

export function AmbientCompositor({ forcedMode }: Props) {
  const [fallbackMode, setFallbackMode] = React.useState<AmbientMode | null>(null);

  const mode = forcedMode ?? fallbackMode ?? resolveAmbientMode();

  const isTest =
    typeof process !== 'undefined' &&
    (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID);

  const effectiveMode: AmbientMode = isTest && mode !== 'off' ? 'css' : mode;

  const handleFatal = React.useCallback((from: AmbientMode) => {
    if (from === 'webgl') setFallbackMode('canvas2d');
    else if (from === 'canvas2d') setFallbackMode('css');
    else setFallbackMode('off');
  }, []);

  return (
    <div
      aria-hidden='true'
      className='pointer-events-none fixed inset-0 z-0'
      data-testid='desktop-background'
    >
      {effectiveMode === 'off' && null}
      {effectiveMode === 'css' && <CssAmbient />}
      {effectiveMode === 'canvas2d' && <CanvasAmbient onFatal={() => handleFatal('canvas2d')} />}
      {effectiveMode === 'webgl' && <WebglAmbient onFatal={() => handleFatal('webgl')} />}
    </div>
  );
}

export default AmbientCompositor;
