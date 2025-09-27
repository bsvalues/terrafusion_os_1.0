import React from 'react';
import {cn} from '@/lib/utils';

interface EnterpriseCardProps {children: React.ReactNode;
  className?: string;}

export const EnterpriseCard: React.FC<EnterpriseCardProps>= ({children, className}) => {
  return (<div className={cn('bg-white rounded-lg border border-gray-200 shadow-sm', className)}>{children}</div>
  );
};

interface EnterpriseCardHeaderProps {children: React.ReactNode;
  className?: string;}

export const EnterpriseCardHeader: React.FC<EnterpriseCardHeaderProps>= ({children,
  className,}) => {
  return<div className={cn('px-6 py-4 border-b border-gray-200', className)}>{children}</div>;
};

interface EnterpriseCardTitleProps {children: React.ReactNode;
  className?: string;}

export const EnterpriseCardTitle: React.FC<EnterpriseCardTitleProps>= ({children,
  className,}) => {
  return<h3 className={cn('text-lg font-semibold text-gray-900', className)}>{children}</h3>;
};

interface EnterpriseCardContentProps {children: React.ReactNode;
  className?: string;}

export const EnterpriseCardContent: React.FC<EnterpriseCardContentProps>= ({children,
  className,}) => {
  return<div className={cn('px-6 py-4', className)}>{children}</div>;
};
