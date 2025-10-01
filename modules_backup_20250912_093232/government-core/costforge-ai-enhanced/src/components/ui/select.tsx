import React from 'react';
import {cn} from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {className?: string;
  children: React.ReactNode;}

export const Select: React.FC<SelectProps>= ({className, children, ...props}) => {
  return (<select
      className={cn(
        'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >{children}</select>
  );
};

interface SelectContentProps {children: React.ReactNode;
  className?: string;}

export const SelectContent: React.FC<SelectContentProps>= ({children, className}) => {
  return<div className={className}>{children}</div>;
};

interface SelectItemProps {value: string;
  children: React.ReactNode;
  className?: string;}

export const SelectItem: React.FC<SelectItemProps>= ({value, children, className}) => {
  return (<option value={value} className={className}>{children}</option>
  );
};

interface SelectTriggerProps {children: React.ReactNode;
  className?: string;}

export const SelectTrigger: React.FC<SelectTriggerProps>= ({children, className}) => {
  return<div className={className}>{children}</div>;
};

interface SelectValueProps {placeholder?: string;
  className?: string;}

export const SelectValue: React.FC<SelectValueProps>= ({placeholder, className}) => {
  return<span className={className}>{placeholder}</span>;
};
