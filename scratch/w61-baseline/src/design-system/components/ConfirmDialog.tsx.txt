import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';

export function ConfirmDialog({ isOpen, title, children, confirmLabel, cancelLabel, busy = false, onClose, onConfirm }: {
  isOpen: boolean; title: string; children: ReactNode; confirmLabel: string; cancelLabel: string; busy?: boolean; onClose: () => void; onConfirm: () => void;
}) {
  return <Modal isOpen={isOpen} onClose={() => { if (!busy) onClose(); }} title={title} maxWidth="sm" closeOnEsc={!busy} closeOnBackdropClick={!busy}
    footer={<><Button variant="secondary" disabled={busy} onClick={onClose}>{cancelLabel}</Button><Button variant="destructive" isLoading={busy} onClick={onConfirm}>{confirmLabel}</Button></>}>
    <div className="mb-4 inline-grid size-11 place-items-center rounded-2xl bg-[var(--state-danger-soft)] text-[var(--state-danger)]"><AlertTriangle size={22}/></div>
    <div className="text-sm leading-6 text-secondary-text">{children}</div>
  </Modal>;
}
