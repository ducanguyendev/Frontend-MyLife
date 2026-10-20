import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export interface FamilyRelationOption {
  id: number;
  fullName: string;
  generation: number;
}

export interface FamilyRelationSelectProps {
  value?: number;
  options: FamilyRelationOption[];
  placeholder: string;
  generationLabel: string;
  label?: string;
  disabled?: boolean;
  onChange: (memberId: number | undefined) => void;
  ariaLabel?: string;
}

export const toggleFamilyRelationSelection = (currentValue: number | undefined, selectedMemberId: number): number | undefined =>
  currentValue === selectedMemberId ? undefined : selectedMemberId;

export const FamilyRelationSelect: React.FC<FamilyRelationSelectProps> = ({
  value,
  options,
  placeholder,
  generationLabel,
  label,
  disabled = false,
  onChange,
  ariaLabel,
}) => {
  const listboxId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState<React.CSSProperties>({});
  const selected = options.find((option) => option.id === value);
  const formatOption = (option: FamilyRelationOption) => `${option.fullName} (${generationLabel} ${option.generation})`;

  const close = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const availableBelow = window.innerHeight - rect.bottom - 14;
    const availableAbove = rect.top - 14;
    const placeBelow = availableBelow >= Math.min(240, options.length * 40 + 12) || availableBelow >= availableAbove;
    const maxHeight = Math.max(100, Math.min(320, placeBelow ? availableBelow : availableAbove));
    setPosition({
      position: "fixed",
      left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)),
      width: rect.width,
      maxHeight,
      ...(placeBelow ? { top: rect.bottom + 6 } : { bottom: window.innerHeight - rect.top + 6 }),
      zIndex: 1000,
    });
  }, [options.length]);

  const openList = () => {
    if (disabled) return;
    const selectedIndex = options.findIndex((option) => option.id === value);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const selectOption = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(toggleFamilyRelationSelection(value, option.id));
    close(true);
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();
    requestAnimationFrame(() => listboxRef.current?.focus());
    const reposition = () => updatePosition();
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !listboxRef.current?.contains(target)) close();
    };
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, options.length, updatePosition]);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const popup = open && typeof document !== "undefined" ? createPortal(
    <div
      id={listboxId}
      ref={listboxRef}
      role="listbox"
      aria-label={label ?? ariaLabel ?? placeholder}
      aria-activedescendant={options[activeIndex] ? `${listboxId}-option-${options[activeIndex].id}` : undefined}
      tabIndex={0}
      style={position}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setActiveIndex((index) => options.length ? (index + 1) % options.length : 0);
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          setActiveIndex((index) => options.length ? (index - 1 + options.length) % options.length : 0);
        } else if (event.key === "Home") {
          event.preventDefault();
          setActiveIndex(0);
        } else if (event.key === "End") {
          event.preventDefault();
          setActiveIndex(Math.max(0, options.length - 1));
        } else if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectOption(activeIndex);
        } else if (event.key === "Escape" || event.key === "Tab") {
          if (event.key === "Escape") event.preventDefault();
          close(event.key === "Escape");
        }
      }}
      className="overflow-y-auto rounded-2xl border border-custom-border bg-secondary-bg p-1.5 text-primary-text shadow-xl outline-none"
    >
      {options.map((option, index) => {
        const isSelected = option.id === value;
        return (
          <div
            key={option.id}
            ref={(element) => { optionRefs.current[index] = element; }}
            role="option"
            id={`${listboxId}-option-${option.id}`}
            aria-selected={isSelected}
            onMouseMove={() => setActiveIndex(index)}
            onClick={() => selectOption(index)}
            className={`relative flex min-h-10 cursor-pointer select-none items-center rounded-xl py-2 pl-3 pr-9 text-sm text-primary-text outline-none ${activeIndex === index ? "bg-accent/10" : ""}`}
          >
            <span className="min-w-0 flex-1 truncate">{formatOption(option)}</span>
            {isSelected && <Check size={16} aria-hidden="true" className="absolute right-3 text-accent" />}
          </div>
        );
      })}
    </div>,
    document.body,
  ) : null;

  return (
    <div className="flex w-full flex-col">
      {label && <span className="mb-1.5 px-1 text-xs font-semibold text-secondary-text">{label}</span>}
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel ?? placeholder}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        disabled={disabled}
        onClick={() => open ? close() : openList()}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openList();
          }
        }}
        className="flex min-h-[56px] w-full items-center justify-between gap-2 rounded-2xl border border-custom-border bg-primary-bg px-4 py-3 text-left text-sm font-medium text-primary-text outline-none transition-all hover:border-custom-border/80 focus:border-[var(--focus-border)]   disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={`min-w-0 flex-1 truncate ${selected ? "text-primary-text" : "text-secondary-text"}`}>
          {selected ? formatOption(selected) : placeholder}
        </span>
        <ChevronDown size={18} aria-hidden="true" className="shrink-0 text-secondary-text" />
      </button>
      {popup}
    </div>
  );
};
