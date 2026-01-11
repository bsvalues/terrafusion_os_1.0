export const TFSpiralIris = ({ className }: { className?: string }) => (
  <svg
    viewBox='0 0 100 100'
    className={className}
    width='64'
    height='64'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <circle cx='50' cy='50' r='48' stroke='var(--terra-cyan)' strokeWidth='2' />
    <path d='M50 10 L50 90' stroke='var(--terra-cyan)' strokeWidth='1' opacity='0.5' />
    <path d='M10 50 L90 50' stroke='var(--terra-cyan)' strokeWidth='1' opacity='0.5' />
    {/* Placeholder for 7-blade iris geometry */}
  </svg>
);
