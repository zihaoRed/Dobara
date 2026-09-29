import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Badge, EmptyState } from '@dobara/ui';
import { ArrowLeft, Bell, ChevronRight } from 'lucide-react';
import type { IRecycleOrder } from '@dobara/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  time: string;
  type: 'adjustment' | 'new_appointment';
}

/** TAB-P0-06 审核调整通知 + 新预约通知（预约创建同步到门店）. */
const mockAdjustments: Notification[] = [
  {
    id: 'n-1',
    title: 'Price Adjustment - iPhone 13',
    message: 'Ops adjusted grade A→B and added screen scratch −₹500. ₹42,000 → ₹38,500.',
    read: false,
    time: '2 hours ago',
    type: 'adjustment',
  },
  {
    id: 'n-2',
    title: 'Grade Update - Galaxy S22',
    message: 'Grade changed from A to B after ops review. New price: ₹35,000.',
    read: false,
    time: '5 hours ago',
    type: 'adjustment',
  },
  {
    id: 'n-4',
    title: 'Deduction Alert - OnePlus Nord 2',
    message: 'Ops added missing-accessory deduction −₹2,000. Final offer: ₹18,000.',
    read: true,
    time: '2 days ago',
    type: 'adjustment',
  },
];

export default function NotificationList() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>(mockAdjustments);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // 新预约通知：从 recycle-orders 拉 appointment_pending（与 C 端预约同源，打通数据流）.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/recycle-orders');
        const data = (await res.json()) as { orders: IRecycleOrder[] };
        const apptNotifs: Notification[] = (data.orders || [])
          .filter((o) => o.status === 'appointment_pending')
          .map((o) => ({
            id: `appt-${o.sessionId}`,
            title: `New Appointment - ${o.brand} ${o.model}`,
            message: `${o.customerName || 'Customer'} booked for ${o.appointmentDate || '—'} ${o.appointmentSlot || ''}.`,
            read: false,
            time: 'Just now',
            type: 'new_appointment' as const,
          }));
        if (!cancelled) setNotifications((prev) => [...apptNotifs, ...prev]);
      } catch {
        /* demo */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-4 sm:p-6" data-testid="notification-list">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft size={16} />
          </Button>
          <h1 className="text-h3 font-heading text-text-primary">Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <Badge variant="accent" size="md" data-testid="unread-badge">
            {unreadCount} unread
          </Badge>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={48} strokeWidth={1.5} />}
          title="No Notifications"
          description="New appointments and ops adjustments appear here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              variant="flat"
              className={`cursor-pointer hover:bg-surface-container transition-colors ${
                !n.read ? 'border-l-4 border-l-primary-500' : ''
              }`}
              onClick={() => {
                setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
                navigate(`/notifications/${n.id}`);
              }}
            >
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {!n.read && <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />}
                    <h3 className="text-caption font-semibold text-text-primary truncate">{n.title}</h3>
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
