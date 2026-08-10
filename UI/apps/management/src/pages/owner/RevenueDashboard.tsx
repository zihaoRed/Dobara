import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, Skeleton } from '@dobara/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, DollarSign, CheckCircle, Percent, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOwnerStore } from '../../lib/useOwnerStore';
import { getRevenueForStore } from '../../lib/revenueStore';

const RevenueDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { storeId, storeName } = useOwnerStore();
  const [loading, setLoading] = useState(true);
  const data = getRevenueForStore(storeId);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, [storeId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (<Skeleton key={i} className="h-20" />))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="revenue-dashboard">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/owner')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div>
          <h2 className="text-h3 font-heading">Revenue</h2>
          <p className="text-caption text-text-muted">
            {storeName} · Demo daily refresh · {data.updatedAt}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="text-center space-y-1">
            <TrendingUp size={20} className="text-primary-500 mx-auto" />
            <p className="text-caption text-text-muted">Monthly recycled</p>
            <p className="text-h2 font-heading text-primary-500" data-testid="rev-recycled">{data.monthlyRecycled}</p>
            <p className="text-caption text-text-body">units</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center space-y-1">
            <DollarSign size={20} className="text-accent-500 mx-auto" />
            <p className="text-caption text-text-muted">Total deduction</p>
            <p className="text-h2 font-heading text-accent-500">₹{(data.totalDeduction / 100000).toFixed(1)}L</p>
            <p className="text-caption text-text-body">this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center space-y-1">
            <CheckCircle size={20} className="text-dobara-success mx-auto" />
            <p className="text-caption text-text-muted">Trade-ins closed</p>
            <p className="text-h2 font-heading text-dobara-success">{data.tradeInCount}</p>
            <p className="text-caption text-text-body">this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center space-y-1">
            <Percent size={20} className="text-dobara-info mx-auto" />
            <p className="text-caption text-text-muted">Adjustment rate</p>
            <p className="text-h2 font-heading text-dobara-info">{data.adjustmentRate}%</p>
            <p className="text-caption text-text-body">ops review</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Monthly revenue</h3>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e4dc" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']} />
              <Bar dataKey="amount" fill="#064439" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Grade distribution</h3>
        </CardHeader>
        <CardContent className="flex justify-center">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={data.gradeDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value">
                {data.gradeDistribution.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number, name: string) => [`${value} devices`, name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueDashboard;
