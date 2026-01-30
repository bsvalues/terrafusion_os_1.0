/**
 * ═══════════════════════════════════════════════════════════════
 * QUANTUM FORM COMPONENTS - TERRAFUSION DESIGN SYSTEM
 * Advanced form controls with terra-cyan theming and quantum effects
 * ═══════════════════════════════════════════════════════════════
 */

import { cn } from '@utils/cn';
import * as React from 'react';
import { useId, useRef, useState } from 'react';
import './QuantumFormComponents.css';

/* ═══ SELECT COMPONENT ═══ */
interface QuantumSelectProps {
  label?: string;
  placeholder?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  glow?: boolean;
  quantum?: boolean;
  variant?: 'default' | 'glass' | 'quantum';
  className?: string;
}

export const QuantumSelect: React.FC<QuantumSelectProps> = ({
  label,
  placeholder = 'Select an option...',
  options,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  glow = false,
  quantum = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={cn('quantum-select-container', className)}>
      {label && (
        <label htmlFor={selectId} className='quantum-select-label'>
          {label}
          {required && <span className='text-red-400 ml-1'>*</span>}
        </label>
      )}

      <div className='relative' ref={containerRef}>
        <button
          id={selectId}
          type='button'
          className={cn('quantum-select-trigger', {
            'quantum-select-error': error,
            'quantum-select-disabled': disabled,
            'quantum-select-glow': glow,
            'quantum-select-quantum': quantum,
            'quantum-select-open': isOpen,
          })}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          aria-expanded={isOpen}
          aria-haspopup='listbox'
          aria-label={label || placeholder}
        >
          <span
            className={cn('quantum-select-value', !selectedOption && 'quantum-select-placeholder')}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className={cn('quantum-select-chevron', isOpen && 'quantum-select-chevron-open')}>
            <svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor'>
              <path d='M4.5 6l3.5 3.5L11.5 6h-7z' />
            </svg>
          </div>
        </button>

        {isOpen && !disabled && (
          <div className='quantum-select-dropdown'>
            <div className='quantum-select-options' role='listbox' aria-label='Select options'>
              {options.map((option) => (
                <button
                  key={option.value}
                  type='button'
                  className={cn('quantum-select-option', {
                    'quantum-select-option-selected': value === option.value,
                    'quantum-select-option-disabled': option.disabled,
                  })}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  disabled={option.disabled}
                  role='option'
                  aria-selected={value === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && <div className='quantum-form-error'>{error}</div>}
    </div>
  );
};

/* ═══ CHECKBOX COMPONENT ═══ */
interface QuantumCheckboxProps {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  glow?: boolean;
  quantum?: boolean;
  variant?: 'default' | 'glass' | 'quantum';
  className?: string;
  children?: React.ReactNode;
}

export const QuantumCheckbox: React.FC<QuantumCheckboxProps> = ({
  label,
  checked = false,
  onChange,
  disabled = false,
  required = false,
  error,
  glow = false,
  quantum = false,
  className,
  children,
}) => {
  const checkboxId = useId();

  return (
    <div className={cn('quantum-checkbox-container', className)}>
      <label
        htmlFor={checkboxId}
        className={cn('quantum-checkbox-label', {
          'quantum-checkbox-disabled': disabled,
          'quantum-checkbox-error': error,
        })}
      >
        <div className='quantum-checkbox-wrapper'>
          <input
            id={checkboxId}
            type='checkbox'
            checked={checked}
            onChange={(e) => onChange?.(e.target.checked)}
            disabled={disabled}
            required={required}
            className='quantum-checkbox-input'
          />
          <div
            className={cn('quantum-checkbox-box', {
              'quantum-checkbox-checked': checked,
              'quantum-checkbox-glow': glow,
              'quantum-checkbox-quantum': quantum,
            })}
          >
            {checked && (
              <svg
                className='quantum-checkbox-checkmark'
                width='12'
                height='12'
                viewBox='0 0 12 12'
                fill='none'
              >
                <path
                  d='M2 6l2.5 2.5L10 3'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            )}
          </div>
        </div>

        {(label || children) && (
          <div className='quantum-checkbox-text'>
            {label}
            {children}
            {required && <span className='text-red-400 ml-1'>*</span>}
          </div>
        )}
      </label>

      {error && <div className='quantum-form-error'>{error}</div>}
    </div>
  );
};

/* ═══ RADIO GROUP COMPONENT ═══ */
interface QuantumRadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface QuantumRadioGroupProps {
  label?: string;
  options: QuantumRadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  glow?: boolean;
  quantum?: boolean;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'glass' | 'quantum';
  layout?: 'horizontal' | 'vertical';
  name?: string;
  className?: string;
}

export const QuantumRadioGroup: React.FC<QuantumRadioGroupProps> = ({
  label,
  options,
  value,
  onChange,
  disabled = false,
  required = false,
  error,
  glow = false,
  quantum = false,
  orientation = 'vertical',
  className,
}) => {
  const groupId = useId();

  return (
    <div className={cn('quantum-radio-container', className)}>
      {label && (
        <div className='quantum-radio-group-label'>
          {label}
          {required && <span className='text-red-400 ml-1'>*</span>}
        </div>
      )}

      <div
        className={cn('quantum-radio-group', `quantum-radio-${orientation}`)}
        role='radiogroup'
        aria-labelledby={label ? `${groupId}-label` : undefined}
      >
        {options.map((option, index) => {
          const radioId = `${groupId}-${index}`;
          const isSelected = value === option.value;
          const isDisabled = disabled || option.disabled;

          return (
            <label
              key={option.value}
              htmlFor={radioId}
              className={cn('quantum-radio-label', {
                'quantum-radio-disabled': isDisabled,
                'quantum-radio-error': error,
              })}
            >
              <div className='quantum-radio-wrapper'>
                <input
                  id={radioId}
                  type='radio'
                  name={groupId}
                  value={option.value}
                  checked={isSelected}
                  onChange={(e) => onChange?.(e.target.value)}
                  disabled={isDisabled}
                  required={required}
                  className='quantum-radio-input'
                />
                <div
                  className={cn('quantum-radio-circle', {
                    'quantum-radio-selected': isSelected,
                    'quantum-radio-glow': glow,
                    'quantum-radio-quantum': quantum,
                  })}
                >
                  {isSelected && <div className='quantum-radio-dot' />}
                </div>
              </div>

              <span className='quantum-radio-text'>{option.label}</span>
            </label>
          );
        })}
      </div>

      {error && <div className='quantum-form-error'>{error}</div>}
    </div>
  );
};

/* ═══ TEXTAREA COMPONENT ═══ */
interface QuantumTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  glow?: boolean;
  quantum?: boolean;
  variant?: 'default' | 'glass' | 'quantum';
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const QuantumTextarea: React.FC<QuantumTextareaProps> = ({
  label,
  error,
  glow = false,
  quantum = false,
  resize = 'vertical',
  className,
  required,
  ...props
}) => {
  const textareaId = useId();

  return (
    <div className='quantum-textarea-container'>
      {label && (
        <label htmlFor={textareaId} className='quantum-textarea-label'>
          {label}
          {required && <span className='text-red-400 ml-1'>*</span>}
        </label>
      )}

      <textarea
        id={textareaId}
        className={cn(
          'quantum-textarea',
          `quantum-textarea-resize-${resize}`,
          {
            'quantum-textarea-error': error,
            'quantum-textarea-glow': glow,
            'quantum-textarea-quantum': quantum,
          },
          className
        )}
        required={required}
        {...props}
      />

      {error && <div className='quantum-form-error'>{error}</div>}
    </div>
  );
};

/* ═══ FORM GROUP COMPONENT ═══ */
interface QuantumFormGroupProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'quantum';
  className?: string;
}

export const QuantumFormGroup: React.FC<QuantumFormGroupProps> = ({
  title,
  description,
  children,
  variant = 'default',
  className,
}) => {
  return (
    <div className={cn('quantum-form-group', `quantum-form-group-${variant}`, className)}>
      {(title || description) && (
        <div className='quantum-form-group-header'>
          {title && <h3 className='quantum-form-group-title'>{title}</h3>}
          {description && <p className='quantum-form-group-description'>{description}</p>}
        </div>
      )}

      <div className='quantum-form-group-content'>{children}</div>
    </div>
  );
};

/* ═══ SWITCH COMPONENT ═══ */
interface QuantumSwitchProps {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  quantum?: boolean;
  variant?: 'default' | 'glass' | 'quantum';
  className?: string;
}

export const QuantumSwitch: React.FC<QuantumSwitchProps> = ({
  label,
  checked = false,
  onChange,
  disabled = false,
  size = 'md',
  glow = false,
  quantum = false,
  className,
}) => {
  const switchId = useId();

  return (
    <div className={cn('quantum-switch-container', className)}>
      <label
        htmlFor={switchId}
        className={cn('quantum-switch-label', {
          'quantum-switch-disabled': disabled,
        })}
      >
        <input
          id={switchId}
          type='checkbox'
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
          className='quantum-switch-input'
        />

        <div
          className={cn('quantum-switch-track', `quantum-switch-${size}`, {
            'quantum-switch-checked': checked,
            'quantum-switch-glow': glow,
            'quantum-switch-quantum': quantum,
          })}
        >
          <div className='quantum-switch-thumb' />
        </div>

        {label && <span className='quantum-switch-text'>{label}</span>}
      </label>
    </div>
  );
};

/* ═══ EXPORT ALL COMPONENTS ═══ */
export {
  type QuantumCheckboxProps,
  type QuantumFormGroupProps,
  type QuantumRadioGroupProps,
  type QuantumSelectProps,
  type QuantumSwitchProps,
  type QuantumTextareaProps,
};
