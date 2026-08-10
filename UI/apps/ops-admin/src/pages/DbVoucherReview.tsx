import React from 'react';
import { Card, CardHeader, CardContent, Button, Badge } from '@dobara/ui';
import { ShieldCheck, FileText, CheckCircle, XCircle } from 'lucide-react';
import { DataTable } from '../components/DataTable';

interface Voucher {
  id: string;
  storeName: string;
  amount: number;
  type: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  documentUrl: string;
}

const mockVouchers: Voucher[] = [
  { id: 'VCH-001', storeName: 'MobileXchange Andheri', amount: 12000, type: 'Repair Receipt', submittedAt: '2026-07-28', status: 'pending', documentUrl: '#' },
  { id: 'VCH-002', storeName: 'GadgetMart CP', amount: 8500, type: 'Shipping Invoice', submittedAt: '2026-07-27', status: 'pending', documentUrl: '#' },
  { id: 'VCH-003', storeName: 'Fonfix Koramangala', amount: 15000, type: 'Accessory Invoice', submittedAt: '2026-07-26', status: 'approved', documentUrl: '#' },
  { id: 'VCH-004', storeName: 'MobileXchange Andheri', amount: 3200, type: 'Misc Expense', submittedAt: '2026-07-25', status: 'rejected', documentUrl: '#' },
  { id: 'VCH-005', storeName: 'GadgetMart CP', amount: 9800, type: 'Repair Receipt', submittedAt: '2026-07-24', status: 'approved', documentUrl: '#' },
];

const DbVoucherReview: React.FC = () => {
  const pendingCount = mockVouchers.filter((v) => v.status === 'pending').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-h2 font-heading text-text-primary">Voucher Review</h1>
            {pendingCount > 0 && <Badge variant="warning">{pendingCount} Pending</Badge>}
          </div>
          <p className="text-body text-text-muted mt-1">Review and approve store-submitted voucher documents</p>
        </div>
      </div>

      <Card variant="default">
        <CardContent>
          <DataTable
            data={mockVouchers}
            keyField="id"
            columns={[
              {
                key: 'id',
                header: 'Voucher',
                render: (v) => <span className="font-semibold font-mono text-text-primary">{v.id}</span>,
              },
              {
                key: 'store',
                header: 'Store',
                render: (v) => <span className="text-text-secondary">{v.storeName}</span>,
              },
              {
                key: 'type',
                header: 'Type',
                render: (v) => (
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-text-muted" />
                    <span className="text-text-secondary">{v.type}</span>
                  </div>
                ),
              },
              {
                key: 'amount',
                header: 'Amount',
                render: (v) => <span className="font-semibold text-text-primary">₹ {v.amount.toLocaleString()}</span>,
              },
              {
                key: 'date',
                header: 'Submitted',
                render: (v) => <span className="text-caption text-text-muted">{v.submittedAt}</span>,
              },
              {
                key: 'status',
                header: 'Status',
                render: (v) => {
                  const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'error' }> = {
                    pending: { label: 'Pending', variant: 'warning' },
                    approved: { label: 'Approved', variant: 'success' },
                    rejected: { label: 'Rejected', variant: 'error' },
                  };
                  const s = statusMap[v.status];
                  return <Badge variant={s.variant}>{s.label}</Badge>;
                },
              },
              {
                key: 'actions',
                header: '',
                render: (v) => (
                  v.status === 'pending' ? (
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="primary" icon={<CheckCircle size={14} />}>Approve</Button>
                      <Button size="sm" variant="ghost" icon={<XCircle size={14} />} className="text-dobara-error">Reject</Button>
                    </div>
                  ) : null
                ),
                className: 'text-right',
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default DbVoucherReview;
