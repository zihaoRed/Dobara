import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Badge, Button } from '@dobara/ui';
import { ArrowRight, TrendingUp, Clock, CheckCircle, Bell } from 'lucide-react';
import { useOwnerStore } from '../../lib/useOwnerStore';
import { listTradeIns, pendingCount, tradeInStatusLabel, type TTradeInStatus } from '../../lib/tradeInStore';
import { getRevenueForStore } from '../../lib/revenueStore';
import { listOwnerNotices } from '../../lib/dbStore';

function badgeVariant(status: TTradeInStatus): 'warning' | 'success' | 'info' | 'neutral' {
  if (status === 'pending') return 'warning';
  if (status === 'awaiting_user_confirm') return 'info';
  if (status === 'confirmed') return 'success';
  return 'neutral';
}

const OwnerHome: React.FC = () => {
  const navigate = useNavigate();
  const { storeId, storeName } = useOwnerStore();
  const revenue = getRevenueForStore(storeId);
  const tradeIns = useMemo(() => listTradeIns(storeId), [storeId]);
  const pending = pendingCount(storeId);
  const awaiting = tradeIns.filter((t) => t.status === 'awaiting_user_confirm').length;
  const inbox = tradeIns.filter((t) => t.status === 'pending' || t.status === 'awaiting_user_confirm');
  const notices = useMemo(() => listOwnerNotices(storeId).slice(0, 5), [storeId]);

  return (
    <div className="space-y-4" data-testid="owner-home">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-h3 font-heading">Store Overview</h2>
          <p className="text-caption text-text-muted">{storeName}</p>
        </div>
        {(pending > 0 || awaiting > 0) && (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-accent-50 text-accent-800 px-2.5 py-1 text-caption font-semibold"
            data-testid="tradein-badge"
          >
            <Bell size={14} />
            {pending} pending · {awaiting} awaiting user
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-accent-50">
              <Clock size={20} className="text-accent-500" />
            </div>
            <div>
              <p className="text-caption text-text-muted">Pending entry</p>
              <p className="text-h4 font-heading" data-testid="kpi-pending">{pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary-50">
              <CheckCircle size={20} className="text-primary-500" />
            </div>
            <div>
              <p className="text-caption text-text-muted">This month</p>
              <p className="text-h4 font-heading">{revenue.monthlyRecycled}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-dobara-info-light">
              <TrendingUp size={20} className="text-dobara-info" />
            </div>
            <div>
              <p className="text-caption text-text-muted">Deduction</p>
              <p className="text-h4 font-heading">₹{(revenue.totalDeduction / 100000).toFixed(1)}L</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-dobara-success-light">
              <CheckCircle size={20} className="text-dobara-success" />
            </div>
            <div>
              <p className="text-caption text-text-muted">Closed</p>
              <p className="text-h4 font-heading">{revenue.tradeInCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => navigate('/owner/revenue')}>Revenue</Button>
        <Button size="sm" variant="secondary" onClick={() => navigate('/owner/clerks')}>Staff</Button>
      </div>

      {notices.length > 0 && (
        <Card data-testid="owner-notices">
          <CardHeader>
            <h3 className="text-h4 font-heading">Finance alerts</h3>
          </CardHeader>
          <CardContent className="space-y-2">
            {notices.map((n) => (
              <div key={n.id} className="p-2 rounded-md bg-dobara-warning-light text-[#78350f] text-caption">
                {n.message}
                <span className="block text-eyebrow opacity-80 mt-0.5">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Trade-in inbox</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          {inbox.map((item) => (
            <div
              key={item.sessionId}
              data-testid={`tradein-row-${item.sessionId}`}
              onClick={() => navigate(`/owner/trade-in/${item.sessionId}`)}
              className="flex items-center justify-between p-3 rounded-md bg-surface-low hover:bg-surface-high cursor-pointer transition-colors"
            >
              <div>
                <p className="text-body font-medium">{item.customerName}</p>
                <p className="text-caption text-text-body">{item.device}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-body font-semibold">₹{item.deduction.toLocaleString('en-IN')}</p>
                  <Badge variant={badgeVariant(item.status)}>{tradeInStatusLabel(item.status)}</Badge>
                </div>
                <ArrowRight size={16} className="text-text-muted" />
              </div>
            </div>
          ))}
          {inbox.length === 0 && (
            <p className="text-center text-text-muted py-4">No pending trade-ins</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerHome;
