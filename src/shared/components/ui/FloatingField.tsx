import type { ReactNode } from 'react';
import { normalizeRequiredLabel } from './FormFieldShell';
import { normalizeDisplayText } from '@/shared/utils/normalizeDisplayText';

/** The Member form's shared visual frame. Native controls retain their own behavior. */
export function FloatingField({ label, fieldId, active = false, hasValue = false, floating = true,
  alwaysFloating = false, required, error, disabled, density = 'default', multiline = false,
  leading, trailing, children,
}: {
  label?: string; fieldId?: string; active?: boolean; hasValue?: boolean; floating?: boolean;
  alwaysFloating?: boolean; required?: boolean; error?: string | null; disabled?: boolean;
  density?: 'default' | 'compact'; multiline?: boolean; leading?: ReactNode; trailing?: ReactNode; children: ReactNode;
}) {
  const usesLabel = floating && Boolean(label);
  return <div className="ds-field" data-field-shell data-floating={usesLabel || undefined}
    data-floated={usesLabel && (active || hasValue || alwaysFloating || Boolean(error)) || undefined}
    data-density={density} data-multiline={multiline || undefined} data-error={Boolean(error) || undefined}
    data-disabled={disabled || undefined} data-leading={Boolean(leading) || undefined} data-trailing={Boolean(trailing) || undefined}>
    {leading && <span className="ds-field__leading" aria-hidden="true">{leading}</span>}
    {children}
    {usesLabel && <label className="ds-field__label" htmlFor={fieldId}>
      {normalizeDisplayText(normalizeRequiredLabel(label, Boolean(required)))}
      {required && <span aria-hidden="true" className="ds-field__required">*</span>}
    </label>}
    {trailing && <span className="ds-field__trailing">{trailing}</span>}
  </div>;
}
