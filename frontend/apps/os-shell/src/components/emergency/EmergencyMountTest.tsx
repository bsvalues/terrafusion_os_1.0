/**
 * Emergency React Mount Test
 * Minimal component to verify React is working
 */
import { useState } from 'react';
import { Z } from '../../shell/desktop/zIndex';

export function EmergencyMountTest() {
  const [counter, setCounter] = useState(0);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'var(--tf-void-black)',
        color: 'var(--tf-quantum-cyan)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif',
        zIndex: Z.overlay,
      }}
    >
      <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>🏛️ TERRAFUSION OS EMERGENCY TEST</h1>

      <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>React Mount Status: ✅ OPERATIONAL</p>

      <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
        Government. Transcended. Emergency Mode.
      </p>

      <button
        onClick={() => setCounter((c) => c + 1)}
        style={{
          padding: '1rem 2rem',
          fontSize: '1.2rem',
          background: 'linear-gradient(135deg, var(--tf-quantum-cyan), var(--tf-network-blue))',
          color: 'var(--tf-void-black)',
          border: 'none',
          borderRadius: '2rem',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        Test Counter: {counter}
      </button>

      <div
        style={{
          position: 'absolute',
          bottom: '2rem',
          fontSize: '1rem',
          opacity: 0.7,
        }}
      >
        If you can see this, React is mounting correctly. Issue is likely in the main TerraFusion
        components.
      </div>
    </div>
  );
}

export default EmergencyMountTest;
