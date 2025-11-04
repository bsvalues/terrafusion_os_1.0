'use client';

import { forwardRef, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DropdownItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface DropdownProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  items: DropdownItem[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Dropdown = forwardRef<HTMLButtonElement, DropdownProps>(
  (
    {
      items,
      value,
      onChange,
      placeholder = 'Select an option',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className = '',
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedItem = items.find((item) => item.value === value);

    const baseClasses = 'block w-full rounded-lg border bg-gray-800 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200';
    
    const stateClasses = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-700 focus:border-blue-500 focus:ring-blue-500';

    const paddingClasses = leftIcon
      ? 'pl-10'
      : rightIcon
      ? 'pr-10'
      : 'px-4';

    return (
      <div className="w-full" ref={dropdownRef}>
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {leftIcon}
            </div>
          )}
          <button
            ref={ref}
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`
              ${baseClasses}
              ${stateClasses}
              ${paddingClasses}
              py-2
              text-left
              ${className}
            `}
            {...props}
          >
            <span className="block truncate">
              {selectedItem ? selectedItem.label : placeholder}
            </span>
          </button>
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {rightIcon}
            </div>
          )}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-10 mt-1 w-full rounded-md bg-gray-800 shadow-lg border border-gray-700"
              >
                <ul className="max-h-60 overflow-auto py-1">
                  {items.map((item) => (
                    <li
                      key={item.value}
                      className={`
                        relative cursor-pointer select-none py-2 pl-3 pr-9
                        ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}
                      `}
                      onClick={() => {
                        if (!item.disabled) {
                          onChange?.(item.value);
                          setIsOpen(false);
                        }
                      }}
                    >
                      <div className="flex items-center">
                        {item.icon && (
                          <span className="mr-3">{item.icon}</span>
                        )}
                        <span className="block truncate text-white">
                          {item.label}
                        </span>
                      </div>
                      {value === item.value && (
                        <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-500">
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {(error || helperText) && (
          <p className={`mt-1 text-sm ${error ? 'text-red-500' : 'text-gray-400'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Dropdown.displayName = 'Dropdown';

export default Dropdown; 