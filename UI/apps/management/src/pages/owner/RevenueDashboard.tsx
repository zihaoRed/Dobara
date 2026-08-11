import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardContent, Skeleton, Button, Badge } from '@dobara/ui';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useOwnerStore } from '../../lib/useOwnerStore';
import {
  getRevenueDashboard,
  type IKpiMetric,
  type IRevenueFilter,
  type TGrade,
  type TRevenuePeriod,
} from '../../lib/revenueStore';

function formatInr(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function formatKpiValue(key: string, value: number): string {
  if (key === 'opsAdjustmentRate' || key === 'acceptConversion') return `${value}%`;
  if (key === 'totalDeduction' || key === 'avgDeduction' || key === 'newDeviceSales') return formatInr(value);
  return String(value);
}

function DeltaArrow({ metric }: { metric: IKpiMetric }) {
  const up = metric.deltaPct >= 0;
  const good = metric.invertDeltaColor ? !up : up;
  const color = good ? 'text-dobara-success' : 'text-dobara-error';
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center text-caption font-semibold ${color}`} data-testid="rev-delta">
      <Icon size={14} />
      {Math.abs(metric.deltaPct)}%
    </span>
  );
}

function gradeVariant(g: TGrade): 'success' | 'info' | 'warning' | 'error' {
  if (g === 'A') return 'success';
  if (g === 'B') return 'info';
  if (g === 'C') return 'warning';
  return 'error';
}

const PERIODS: { id: TRevenuePeriod; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'custom', label: 'Custom' },
];

const RevenueDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { storeId, storeName } = useOwnerStore();
  const [period, setPeriod] = useState<TRevenuePeriod>('month');
  const [from, setFrom] = useState('2026-08-01');
  const [to, setTo] = useState('2026-08-11');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);
  const [chartMode, setChartMode] = useState<'bar' | 'line'>('bar');

  const filter: IRevenueFilter = useMemo(
    () => (period === 'custom' ? { period, from, to } : { period }),
    [period, from, to],
  );

  const data = useMemo(() => getRevenueDashboard(storeId, filter), [storeId, filter, tick]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(timer);
  }, [storeId, filter, tick]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setTick((t) => t + 1);
      setRefreshing(false);
    }, 500);
  };

  const maxClerkUnits = Math.max(1, ...data.clerks.map((c) => c.units));

  const kpiCards: { key: keyof typeof data.kpis; label: string; testId: string; hint: string }[] = [
    { key: 'recycledUnits', label: 'Recycled units', testId: 'rev-recycled', hint: 'units' },
    { key: 'totalDeduction', label: 'Total deduction', testId: 'rev-deduction', hint: 'INR' },
    { key: 'tradeInCount', label: 'Trade-in count', testId: 'rev-tradeins', hint: 'closed' },
    { key: 'opsAdjustmentRate', label: 'Ops adjustment rate', testId: 'rev-adjust', hint: 'of audited' },
    { key: 'acceptConversion', label: 'Accept conversion', testId: 'rev-conversion', hint: 'quote accept' },
    { key: 'avgDeduction', label: 'Avg deduction', testId: 'rev-avg', hint: 'per unit' },
    { key: 'newDeviceSales', label: 'New device sales', testId: 'rev-newsales', hint: 'INR' },
  ];

  if (loading) {
    return (
      <div className="space-y-4" data-testid="revenue-dashboard">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="revenue-dashboard">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/owner')} className="p-1 hover:bg-surface-high rounded" aria-label="Back">
            <ArrowLeft size={20} className="text-text-secondary" />
          </button>
          <div>
            <h2 className="text-h3 font-heading">Revenue</h2>
            <p className="text-caption text-text-muted">
              {storeName} · {data.periodLabel} · Updated {data.updatedAt}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="secondary"
          data-testid="rev-refresh"
          loading={refreshing}
          onClick={onRefresh}
        >
          <RefreshCw size={14} className="mr-1" />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2" data-testid="rev-period-tabs">
        {PERIODS.map((p) => (
          <Button
            key={p.id}
            size="sm"
            variant={period === p.id ? 'primary' : 'secondary'}
            data-testid={`rev-period-${p.id}`}
            onClick={() => setPeriod(p.id)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {period === 'custom' && (
        <div className="flex flex-wrap items-end gap-3" data-testid="rev-custom-range">
          <label className="text-caption text-text-muted space-y-1">
            <span className="block">From</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-md border border-border bg-surface px-2 py-1.5 text-body"
              data-testid="rev-from"
            />
          </label>
          <label className="text-caption text-text-muted space-y-1">
            <span className="block">To</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-md border border-border bg-surface px-2 py-1.5 text-body"
              data-testid="rev-to"
            />
          </label>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="rev-kpi-grid">
        {kpiCards.map((card) => {
          const metric = data.kpis[card.key];
          return (
            <Card key={card.key}>
              <CardContent className="space-y-1 py-3">
                <p className="text-caption text-text-muted">{card.label}</p>
                <p className="text-h3 font-heading text-primary-500" data-testid={card.testId}>
                  {formatKpiValue(card.key, metric.value)}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-caption text-text-body">{card.hint}</span>
                  <DeltaArrow metric={metric} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card data-testid="rev-trend">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <h3 className="text-h4 font-heading">Recycled units · last {data.trendDays} days</h3>
          <div className="flex gap-1">
            <Button size="sm" variant={chartMode === 'bar' ? 'primary' : 'ghost'} onClick={() => setChartMode('bar')}>Bar</Button>
            <Button size="sm" variant={chartMode === 'line' ? 'primary' : 'ghost'} onClick={() => setChartMode('line')}>Line</Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            {chartMode === 'bar' ? (
              <BarChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e4dc" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                <Tooltip formatter={(value: number) => [`${value} units`, 'Recycled']} />
                <Bar dataKey="units" fill="#064439" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e4dc" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                <Tooltip formatter={(value: number) => [`${value} units`, 'Recycled']} />
                <Line type="monotone" dataKey="units" stroke="#064439" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card data-testid="rev-brands">
          <CardHeader>
            <h3 className="text-h4 font-heading">Brand mix · Top 5</h3>
          </CardHeader>
          <CardContent className="flex justify-center">
            {data.brands.length === 0 ? (
              <p className="text-caption text-text-muted py-8">No brand data</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={data.brands} cx="50%" cy="50%" innerRadius={48} outerRadius={88} paddingAngle={2} dataKey="value" nameKey="name">
                    {data.brands.map((entry) => (
                      <Cell key={entry.name} fill={entry.color || '#8884d8'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [`${value} units`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card data-testid="rev-clerks">
          <CardHeader>
            <h3 className="text-h4 font-heading">Clerk ranking · Top 10</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.clerks.length === 0 && (
              <p className="text-caption text-text-muted py-4 text-center">No clerk data</p>
            )}
            {data.clerks.map((c, i) => (
              <div key={c.name} className="space-y-1" data-testid={`rev-clerk-${i}`}>
                <div className="flex justify-between text-caption">
                  <span className="font-medium text-text-primary">{i + 1}. {c.name}</span>
                  <span className="text-text-muted">{c.units} units · {c.conversion}% conv.</span>
                </div>
                <div className="h-2 rounded-full bg-surface-high overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary-500"
                    style={{ width: `${(c.units / maxClerkUnits) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card data-testid="rev-recent">
        <CardHeader>
          <h3 className="text-h4 font-heading">Recent trade-ins · last 20</h3>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-caption min-w-[560px]">
            <thead>
              <tr className="text-text-muted border-b border-border">
                <th className="py-2 pr-2 font-medium">Time</th>
                <th className="py-2 pr-2 font-medium">Device</th>
                <th className="py-2 pr-2 font-medium">Grade</th>
                <th className="py-2 pr-2 font-medium">Deduction</th>
                <th className="py-2 font-medium">Clerk</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((row) => (
                <tr key={row.id} className="border-b border-border/60 last:border-0" data-testid={`rev-row-${row.id}`}>
                  <td className="py-2.5 pr-2 whitespace-nowrap text-text-secondary">{row.time}</td>
                  <td className="py-2.5 pr-2">
                    {row.sessionId ? (
                      <Link
                        to={`/owner/trade-in/${row.sessionId}`}
                        className="text-primary-600 hover:underline font-medium"
                        data-testid={`rev-link-${row.sessionId}`}
                      >
                        {row.device}
                      </Link>
                    ) : (
                      <span>{row.device}</span>
                    )}
                    {row.opsAdjusted && (
                      <Badge variant="warning" className="ml-1">Adjusted</Badge>
                    )}
                  </td>
                  <td className="py-2.5 pr-2">
                    <Badge variant={gradeVariant(row.grade)}>Grade {row.grade}</Badge>
                  </td>
                  <td className="py-2.5 pr-2 font-semibold">₹{row.deduction.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 text-text-secondary">{row.clerk}</td>
                </tr>
              ))}
              {data.recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-text-muted">No trade-ins in this range</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueDashboard;
