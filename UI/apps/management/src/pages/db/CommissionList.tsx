import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Badge } from '@dobara/ui';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { listCommissions } from '../../lib/dbStore';

/** DB-P1-01 */
const CommissionList: React.FC = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('2026-07');
  const rows = useMemo(
    () => listCommissions().filter((c) => !period || c.period === period),
    [period],
  );

  return (
    <div className="space-y-4" data-testid="commission-list">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/db')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div>
          <h2 className="text-h3 font-heading">Commission</h2>
          <p className="text-caption text-text-muted">Monthly store payout · rate configurable later (P2)</p>
        </div>
      </div>

      <div className="flex flex-col gap-1 max-w-xs">
        <label className="text-caption font-semibold text-text-secondary">Period</label>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="h-[40px] px-3 rounded-md border border-border bg-surface-container text-body"
          data-testid="commission-period"
        >
          <option value="2026-07">2026-07</option>
          <option value="2026-06">2026-06</option>
        </select>
      </div>

      {rows.map((c) => (
        <Card
          key={c.id}
          variant="hover"
          data-testid={`commission-${c.id}`}
          onClick={() => navigate(`/db/commission/${c.id}`)}
        >
          <CardContent className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-body font-semibold">{c.storeName}</p>
              <p className="text-caption text-text-muted">
                {c.period} · {c.recycleCount} units · rate {c.ratePct}%
              </p>
              <p className="text-h4 font-heading text-primary-500 mt-1">
                ₹{c.commission.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={c.status === 'paid' ? 'success' : c.status === 'ready' ? 'accent' : 'neutral'}>
                {c.status}
              </Badge>
              <ArrowRight size={16} className="text-text-muted" />
            </div>
          </CardContent>
        </Card>
      ))}

      {rows.length === 0 && (
        <p className="text-center text-text-muted py-6">No commission rows for this period</p>
      )}
    </div>
  );
};

export default CommissionList;
