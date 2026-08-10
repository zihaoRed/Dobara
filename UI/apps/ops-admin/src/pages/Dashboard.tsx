import React, { useEffect, useState } from 'react';
import { Card, Skeleton } from '@dobara/ui';
import { useRole } from '../context/RoleContext';
import type { IDevice } from '@dobara/utils';
import { ClipboardCheck, Package, DollarSign, AlertCircle } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactElement;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, sub, icon, color }) => (
  <Card className="flex items-start gap-4" variant="default">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
      {React.cloneElement(icon, { size: 20 })}
    </div>
    <div>
      <div className="text-caption text-text-muted">{title}</div>
      <div className="text-h3 font-heading text-text-primary mt-1">{value}</div>
      <div className="text-caption text-text-body mt-0.5">{sub}</div>
    </div>
  </Card>
);

const Dashboard: React.FC = () => {
  const { role } = useRole();
  const [loading, setLoading] = useState(true);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    fetch('/api/ops/review')
      .then((r) => r.json())
      .then((data: { devices: IDevice[] }) => setReviewCount(data.devices.length))
      .catch(() => setReviewCount(0))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-h2 font-heading text-text-primary">Dashboard</h1>
        <p className="text-body text-text-muted mt-1">
          {role === 'admin' ? 'System Admin Overview' : 'Operations Overview'}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="w-full" height="100px" />)}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            title="Pending Review"
            value={String(reviewCount)}
            sub="Devices awaiting audit"
            icon={<ClipboardCheck className="text-white" />}
            color="bg-dobara-warning"
          />
          <StatCard
            title="Active Listings"
            value="14"
            sub="Devices on marketplace"
            icon={<Package className="text-white" />}
            color="bg-primary-500"
          />
          <StatCard
            title="Today's Approvals"
            value="8"
            sub="+3 from yesterday"
            icon={<DollarSign className="text-white" />}
            color="bg-dobara-success"
          />
          <StatCard
            title="Overdue (>24h)"
            value="2"
            sub="Queue SLA warning"
            icon={<AlertCircle className="text-white" />}
            color="bg-dobara-error"
          />
        </div>
      )}

      <Card className="mt-6" variant="default">
        <h3 className="text-h4 font-heading text-text-primary mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { time: '10 min ago', text: 'Device iPhone 13 listed after direct review', type: 'success' },
            { time: '25 min ago', text: 'New pending review: Galaxy S22', type: 'info' },
            { time: '1 hour ago', text: 'Adjust & list: Mi 11 deductions updated', type: 'warning' },
            { time: '2 hours ago', text: 'Store ST-MH-0001 batch entered review queue', type: 'info' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 pb-3 border-b border-border/50 last:border-0 last:pb-0">
              <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                item.type === 'success' ? 'bg-dobara-success' : item.type === 'warning' ? 'bg-dobara-warning' : 'bg-dobara-info'
              }`} />
              <div>
                <p className="text-body text-text-secondary">{item.text}</p>
                <span className="text-caption text-text-muted">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
