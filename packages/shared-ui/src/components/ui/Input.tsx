import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, hint, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-caption font-semibold text-text-secondary">{label}</label>
      )}
      <input
        className={`h-[40px] px-3 rounded-md border bg-surface-container text-body placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
          error ? 'border-dobara-error focus:ring-dobara-error' : 'border-border'
        } ${className}`}
        {...props}
      />
      {error && <span className="text-caption text-dobara-error">{error}</span>}
      {hint && !error && <span className="text-caption text-text-muted">{hint}</span>}
    </div>
  );
};
