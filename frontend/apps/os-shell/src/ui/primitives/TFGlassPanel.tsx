import styled from '@emotion/styled';
import React from 'react';
import { TF_TOKENS } from '../theme/tokens';

const StyledPanel = styled.div<{ depth?: 'far' | 'mid' | 'near' }>`
  /* Law of Containment */
  border: 1px solid var(--glass-border);
  border-radius: ${TF_TOKENS.radius.panel};
  background: var(--glass-bg);
  backdrop-filter: blur(${TF_TOKENS.blur.substrate});
  padding: ${TF_TOKENS.spacing.lg};

  /* Law of Internal Flow */
  overflow: hidden;
  position: relative;

  /* Law of Phi Rhythm */
  transition:
    transform 0.618s var(--ease-phi),
    box-shadow 0.618s var(--ease-phi);

  &:hover {
    /* Internal Glow Only */
    box-shadow: inset 0 0 20px var(--glass-border);
    transform: translateY(-2px);
  }
`;

export const TFGlassPanel = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { depth?: 'far' | 'mid' | 'near' }) => {
  return (
    <StyledPanel className={`tf-focus-scope ${className || ''}`} {...props}>
      <div className='tf-focus-ring' aria-hidden='true' />
      {children}
    </StyledPanel>
  );
};
