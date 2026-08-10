import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  closable?: boolean;
  children: React.ReactNode;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  size = 'md',
  closable = true,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={closable ? onClose : undefined} />
      <div
        className={`relative w-full ${sizeClasses[size]} mx-4 bg-surface-container rounded-xl shadow-modal p-6 z-10`}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h4 font-heading text-text-primary">{title}</h2>
            {closable && (
              <button onClick={onClose} className="p-1 rounded-md hover:bg-surface-high transition-colors">
                <X size={20} className="text-text-muted" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
