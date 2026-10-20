import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from './Input';
import type { InputProps } from './Input';

export interface PasswordInputProps extends Omit<InputProps, 'type'> {
  showToggle?: boolean;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showToggle = true, rightIcon, className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <Input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        className={`[&::-ms-reveal]:hidden [&::-ms-clear]:hidden ${className}`}
        rightIcon={
          showToggle ? (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="text-secondary-text hover:text-primary-text transition-colors p-1 rounded-md focus:outline-none cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          ) : (
            rightIcon
          )
        }
        {...props}
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
