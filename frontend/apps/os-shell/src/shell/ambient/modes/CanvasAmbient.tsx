import React from 'react';

type Props = { onFatal: () => void };

export function CanvasAmbient({ onFatal }: Props) {
  const ref = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('2D context unavailable');

      let raf = 0;
      const resize = () => {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(window.innerWidth * dpr);
        canvas.height = Math.floor(window.innerHeight * dpr);
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();
      window.addEventListener('resize', resize);

      const tick = () => {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
      };
    } catch {
      onFatal();
    }
  }, [onFatal]);

  return <canvas ref={ref} className='h-full w-full' />;
}

export default CanvasAmbient;
