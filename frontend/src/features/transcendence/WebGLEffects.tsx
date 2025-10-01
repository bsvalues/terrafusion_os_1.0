import React, { useEffect, useRef } from 'react';

export default function WebGLEffects() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const gl = canvas.getContext('2d'); // Placeholder; replace with Three.js/WebGL2
    let raf = 0; let t = 0;

    const onResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    onResize(); window.addEventListener('resize', onResize);

    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!gl) return;
      t += 0.01;
      gl.fillStyle = '#0b1020';
      gl.fillRect(0,0,canvas.width,canvas.height);
      for (let i=0; i<220; i++) {
        const x = (i/220)*canvas.width;
        const y = canvas.height/2 + Math.sin(t*2 + i*0.2)*22 + Math.sin(t + i*0.05)*10;
        gl.fillStyle = 'rgba(0,255,238,0.40)';
        gl.fillRect(x, y, 2, 2);
      }
    };
    loop();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);

  return <canvas ref={ref} style={{position:'fixed', inset:0, zIndex:0, pointerEvents:'none'}} />;
}