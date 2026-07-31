import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Button, Tabs, Input } from '@dobara/ui';
import { Save, Plus, Trash2 } from 'lucide-react';

const defaultEnKeys: Record<string, string> = {
  'review.title': 'Review Workbench',
  'review.approve': 'Approve',
  'review.reject': 'Reject',
  'dashboard.title': 'Dashboard',
  'dashboard.pending': 'Pending Review',
  'pricing.title': 'Pricing Configuration',
  'category.title': 'Category Management',
  'settings.title': 'Settings',
};

const I18nMgmt: React.FC = () => {
  const [activeTab, setActiveTab] = useState('en');
  const [entries, setEntries] = useState(defaultEnKeys);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const addEntry = () => {
    if (!newKey.trim() || !newValue.trim()) return;
    setEntries({ ...entries, [newKey]: newValue });
    setNewKey('');
    setNewValue('');
  };

  const updateEntry = (key: string, value: string) => {
    setEntries({ ...entries, [key]: value });
  };

  const removeEntry = (key: string) => {
    const next = { ...entries };
    delete next[key];
    setEntries(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 font-heading text-text-primary">i18n Management</h1>
          <p className="text-body text-text-muted mt-1">Manage multilingual translation strings</p>
        </div>
        <Button variant="primary" icon={<Save size={18} />}>Save Changes</Button>
      </div>

      <Tabs
        tabs={[
          { key: 'en', label: 'English (en)' },
          { key: 'hi', label: 'Hindi (hi)' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <Card variant="default" className="mt-4">
        <CardContent>
          {activeTab === 'en' ? (
            <>
              <div className="flex items-end gap-3 mb-6 pb-4 border-b border-border">
                <Input
                  label="Translation Key"
                  placeholder="e.g. review.approve"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="flex-1"
                />
                <Input
                  label="English Value"
                  placeholder="e.g. Approve"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="flex-1"
                />
                <Button variant="secondary" icon={<Plus size={16} />} onClick={addEntry}>Add</Button>
              </div>

              <div className="space-y-2">
                <div className="flex text-eyebrow font-semibold text-text-muted uppercase tracking-wider px-2">
                  <span className="flex-1">Key</span>
                  <span className="flex-1">English</span>
                  <span className="w-16"></span>
                </div>
                {Object.entries(entries).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3 p-2 hover:bg-surface-low rounded-md">
                    <span className="flex-1 text-body font-mono text-text-secondary text-sm truncate">{key}</span>
                    <input
                      value={value}
                      onChange={(e) => updateEntry(key, e.target.value)}
                      className="flex-1 h-[36px] px-3 rounded-md border border-border bg-surface-container text-body focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <Button variant="ghost" size="sm" onClick={() => removeEntry(key)}>
                      <Trash2 size={14} className="text-text-muted" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-body text-text-muted">
              Hindi translations — upload or edit the hi.json file
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default I18nMgmt;
