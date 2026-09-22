import React from 'react';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  padding?: CardPadding;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, hoverEffect = false, padding = 'md', className = '', ...props }, ref) => {
    const paddingStyles: Record<CardPadding, string> = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const hoverStyles = hoverEffect
      ? 'hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl hover:shadow-accent/5 transition-all duration-300'
      : '';

    return (
      <div
        ref={ref}
        className={`bg-secondary-bg border border-custom-border rounded-2xl shadow-sm ${paddingStyles[padding]} ${hoverStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
