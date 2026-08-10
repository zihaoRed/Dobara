import React, { useEffect, useState } from 'react';
import { Card, Skeleton } from '@dobara/ui';
import { useRole } from '../context/RoleContext';
import type { IDevice } from '@dobara/utils';
import { ClipboardCheck, Package, DollarSign, AlertCircle, TrendingUp, Users, Truck, FileText, Bell, Wrench } from 'lucide-react';

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
    if (role === 'ops' || role === 'admin') {
      fetch('/api/ops/review')
        .then((r) => r.json())
        .then((data: { devices: IDevice[] }) => setReviewCount(data.devices.length))
        .catch(() => setReviewCount(0))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [role]);

  const renderOpsCards = () => (
    <>
      <StatCard
        title="Pending Review"
        value={loading ? '...' : String(reviewCount)}
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
        title="Flagged Items"
        value="2"
        sub="Needs manual review"
        icon={<AlertCircle className="text-white" />}
        color="bg-dobara-error"
      />
    </>
  );

  const renderStoreOwnerCards = () => (
    <>
      <StatCard title="Monthly Revenue" value="₹ 3,20,000" sub="+12% vs last month" icon={<TrendingUp className="text-white" />} color="bg-dobara-success" />
      <StatCard title="Active Clerks" value="4" sub="Across 1 store" icon={<Users className="text-white" />} color="bg-primary-500" />
      <StatCard title="Trade-ins Today" value="6" sub="3 completed" icon={<ClipboardCheck className="text-white" />} color="bg-dobara-warning" />
      <StatCard title="Pending Notifications" value="3" sub="2 high priority" icon={<Bell className="text-white" />} color="bg-dobara-error" />
    </>
  );

  const renderWhCards = () => (
    <>
      <StatCard title="Today Inbound" value="12" sub="5 pending QC" icon={<Truck className="text-white" />} color="bg-primary-500" />
      <StatCard title="In Refurbishment" value="8" sub="3 in progress" icon={<Wrench className="text-white" />} color="bg-dobara-warning" />
      <StatCard title="Ready to Ship" value="20" sub="Outbound queue" icon={<Package className="text-white" />} color="bg-dobara-success" />
      <StatCard title="QC Failures" value="1" sub="Requires escalation" icon={<AlertCircle className="text-white" />} color="bg-dobara-error" />
    </>
  );

  const renderFinanceCards = () => (
    <>
      <StatCard title="Pending Settlement" value="₹ 4,75,000" sub="8 stores" icon={<FileText className="text-white" />} color="bg-dobara-warning" />
      <StatCard title="This Month Disbursed" value="₹ 12,80,000" sub="32 transactions" icon={<DollarSign className="text-white" />} color="bg-dobara-success" />
      <StatCard title="Overdue Accounts" value="3" sub="₹ 1,20,000 overdue" icon={<AlertCircle className="text-white" />} color="bg-dobara-error" />
      <StatCard title="Vouchers Pending" value="7" sub="Awaiting verification" icon={<ClipboardCheck className="text-white" />} color="bg-primary-500" />
    </>
  );

  const getCards = () => {
    switch (role) {
      case 'store_owner': return renderStoreOwnerCards();
      case 'wh_manager': return renderWhCards();
      case 'finance': return renderFinanceCards();
      default: return renderOpsCards();
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-h2 font-heading text-text-primary">Dashboard</h1>
        <p className="text-body text-text-muted mt-1">
          {role === 'admin' ? 'Administrator Overview' : role === 'store_owner' ? 'Store Revenue Overview' : role === 'wh_manager' ? 'Warehouse Overview' : role === 'finance' ? 'Finance Overview' : 'Operations Overview'}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="w-full" height="100px" />)}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {getCards()}
        </div>
      )}

      {/* Recent Activity Section */}
      <Card className="mt-6" variant="default">
        <h3 className="text-h4 font-heading text-text-primary mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { time: '10 min ago', text: 'Device iPhone 13 #...0001 approved by ops team', type: 'success' },
            { time: '25 min ago', text: 'New review submission: Galaxy S22 #...0009', type: 'info' },
            { time: '1 hour ago', text: 'Category pricing updated for Samsung models', type: 'warning' },
            { time: '2 hours ago', text: 'Store MobileXchange Andheri submitted new batch', type: 'info' },
            { time: '3 hours ago', text: 'Price adjustment flagged for review: Mi 11 #...0011', type: 'error' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 pb-3 border-b border-border/50 last:border-0 last:pb-0">
              <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                item.type === 'success' ? 'bg-dobara-success' : item.type === 'error' ? 'bg-dobara-error' : item.type === 'warning' ? 'bg-dobara-warning' : 'bg-dobara-info'
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
