import React from 'react';
import { Check } from 'lucide-react';

interface StepperProps {
  steps: { key: string; label: string }[];
  current: number;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({ steps, current, className = '' }) => {
  return (
    <div className={`flex items-center ${className}`}>
      {steps.map((step, i) => (
        <React.Fragment key={step.key}>
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-caption font-semibold transition-colors ${
                i < current
                  ? 'bg-primary-500 text-white'
                  : i === current
                  ? 'bg-primary-500 text-white ring-2 ring-primary-200'
                  : 'bg-surface-high text-text-muted'
              }`}
            >
              {i < current ? <Check size={14} /> : i + 1}
            </div>
            <span
              className={`text-caption font-medium ${
                i <= current ? 'text-text-primary' : 'text-text-muted'
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-3 transition-colors ${
                i < current ? 'bg-primary-500' : 'bg-surface-high'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
