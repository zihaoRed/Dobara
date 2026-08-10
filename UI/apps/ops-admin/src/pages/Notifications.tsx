import React from 'react';
import { Card, CardContent, Badge } from '@dobara/ui';
import { Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const mockNotifications = [
  { id: 1, type: 'review', title: 'Review Completed', message: 'iPhone 13 #...0001 has been approved and listed', time: '5 min ago', priority: 'high', read: false },
  { id: 2, type: 'pricing', title: 'Price Adjustment Required', message: 'Galaxy S22 base price update pending approval', time: '30 min ago', priority: 'high', read: false },
  { id: 3, type: 'info', title: 'New Store Onboarded', message: 'Fonfix Koramangala has completed onboarding', time: '1 hour ago', priority: 'medium', read: false },
  { id: 4, type: 'qa', title: 'QC Report Available', message: 'Batch #2026-07-28A QC report is ready', time: '2 hours ago', priority: 'medium', read: true },
  { id: 5, type: 'review', title: 'Device Flagged', message: 'Reno 6 #...0015 flagged for manual review', time: '3 hours ago', priority: 'low', read: true },
  { id: 6, type: 'settlement', title: 'Settlement Due', message: 'MobileXchange Andheri settlement due in 2 days', time: '5 hours ago', priority: 'high', read: true },
];

const Notifications: React.FC = () => {
  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-h2 font-heading text-text-primary">Notifications</h1>
          <Badge variant="error">{mockNotifications.filter((n) => !n.read).length} new</Badge>
        </div>
        <p className="text-body text-text-muted mt-1">Review important alerts and updates</p>
      </div>

      <Card variant="default">
        <CardContent>
          <div className="space-y-1">
            {mockNotifications.map((n) => (
              <div
                key={n.id}
                className={`flex gap-4 p-4 rounded-md transition-colors ${
                  !n.read ? 'bg-primary-50/50' : 'hover:bg-surface-low'
                }`}
              >
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                  ${n.type === 'review' ? 'bg-dobara-info-light' : ''}
                  ${n.type === 'pricing' ? 'bg-dobara-warning-light' : ''}
                  ${n.type === 'qa' ? 'bg-primary-50' : ''}
                  ${n.type === 'settlement' ? 'bg-dobara-error-light' : ''}
                  ${n.type === 'info' ? 'bg-surface-high' : ''}
                `}>
                  {n.type === 'review' && <CheckCircle size={18} className="text-dobara-info" />}
                  {n.type === 'pricing' && <AlertTriangle size={18} className="text-dobara-warning" />}
                  {n.type === 'qa' && <CheckCircle size={18} className="text-primary-500" />}
                  {n.type === 'settlement' && <AlertTriangle size={18} className="text-dobara-error" />}
                  {n.type === 'info' && <Info size={18} className="text-text-muted" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`text-body font-semibold ${!n.read ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {n.title}
                    </h4>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />}
                  </div>
                  <p className="text-body text-text-muted">{n.message}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-caption text-text-muted">{n.time}</span>
                  {n.priority === 'high' && <Badge variant="error" size="sm">High</Badge>}
                  {n.priority === 'medium' && <Badge variant="warning" size="sm">Medium</Badge>}
                  {n.priority === 'low' && <Badge variant="neutral" size="sm">Low</Badge>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
