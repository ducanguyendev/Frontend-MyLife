import { Plus } from 'lucide-react';
import { Button } from './Button';

interface FloatingAddButtonProps {
  ariaLabel: string;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
}

/** Circular add action shared by FamilyTree and Anniversary. */
export function FloatingAddButton({ ariaLabel, tooltip, onClick, disabled = false }: FloatingAddButtonProps) {
  return <Button
    variant="primary"
    className="!p-3 !rounded-full aspect-square"
    aria-label={ariaLabel}
    title={tooltip}
    disabled={disabled}
    onClick={onClick}
  >
    <Plus size={20} />
  </Button>;
}
