import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Button, Badge, Input } from '@dobara/ui';
import { Search, Flag, ArrowRight, ArrowLeft } from 'lucide-react';

const mockVouchers = [
  { id: 'vch-001', store: 'MobileXchange Andheri', date: '2026-07-28', amount: 120000, flagged: null },
  { id: 'vch-002', store: 'GadgetMart CP', date: '2026-07-27', amount: 75000, flagged: 'amount_mismatch' },
  { id: 'vch-003', store: 'Fonfix Koramangala', date: '2026-07-26', amount: 42000, flagged: null },
  { id: 'vch-004', store: 'MobileXchange Andheri', date: '2026-07-25', amount: 95000, flagged: 'missing_supporting' },
];

const VoucherReview: React.FC = () => {
  const navigate = useNavigate();
  const [storeFilter, setStoreFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [vouchers, setVouchers] = useState(mockVouchers);
  const [flaggingId, setFlaggingId] = useState<string | null>(null);

  const filtered = vouchers.filter((v) => {
    if (storeFilter && !v.store.toLowerCase().includes(storeFilter.toLowerCase())) return false;
    if (dateFilter && v.date !== dateFilter) return false;
    return true;
  });

  const handleFlag = (id: string) => {
    if (!reasonInput.trim()) return;
    setVouchers((prev) =>
      prev.map((v) => (v.id === id ? { ...v, flagged: reasonInput } : v))
    );
    setFlaggingId(null);
    setReasonInput('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/db')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h2 className="text-h3 font-heading">Voucher Review</h2>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <Input
              label="Store"
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              placeholder="Filter by store..."
            />
            <Input
              label="Date"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Voucher List */}
      {filtered.map((v) => (
        <Card key={v.id}>
          <CardContent>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-body font-semibold">{v.store}</span>
                  {v.flagged && (
                    <Badge variant="error">
                      <Flag size={10} className="inline mr-0.5" />
                      Flagged
                    </Badge>
                  )}
                </div>
                <p className="text-caption text-text-body">{v.id} · {v.date}</p>
                <p className="text-h4 font-heading text-primary-500">₹{v.amount.toLocaleString('en-IN')}</p>
                {v.flagged && typeof v.flagged === 'string' && (
                  <p className="text-caption text-dobara-error">Reason: {v.flagged.replace(/_/g, ' ')}</p>
                )}
              </div>
              {!v.flagged && (
                <div className="flex flex-col gap-1">
                  {flaggingId === v.id ? (
                    <div className="flex flex-col gap-1">
                      <input
                        className="h-[32px] px-2 text-caption rounded border border-border bg-surface-container focus:outline-none focus:ring-1 focus:ring-primary-500"
                        placeholder="Reason..."
                        value={reasonInput}
                        onChange={(e) => setReasonInput(e.target.value)}
                      />
                      <div className="flex gap-1">
                        <Button size="sm" variant="danger" onClick={() => handleFlag(v.id)}>Flag</Button>
                        <Button size="sm" variant="ghost" onClick={() => setFlaggingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" icon={<Flag size={14} />} onClick={() => setFlaggingId(v.id)}>
                      Flag
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default VoucherReview;
