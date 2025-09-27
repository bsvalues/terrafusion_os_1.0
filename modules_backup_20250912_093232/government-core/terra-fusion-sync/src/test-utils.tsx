import {render, RenderOptions} from '@testing-library/react';
import {ReactElement} from 'react';

// Mock test utils to prevent import errors
const AllTheProviders = ({children}: {children: React.ReactNode}) =>{
  return<div>{children}</div>;
};

const renderWithProviders = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, {wrapper: AllTheProviders, ...options});

export {renderWithProviders};
