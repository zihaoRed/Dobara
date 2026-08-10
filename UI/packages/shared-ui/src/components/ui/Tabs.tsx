import React, { useState } from 'react';

interface Tab {
  key: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onChange: (key: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  const [internalActive, setInternalActive] = useState(tabs[0]?.key || '');
  const current = activeTab ?? internalActive;

  const handleChange = (key: string) => {
    setInternalActive(key);
    onChange(key);
  };

  return (
    <div className={`flex border-b border-border ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => handleChange(tab.key)}
          className={`px-4 py-3 text-body font-medium transition-colors relative ${
            current === tab.key
              ? 'text-primary-500'
              : 'text-text-muted hover:text-text-body'
          }`}
        >
          {tab.label}
          {current === tab.key && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
};
