import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cx } from "@/lib/cx";
import { useReducedMotion } from "@/hooks/useMediaQuery";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  /** Element focused when the dialog opens (defaults to the first button). */
  initialFocus?: string;
  children: ReactNode;
}

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal: portal, focus trap, Esc to close, focus returns to the
 * element that opened it, page scroll locked while open.
 */
export function Modal({
  open,
  onClose,
  labelledBy,
  describedBy,
  initialFocus,
  children,
}: ModalProps) {
  const reduced = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const [wasOpen, setWasOpen] = useState(open);
  const [closing, setClosing] = useState(false);

  // When `open` flips to false, keep the dialog in the DOM for the 180 ms closing animation.
  if (open !== wasOpen) {
    setWasOpen(open);
    setClosing(!open && !reduced);
  }
  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(() => setClosing(false), 180);
    return () => clearTimeout(timer);
  }, [closing]);

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement as HTMLElement | null;
    document.documentElement.classList.add("oops-open");
    const target =
      (initialFocus && dialogRef.current?.querySelector<HTMLElement>(initialFocus)) ||
      dialogRef.current?.querySelector<HTMLElement>("button");
    target?.focus({ preventScroll: true });

    return () => {
      document.documentElement.classList.remove("oops-open");
      lastFocus.current?.focus?.({ preventScroll: true });
    };
  }, [open, initialFocus]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") return onClose();
      if (event.key !== "Tab") return;
      const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open && !closing) return null;

  return createPortal(
    <div
      ref={dialogRef}
      className={cx("oops", closing && "is-closing")}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
    >
      <div className="oops__backdrop" onClick={onClose} />
      {children}
    </div>,
    document.body,
  );
}
