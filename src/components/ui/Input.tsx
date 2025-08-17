import React from 'react';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type = 'text',
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    id,
    fullWidth = true,
    ...props 
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    const baseClasses = 'block rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 touch-target';
    
    const stateClasses = error
      ? 'border-error-300 focus:border-error-500 focus:ring-error-500'
      : 'border-secondary-300 focus:border-primary-500 focus:ring-primary-500 dark:border-secondary-600 dark:focus:border-primary-400';
    
    const paddingClasses = leftIcon || rightIcon
      ? leftIcon && rightIcon
        ? 'px-10 py-3 md:py-2.5'
        : leftIcon
          ? 'pl-10 pr-3 py-3 md:py-2.5'
          : 'pl-3 pr-10 py-3 md:py-2.5'
      : 'px-3 py-3 md:py-2.5';

    const widthClasses = fullWidth ? 'w-full' : 'w-auto';

    return (
      <div className="space-y-2 md:space-y-1">
        {label && (
          <label 
            htmlFor={inputId} 
            className="block text-sm md:text-sm font-medium text-secondary-700 dark:text-secondary-300"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-secondary-400 dark:text-secondary-500">
                {leftIcon}
              </span>
            </div>
          )}
          
          <input
            ref={ref}
            type={type}
            id={inputId}
            className={clsx(
              baseClasses,
              stateClasses,
              paddingClasses,
              widthClasses,
              'bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 placeholder-secondary-400 dark:placeholder-secondary-500 text-base md:text-sm',
              className
            )}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-secondary-400 dark:text-secondary-500">
                {rightIcon}
              </span>
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <p className={clsx(
            'text-sm',
            error ? 'text-error-600 dark:text-error-400' : 'text-secondary-500 dark:text-secondary-400'
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
