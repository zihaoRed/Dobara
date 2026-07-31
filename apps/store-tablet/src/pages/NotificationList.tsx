import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, EmptyState } from '@dobara/ui';
import { Bell, ChevronRight } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  time: string;
}

const mockNotifications: Notification[] = [
  {
    id: 'n-1',
    title: 'Price Adjustment - iPhone 13',
    message: 'Ops team adjusted the price from ₹42,000 to ₹38,500 due to screen condition.',
    read: false,
    time: '2 hours ago',
  },
  {
    id: 'n-2',
    title: 'Grade Update - Galaxy S22',
    message: 'Grade changed from A to B after ops review. New price: ₹35,000.',
    read: false,
    time: '5 hours ago',
  },
  {
    id: 'n-3',
    title: 'Session Verified - Xiaomi Mi 11',
    message: 'Customer confirmed the offer. Session completed successfully.',
    read: true,
    time: '1 day ago',
  },
  {
    id: 'n-4',
    title: 'Deduction Alert - OnePlus Nord 2',
    message: '₹2,000 deducted for missing charger. Final offer: ₹18,000.',
    read: true,
    time: '2 days ago',
  },
  {
    id: 'n-5',
    title: 'Rejection Reviewed - iPhone 12',
    message: 'Ops confirmed the rejection. Device will be returned to customer.',
    read: true,
    time: '3 days ago',
  },
];

export default function NotificationList() {
  const navigate = useNavigate();
  const [notifications] = useState<Notification[]>(mockNotifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-h3 font-heading text-text-primary">Notifications</h1>
        {unreadCount > 0 && (
          <Badge variant="accent" size="md">
            {unreadCount} unread
          </Badge>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={48} strokeWidth={1.5} />}
          title="No Notifications"
          description="You're all caught up! New review adjustments will appear here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              variant="flat"
              className={`cursor-pointer hover:bg-surface-container transition-colors ${
                !n.read ? 'border-l-3 border-l-primary-500' : ''
              }`}
              onClick={() => navigate(`/notifications/${n.id}`)}
            >
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {!n.read && <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />}
                    <h3 className="text-caption font-semibold text-text-primary truncate">
                      {n.title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-text-muted truncate">{n.message}</p>
                  <p className="text-[10px] text-text-muted mt-1">{n.time}</p>
                </div>
                <ChevronRight size={16} className="text-text-muted shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
