import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, Badge, Button } from '@dobara/ui';
import { Calendar, Clock, User } from 'lucide-react';
import { useOwnerStore } from '../../lib/useOwnerStore';
import type { IRecycleOrder } from '@dobara/utils';

/** 今日预约工作台（店老板/店员）——用户预约成功后同步到门店，支持标记「已到店」。 */
const AppointmentsToday: React.FC = () => {
  const { storeId } = useOwnerStore();
  const [appointments, setAppointments] = useState<IRecycleOrder[]>([]);
  const [arrived, setArrived] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/recycle-orders');
        const data = (await res.json()) as { orders: IRecycleOrder[] };
        const list = (data.orders || [])
          .filter((o) => o.status === 'appointment_pending' && (!storeId || o.storeId === storeId))
          .sort((a, b) => `${a.appointmentDate || ''}${a.appointmentSlot || ''}`.localeCompare(`${b.appointmentDate || ''}${b.appointmentSlot || ''}`));
        if (!cancelled) setAppointments(list);
      } catch {
        /* demo */
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  return (
    <div className="space-y-4" data-testid="appointments-today">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-h3 font-heading">Today's Appointments</h2>
          <p className="text-caption text-text-muted">Synced from the customer app when a booking is placed.</p>
        </div>
        <Badge variant="info">{appointments.length} upcoming</Badge>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-10 text-center text-text-muted">Loading appointments…</CardContent>
        </Card>
      ) : appointments.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-text-muted">No upcoming appointments for this store.</CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h3 className="text-h4 font-heading">Upcoming appointments</h3>
          </CardHeader>
          <CardContent className="space-y-2">
            {appointments.map((a) => {
              const isArrived = !!arrived[a.sessionId];
              return (
                <div
                  key={a.sessionId}
                  data-testid={`appt-${a.sessionId}`}
                  className={`flex items-center justify-between p-3 rounded-md ${isArrived ? 'bg-dobara-success-light' : 'bg-surface-low'}`}
                >
                  <div>
                    <p className="text-body font-medium flex items-center gap-1.5">
                      <User size={14} className="text-text-muted" />
                      {a.customerName || 'Customer'}
                      {a.customerPhone ? ` · +91 ${a.customerPhone}` : ''}
                    </p>
                    <p className="text-caption text-text-body">
                      {a.brand} {a.model}
                    </p>
                    <p className="text-caption text-text-muted flex items-center gap-2 mt-1">
                      <Calendar size={12} /> {a.appointmentDate || '—'}
                      <Clock size={12} /> {a.appointmentSlot || '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={isArrived ? 'success' : 'warning'}>{isArrived ? 'Arrived' : 'Awaiting'}</Badge>
                    {!isArrived && (
                      <Button size="sm" variant="secondary" onClick={() => setArrived((p) => ({ ...p, [a.sessionId]: true }))}>
                        Mark arrived
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AppointmentsToday;
