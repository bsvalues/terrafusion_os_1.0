/**
 * Wallpaper Component
 * Includes TerraSphere as an ambient background element
 */

export function Wallpaper() {
  return (
    <div className='tahoe-wallpaper'>
      {/* TerraSphere ambient layer - using the existing component */}
      <div className='tahoe-terrasphere-layer'>
        {/* TerraSphere WebGL would go here - using simple SVG version for now */}
        <svg
          width='100%'
          height='100%'
          viewBox='0 0 800 800'
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '800px',
            maxHeight: '800px',
          }}
        >
          {/* Outer glow rings */}
          <circle
            cx='400'
            cy='400'
            r='350'
            fill='none'
            stroke='url(#outerGlow)'
            strokeWidth='2'
            opacity='0.3'
          />
          <circle
            cx='400'
            cy='400'
            r='300'
            fill='none'
            stroke='url(#outerGlow)'
            strokeWidth='2'
            opacity='0.4'
          />

          {/* Main sphere wireframe */}
          <g opacity='0.6'>
            {/* Horizontal latitude lines */}
            {[0, 1, 2, 3, 4].map((i) => {
              const y = 200 + i * 100;
              const rx = Math.sqrt(40000 - Math.pow(y - 400, 2));
              return (
                <ellipse
                  key={`lat-${i}`}
                  cx='400'
                  cy={y}
                  rx={rx}
                  ry='20'
                  fill='none'
                  stroke='#00ffff'
                  strokeWidth='1'
                  opacity='0.4'
                />
              );
            })}

            {/* Vertical longitude lines */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const angle = (i * 30 * Math.PI) / 180;
              return (
                <ellipse
                  key={`lon-${i}`}
                  cx='400'
                  cy='400'
                  rx='200'
                  ry='200'
                  fill='none'
                  stroke='#00ffff'
                  strokeWidth='1'
                  opacity='0.4'
                  transform={`rotate(${i * 30} 400 400)`}
                />
              );
            })}
          </g>

          {/* Core sphere with gradient */}
          <circle cx='400' cy='400' r='180' fill='url(#coreGradient)' opacity='0.8' />

          {/* Inner energy rings */}
          <circle
            cx='400'
            cy='400'
            r='150'
            fill='none'
            stroke='url(#energyRing)'
            strokeWidth='2'
            opacity='0.6'
          >
            <animate attributeName='r' values='150;155;150' dur='3s' repeatCount='indefinite' />
            <animate
              attributeName='opacity'
              values='0.6;0.8;0.6'
              dur='3s'
              repeatCount='indefinite'
            />
          </circle>

          {/* Central core */}
          <circle cx='400' cy='400' r='60' fill='url(#centralCore)'>
            <animate attributeName='r' values='60;65;60' dur='2s' repeatCount='indefinite' />
          </circle>

          {/* Orbital particles */}
          <g opacity='0.8'>
            <circle cx='300' cy='300' r='4' fill='#00ffff'>
              <animateTransform
                attributeName='transform'
                type='rotate'
                from='0 400 400'
                to='360 400 400'
                dur='10s'
                repeatCount='indefinite'
              />
            </circle>
            <circle cx='500' cy='350' r='3' fill='#0080ff'>
              <animateTransform
                attributeName='transform'
                type='rotate'
                from='0 400 400'
                to='360 400 400'
                dur='15s'
                repeatCount='indefinite'
              />
            </circle>
            <circle cx='350' cy='500' r='3' fill='#00ff88'>
              <animateTransform
                attributeName='transform'
                type='rotate'
                from='0 400 400'
                to='360 400 400'
                dur='12s'
                repeatCount='indefinite'
              />
            </circle>
          </g>

          {/* Gradients */}
          <defs>
            <radialGradient id='coreGradient' cx='0.3' cy='0.3' r='0.8'>
              <stop offset='0%' stopColor='#00ffff' stopOpacity='0.9' />
              <stop offset='50%' stopColor='#0080ff' stopOpacity='0.6' />
              <stop offset='100%' stopColor='#0a0e1a' stopOpacity='0.8' />
            </radialGradient>

            <radialGradient id='centralCore' cx='0.5' cy='0.5' r='0.5'>
              <stop offset='0%' stopColor='#00ffff' stopOpacity='1' />
              <stop offset='100%' stopColor='#0080ff' stopOpacity='0.8' />
            </radialGradient>

            <linearGradient id='outerGlow'>
              <stop offset='0%' stopColor='#00ffff' stopOpacity='0.6' />
              <stop offset='100%' stopColor='#0080ff' stopOpacity='0.2' />
            </linearGradient>

            <linearGradient id='energyRing'>
              <stop offset='0%' stopColor='#00ffff' stopOpacity='0.8' />
              <stop offset='50%' stopColor='#00ff88' stopOpacity='0.6' />
              <stop offset='100%' stopColor='#0080ff' stopOpacity='0.8' />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
