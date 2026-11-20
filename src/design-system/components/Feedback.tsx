import type { ReactNode } from 'react';
import { AlertCircle, LoaderCircle } from 'lucide-react';
import { EmptyState } from './Foundations';

export function Loading({ label }: { label: string }) {
  return <div role="status" className="ds-feedback"><LoaderCircle size={24} className="animate-spin text-accent" aria-hidden="true"/><span>{label}</span></div>;
}
export function ErrorState({ message, action }: { message: ReactNode; action?: ReactNode }) {
  return <div role="alert" className="ds-feedback ds-feedback--error"><AlertCircle size={24} aria-hidden="true"/><p>{message}</p>{action}</div>;
}
export function InlineError({ children }: { children: ReactNode }) {
  return <p role="alert" className="ds-inline-error"><AlertCircle size={15} aria-hidden="true"/><span>{children}</span></p>;
}
export { EmptyState };
