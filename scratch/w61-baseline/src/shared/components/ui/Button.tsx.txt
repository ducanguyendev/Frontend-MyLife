import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost' | 'danger' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-[var(--motion-fast)] ease-[var(--motion-ease)] cursor-pointer select-none active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed';

    // Variant styles
    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-[var(--action-primary)] text-[var(--on-action-primary)] hover:bg-[var(--brand-primary-hover)] active:bg-[var(--brand-primary-pressed)] shadow-[var(--shadow-xs)] border border-transparent',
      secondary:
        'bg-[var(--surface-primary)] text-primary-text border border-custom-border hover:bg-[var(--surface-secondary)] shadow-sm',
      tertiary:
        'bg-[var(--brand-primary-soft)] text-primary-text border border-transparent hover:brightness-[0.97]',
      outline:
        'bg-transparent text-accent border border-accent/40 hover:bg-accent/10 hover:border-accent',
      ghost:
        'bg-transparent text-secondary-text hover:text-primary-text hover:bg-custom-border/40',
      danger:
        'bg-[var(--state-danger)] text-[var(--on-danger)] hover:brightness-95 shadow-[var(--shadow-xs)] border border-transparent',
      destructive:
        'bg-[var(--state-danger)] text-[var(--on-danger)] hover:brightness-95 border border-transparent',
    };

    // Size styles
    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2.5 gap-2',
      lg: 'text-base px-6 py-3 gap-2.5',
    };

    return (
      <button
        ref={ref}
        type="button"
        data-ui-button
        aria-busy={isLoading || undefined}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
            <span className="inline-flex items-center justify-center gap-2">{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            <span className="inline-flex items-center justify-center gap-2">{children}</span>
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
