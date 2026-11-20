import React from 'react';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardVariant = 'surface' | 'editorial' | 'information' | 'action';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  padding?: CardPadding;
  variant?: CardVariant;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, hoverEffect = false, padding = 'md', variant = 'surface', className = '', ...props }, ref) => {
    const paddingStyles: Record<CardPadding, string> = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const hoverStyles = hoverEffect
      ? 'hover:-translate-y-0.5 hover:border-[var(--brand-primary)]/50 hover:shadow-md transition-all duration-[var(--motion-normal)]'
      : '';
    const variants: Record<CardVariant, string> = {
      surface: 'bg-[var(--surface-primary)] border-custom-border shadow-[var(--shadow-sm)]',
      editorial: 'bg-[var(--surface-secondary)] border-[var(--border-subtle)] shadow-none',
      information: 'bg-[var(--brand-primary-soft)] border-transparent shadow-none',
      action: 'bg-[var(--surface-primary)] border-custom-border shadow-[var(--shadow-xs)] hover:border-[var(--brand-primary)]/50',
    };

    return (
      <div
        ref={ref}
        className={`border rounded-[var(--radius-lg)] ${variants[variant]} ${paddingStyles[padding]} ${hoverStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
