import React from 'react';
import { Search, Camera, Mic } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showExtras?: boolean;
  onCameraClick?: () => void;
  onMicClick?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  showExtras = false,
  onCameraClick,
  onMicClick,
}) => {
  return (
    <div className={`relative ${className}`}>
      <Search
        size={18}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full h-[44px] pl-10 ${showExtras ? 'pr-20' : 'pr-4'} rounded-full border border-border bg-surface-container text-body placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm`}
      />
      {showExtras && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            type="button"
            onClick={onCameraClick}
            className="p-1.5 rounded-full text-text-muted hover:text-primary-500 hover:bg-primary-50"
            aria-label="Image search"
          >
            <Camera size={18} />
          </button>
          <button
            type="button"
            onClick={onMicClick}
            className="p-1.5 rounded-full text-text-muted hover:text-primary-500 hover:bg-primary-50"
            aria-label="Voice search"
          >
            <Mic size={18} />
          </button>
        </div>
      )}
    </div>
  );
};
