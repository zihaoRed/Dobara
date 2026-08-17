import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Button, Tabs, Input } from '@dobara/ui';
import { Save, User } from 'lucide-react';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-h2 font-heading text-text-primary">Settings</h1>
        <p className="text-body text-text-muted mt-1">Manage your account preferences</p>
      </div>

      <Tabs
        tabs={[
          { key: 'profile', label: 'Profile' },
          { key: 'notifications', label: 'Notifications' },
          { key: 'security', label: 'Security' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <Card variant="default" className="mt-4">
        <CardContent>
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-border">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                  <User size={32} className="text-primary-500" />
                </div>
                <div>
                  <h3 className="text-h4 font-heading text-text-primary">Demo User</h3>
                  <p className="text-body text-text-muted">demo@dobara.in</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Full Name" defaultValue="Demo User" />
                <Input label="Email" defaultValue="demo@dobara.in" />
                <Input label="Phone" defaultValue="+91-9876500000" />
                <Input label="Timezone" defaultValue="Asia/Kolkata (IST)" />
              </div>
              <div className="flex justify-end">
                <Button variant="primary" icon={<Save size={18} />}>Save Changes</Button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h3 className="text-h4 font-heading text-text-primary">Notification Preferences</h3>
              <div className="space-y-3">
                {[
                  { key: 'email', label: 'Email Notifications', desc: 'Receive email digests' },
                  { key: 'inapp', label: 'In-App Notifications', desc: 'Real-time in-app alerts' },
                  { key: 'review', label: 'Review Alerts', desc: 'New devices pending review' },
                  { key: 'price', label: 'Pricing Updates', desc: 'Base price change notifications' },
                  { key: 'settlement', label: 'Settlement Reminders', desc: 'Upcoming settlement deadlines' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center justify-between p-3 rounded-md hover:bg-surface-low cursor-pointer">
                    <div>
                      <div className="text-body font-semibold text-text-primary">{item.label}</div>
                      <div className="text-caption text-text-muted">{item.desc}</div>
                    </div>
                    <input type="checkbox" defaultChecked className="accent-primary-500 w-4 h-4" />
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-h4 font-heading text-text-primary">Security Settings</h3>
              <div className="space-y-4">
                <Input label="Current Password" type="password" placeholder="Enter current password" />
                <Input label="New Password" type="password" placeholder="Enter new password" />
                <Input label="Confirm New Password" type="password" placeholder="Confirm new password" />
              </div>
              <div className="flex justify-end">
                <Button variant="primary" icon={<Save size={18} />}>Update Password</Button>
              </div>

              <div className="pt-6 border-t border-border">
                <h4 className="text-h4 font-heading text-text-primary mb-2">Session Info</h4>
                <div className="p-3 bg-surface-low rounded-md text-body text-text-secondary">
                  <div>Last login: 2026-07-31 09:15 AM IST</div>
                  <div className="text-caption text-text-muted mt-1">Demo Mode — Sessions are not persisted</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
