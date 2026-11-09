import type { HTMLAttributes } from 'react';

/** Preserve native table semantics and horizontal access to dense columns on small screens. */
export function TableShell({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`ds-table-shell ${className}`}><div className="ds-table-scroll">{children}</div></div>;
}
