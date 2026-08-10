import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Button, Badge } from '@dobara/ui';
import { ArrowLeft, Download, FileText } from 'lucide-react';

const mockDetails = [
  { type: 'recycling', description: 'iPhone 13 #350000000000001', amount: 38000, date: '2026-07-15' },
  { type: 'recycling', description: 'Galaxy S22 #350000000000009', amount: 24000, date: '2026-07-18' },
  { type: 'recycling', description: 'iPhone 14 #350000000000005', amount: 50000, date: '2026-07-20' },
  { type: 'recycling', description: 'OnePlus Nord 2 #350000000000012', amount: 18000, date: '2026-07-22' },
  { type: 'purchase', description: 'B2B Order ORD-001', amount: 180000, date: '2026-07-25' },
  { type: 'purchase', description: 'B2B Order ORD-004', amount: 95000, date: '2026-07-28' },
  { type: 'recycling', description: 'iPhone 12 #350000000000003', amount: 29000, date: '2026-07-29' },
];

const storeNames: Record<string, string> = {
  'st-mum-1': 'MobileXchange Andheri',
  'st-del-1': 'GadgetMart CP',
  'st-blr-1': 'Fonfix Koramangala',
};

const ReconciliationDetail: React.FC = () => {
  const { storeId, period } = useParams<{ storeId: string; period: string }>();
  const navigate = useNavigate();

  const recyclingTotal = mockDetails
    .filter((d) => d.type === 'recycling')
    .reduce((sum, d) => sum + d.amount, 0);
  const purchaseTotal = mockDetails
    .filter((d) => d.type === 'purchase')
    .reduce((sum, d) => sum + d.amount, 0);
  const netSettlement = recyclingTotal - purchaseTotal;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/db/reconciliation')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h2 className="text-h3 font-heading">Reconciliation Detail</h2>
      </div>

      {/* Header */}
      <Card>
        <CardContent className="space-y-2">
          <p className="text-body font-semibold">{storeNames[storeId || ''] || storeId}</p>
          <p className="text-caption text-text-muted">Period: {period}</p>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="text-center space-y-1">
            <p className="text-caption text-text-muted">Recycling Total</p>
            <p className="text-h3 font-heading text-primary-500">₹{recyclingTotal.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center space-y-1">
            <p className="text-caption text-text-muted">B2B Purchase</p>
            <p className="text-h3 font-heading text-accent-500">₹{purchaseTotal.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Net Settlement */}
      <Card>
        <CardContent className="text-center">
          <p className="text-caption text-text-muted">Net Settlement</p>
          <p className={`text-h2 font-heading ${netSettlement >= 0 ? 'text-dobara-success' : 'text-dobara-error'}`}>
            {netSettlement >= 0 ? '+' : '-'}₹{Math.abs(netSettlement).toLocaleString('en-IN')}
          </p>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Transaction Details</h3>
        </CardHeader>
        <CardContent className="space-y-1">
          {mockDetails.map((d, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-body">{d.description}</p>
                <p className="text-caption text-text-muted">{d.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={d.type === 'recycling' ? 'success' : 'accent'}>
                  {d.type === 'recycling' ? 'Recycling' : 'Purchase'}
                </Badge>
                <span className="text-body font-semibold">₹{d.amount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardContent className="space-y-2">
          <div className="flex justify-between py-1 border-b border-border">
            <span className="text-body text-text-secondary">Recycling Total</span>
            <span className="text-body font-semibold text-dobara-success">+₹{recyclingTotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border">
            <span className="text-body text-text-secondary">B2B Purchase Total</span>
            <span className="text-body font-semibold text-accent-500">-₹{purchaseTotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between py-1 font-semibold">
            <span className="text-body">Net Settlement</span>
            <span className={`text-body ${netSettlement >= 0 ? 'text-dobara-success' : 'text-dobara-error'}`}>
              ₹{netSettlement.toLocaleString('en-IN')}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Export */}
      <Button variant="secondary" size="lg" className="w-full" icon={<Download size={18} />}>
        Export Statement (CSV)
      </Button>
    </div>
  );
};

export default ReconciliationDetail;
