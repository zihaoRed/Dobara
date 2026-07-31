import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, Skeleton } from '@dobara/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, DollarSign, CheckCircle, Percent } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const monthlyRevenue = [
  { month: 'Jan', amount: 120000 },
  { month: 'Feb', amount: 145000 },
  { month: 'Mar', amount: 132000 },
  { month: 'Apr', amount: 168000 },
  { month: 'May', amount: 155000 },
  { month: 'Jun', amount: 182000 },
  { month: 'Jul', amount: 175000 },
];

const gradeDistribution = [
  { name: 'Grade A', value: 45, color: '#00b86e' },
  { name: 'Grade B', value: 30, color: '#3fc68b' },
  { name: 'Grade C', value: 18, color: '#ff7b1a' },
  { name: 'Grade D', value: 7, color: '#ef4444' },
];

const RevenueDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    monthlyRecycled: 47,
    totalDeduction: 1420000,
    tradeInCount: 39,
    adjustmentRate: 12.5,
  });

  useEffect(() => {
    // Simulate data fetch
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

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
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/owner')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h2 className="text-h3 font-heading">Revenue Dashboard</h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="text-center space-y-1">
            <TrendingUp size={20} className="text-primary-500 mx-auto" />
            <p className="text-caption text-text-muted">Monthly Recycled</p>
            <p className="text-h2 font-heading text-primary-500">{data.monthlyRecycled}</p>
            <p className="text-caption text-text-body">units</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center space-y-1">
            <DollarSign size={20} className="text-accent-500 mx-auto" />
            <p className="text-caption text-text-muted">Total Deduction</p>
            <p className="text-h2 font-heading text-accent-500">₹{(data.totalDeduction / 100000).toFixed(1)}L</p>
            <p className="text-caption text-text-body">this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center space-y-1">
            <CheckCircle size={20} className="text-dobara-success mx-auto" />
            <p className="text-caption text-text-muted">Trade-ins Closed</p>
            <p className="text-h2 font-heading text-dobara-success">{data.tradeInCount}</p>
            <p className="text-caption text-text-body">this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center space-y-1">
            <Percent size={20} className="text-dobara-info mx-auto" />
            <p className="text-caption text-text-muted">Adjustment Rate</p>
            <p className="text-h2 font-heading text-dobara-info">{data.adjustmentRate}%</p>
            <p className="text-caption text-text-body">ops review</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Monthly Revenue</h3>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e4dc" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']} />
              <Bar dataKey="amount" fill="#00b86e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Grade Distribution */}
      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Grade Distribution</h3>
        </CardHeader>
        <CardContent className="flex justify-center">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={gradeDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value">
                {gradeDistribution.map((entry, idx) => (
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
