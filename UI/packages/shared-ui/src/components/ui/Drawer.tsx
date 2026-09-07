import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Drawer width class, default 280px */
  widthClassName?: string;
  children: React.ReactNode;
}

/**
 * Left slide-in drawer for mobile module navigation.
 * Overlay click / X closes; body scroll locked while open (same behavior as Modal).
 */
export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  title,
  widthClassName = 'w-[280px]',
  children,
}) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside
        className={`absolute left-0 top-0 bottom-0 ${widthClassName} max-w-[85vw] bg-surface-container border-r border-border shadow-modal flex flex-col`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          {title ? (
            <h2 className="text-h4 font-heading text-text-primary">{title}</h2>
          ) : (
            <span />
          )}
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="p-1.5 -mr-1 rounded-md hover:bg-surface-high transition-colors"
          >
            <X size={20} className="text-text-muted" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </aside>
    </div>
  );
};
