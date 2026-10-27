import React from 'react';

export type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'error' | 'outline';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-bold tracking-wider uppercase rounded-full select-none';

  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-custom-border/50 text-secondary-text border border-custom-border',
    accent: 'bg-accent/15 text-accent border border-accent/30',
    success: 'bg-success/15 text-success border border-success/30',
    warning: 'bg-amber-500/15 text-amber-500 border border-amber-500/30',
    error: 'bg-error/15 text-error border border-error/30',
    outline: 'bg-transparent text-primary-text border border-custom-border',
  };

  return (
    <span
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
