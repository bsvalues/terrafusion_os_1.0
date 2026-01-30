import React from 'react';

type Props = { onFatal: () => void };

export function WebglAmbient({ onFatal }: Props) {
  const ref = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    try {
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) throw new Error('WebGL unavailable');

      return () => {
        // cleanup reserved for future WebGL resources
      };
    } catch {
      onFatal();
    }
  }, [onFatal]);

  return <canvas ref={ref} className='h-full w-full' />;
}

export default WebglAmbient;
