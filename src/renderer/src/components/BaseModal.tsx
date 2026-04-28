import { ReactNode, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useClickAway, useKey, useLockBodyScroll } from "react-use";

interface BaseModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function BaseModal({ open, title, onClose, children, footer }: BaseModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useLockBodyScroll(open);

  useKey(
    "Escape",
    () => {
      if (open) {
        onClose();
      }
    },
    {},
    [open, onClose]
  );

  useClickAway(dialogRef, () => {
    if (open) {
      onClose();
    }
  });

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 h-screen w-screen overflow-y-auto p-4">
      <div className="fixed inset-0 bg-slate-950/12" aria-hidden="true" />

      <div className="relative z-10 flex min-h-full items-center justify-center">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h3 id={titleId} className="text-xl font-semibold leading-7 text-slate-950">
              {title}
            </h3>
            <button
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors outline-none hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-950/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              type="button"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>

          <div className="px-5 py-4">{children}</div>

          {footer && <div className="border-t border-slate-200 px-5 py-4">{footer}</div>}
        </div>
      </div>
    </div>,
    document.body
  );
}
