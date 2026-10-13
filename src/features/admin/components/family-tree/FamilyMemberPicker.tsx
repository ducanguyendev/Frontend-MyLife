import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export interface FamilyMemberPickerOption {
  id: number;
  fullName: string;
  generation: number;
  gender?: string;
}

export interface FamilyMemberPickerProps {
  options: FamilyMemberPickerOption[];
  placeholder: string;
  onSelect: (memberId: number) => void;
  generationLabel: string;
  disabled?: boolean;
  ariaLabel?: string;
  emptyMessage?: string;
}

export const FamilyMemberPicker: React.FC<FamilyMemberPickerProps> = ({
  options,
  placeholder,
  onSelect,
  generationLabel,
  disabled = false,
  ariaLabel,
  emptyMessage,
}) => {
  const popupId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState<React.CSSProperties>({});

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - 14;
    const above = rect.top - 14;
    const placeBelow = below >= Math.min(240, options.length * 44 + 12) || below >= above;
    setPosition({
      position: "fixed",
      left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)),
      width: rect.width,
      maxHeight: Math.max(100, Math.min(320, placeBelow ? below : above)),
      ...(placeBelow ? { top: rect.bottom + 6 } : { bottom: window.innerHeight - rect.top + 6 }),
      zIndex: 1000,
    });
  }, [options.length]);

  const close = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const closeAndMoveFocus = (backward: boolean) => {
    setOpen(false);
    requestAnimationFrame(() => {
      const focusable = Array.from(document.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      )).filter((element) => !popupRef.current?.contains(element));
      const triggerIndex = focusable.indexOf(triggerRef.current!);
      const targetIndex = backward ? triggerIndex - 1 : triggerIndex + 1;
      (focusable[targetIndex] ?? triggerRef.current)?.focus();
    });
  };

  const choose = (index: number) => {
    const option = options[index];
    if (!option) return;
    onSelect(option.id);
    close(true);
  };

  const openPopup = () => {
    if (disabled || options.length === 0) return;
    setActiveIndex(0);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();
    requestAnimationFrame(() => popupRef.current?.focus());
    const reposition = () => updatePosition();
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !popupRef.current?.contains(target)) close();
    };
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const popup = open && typeof document !== "undefined" ? createPortal(
    <div
      id={popupId}
      ref={popupRef}
      role="listbox"
      aria-label={ariaLabel ?? placeholder}
      aria-activedescendant={options[activeIndex] ? `${popupId}-option-${options[activeIndex].id}` : undefined}
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
          choose(activeIndex);
        } else if (event.key === "Escape" || event.key === "Tab") {
          event.preventDefault();
          if (event.key === "Escape") close(true);
          else closeAndMoveFocus(event.shiftKey);
        }
      }}
      className="overflow-y-auto rounded-2xl border border-custom-border bg-secondary-bg p-1.5 text-primary-text shadow-xl outline-none"
    >
      {options.map((option, index) => (
        <div
          key={option.id}
          id={`${popupId}-option-${option.id}`}
          ref={(element) => { optionRefs.current[index] = element; }}
          role="option"
          aria-selected={false}
          onMouseMove={() => setActiveIndex(index)}
          onClick={() => choose(index)}
          className={`flex min-h-10 cursor-pointer select-none items-center rounded-xl px-3 py-2 text-sm text-primary-text outline-none ${activeIndex === index ? "bg-accent/10" : ""}`}
        >
          <span className="min-w-0 flex-1 truncate">
            {option.fullName} ({generationLabel} {option.generation}{option.gender ? ` • ${option.gender}` : ""})
          </span>
        </div>
      ))}
    </div>,
    document.body,
  ) : null;

  return (
    <div className="flex w-full flex-col">
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel ?? placeholder}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? popupId : undefined}
        disabled={disabled || options.length === 0}
        onClick={() => open ? close() : openPopup()}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openPopup();
          }
        }}
        className="flex min-h-[56px] w-full items-center justify-between gap-2 rounded-2xl border border-custom-border bg-primary-bg px-4 py-3 text-left text-sm font-medium text-secondary-text outline-none transition-all hover:border-custom-border/80 focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="min-w-0 flex-1 truncate">{placeholder}</span>
        <ChevronDown size={18} aria-hidden="true" className="shrink-0 text-secondary-text" />
      </button>
      {options.length === 0 && emptyMessage && (
        <p className="mt-1 px-1 text-xs italic text-secondary-text">{emptyMessage}</p>
      )}
      {popup}
    </div>
  );
};
