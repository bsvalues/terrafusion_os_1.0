import React from 'react';
import {cn} from '@/lib/utils';

interface PageHeaderProps {children: React.ReactNode;
  className?: string;}

export const PageHeader: React.FC<PageHeaderProps>= ({children, className}) => {
  return (<div className={cn('flex flex-col space-y-2 pb-6 border-b border-gray-200', className)}>{children}</div>
  );
};

interface PageHeaderTitleProps {children: React.ReactNode;
  className?: string;}

export const PageHeaderTitle: React.FC<PageHeaderTitleProps>= ({children, className}) => {
  return (<h1 className={cn('text-3xl font-bold tracking-tight text-gray-900', className)}>{children}</h1>
  );
};

interface PageHeaderDescriptionProps {children: React.ReactNode;
  className?: string;}

export const PageHeaderDescription: React.FC<PageHeaderDescriptionProps>= ({children,
  className,}) => {
  return<p className={cn('text-lg text-gray-600', className)}>{children}</p>;
};
