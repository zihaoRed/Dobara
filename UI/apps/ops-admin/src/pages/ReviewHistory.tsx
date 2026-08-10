import React, { useMemo, useState } from 'react';
import { Card, CardContent, Button, Badge, Modal, Input } from '@dobara/ui';
import { Download, Eye, History } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { listReviewHistory, type IReviewHistoryItem, type TReviewResult } from '../lib/reviewHistory';
import type { TGrade } from '@dobara/utils';

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m}m ${s}s` : `${m}m`;
}

function downloadCsv(rows: IReviewHistoryItem[]) {
  const headers = [
    'id',
    'imei',
    'brand',
    'model',
    'storeName',
    'gradeBefore',
    'gradeAfter',
    'recycleBefore',
    'recycleAfter',
    'result',
    'reviewer',
    'durationSec',
    'reviewedAt',
  ];
  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      [
        r.id,
        r.imei,
        r.brand,
        r.model,
        `"${r.storeName.replace(/"/g, '""')}"`,
        r.gradeBefore,
        r.gradeAfter,
        r.recycleBefore,
        r.recycleAfter,
        r.result,
        `"${r.reviewer}"`,
        r.durationSec,
        r.reviewedAt,
      ].join(',')
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `review-history-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const ReviewHistory: React.FC = () => {
  const [items] = useState(() => listReviewHistory());
  const [resultFilter, setResultFilter] = useState<'all' | TReviewResult>('all');
  const [storeText, setStoreText] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'all' | TGrade>('all');
  const [detail, setDetail] = useState<IReviewHistoryItem | null>(null);

  const filtered = useMemo(() => {
    const q = storeText.trim().toLowerCase();
    return items.filter((r) => {
      if (resultFilter !== 'all' && r.result !== resultFilter) return false;
      if (gradeFilter !== 'all' && r.gradeAfter !== gradeFilter && r.gradeBefore !== gradeFilter) {
        return false;
      }
      if (q && !r.storeName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, resultFilter, storeText, gradeFilter]);

  const kpis = useMemo(() => {
    const total = filtered.length;
    const direct = filtered.filter((r) => r.result === 'direct_list').length;
    const adjust = filtered.filter((r) => r.result === 'adjust_list').length;
    const avgDuration =
      total === 0 ? 0 : Math.round(filtered.reduce((s, r) => s + r.durationSec, 0) / total);
    return {
      total,
      directRate: total ? Math.round((direct / total) * 100) : 0,
      adjustRate: total ? Math.round((adjust / total) * 100) : 0,
      avgDuration,
    };
  }, [filtered]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 font-heading text-text-primary">Review History</h1>
          <p className="text-body text-text-muted mt-1">Audit trail & efficiency · CLOUD-P1-05</p>
        </div>
        <Button variant="secondary" icon={<Download size={18} />} onClick={() => downloadCsv(filtered)}>
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total reviews', value: String(kpis.total) },
          { label: 'Direct list rate', value: `${kpis.directRate}%` },
          { label: 'Adjust rate', value: `${kpis.adjustRate}%` },
          { label: 'Avg duration', value: formatDuration(kpis.avgDuration) },
        ].map((kpi) => (
          <Card key={kpi.label} variant="default">
            <div className="text-caption text-text-muted">{kpi.label}</div>
            <div className="text-h2 font-heading text-text-primary mt-1">{kpi.value}</div>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 mb-4 flex-wrap items-end">
        <div>
          <label className="text-caption text-text-muted block mb-1">Result</label>
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value as 'all' | TReviewResult)}
            className="h-[36px] px-3 rounded-md border border-border bg-surface-container text-body"
          >
            <option value="all">All</option>
            <option value="direct_list">Direct list</option>
            <option value="adjust_list">Adjust & list</option>
          </select>
        </div>
        <div className="min-w-[200px]">
          <Input
            label="Store"
            placeholder="Filter by store name"
            value={storeText}
            onChange={(e) => setStoreText(e.target.value)}
          />
        </div>
        <div>
          <label className="text-caption text-text-muted block mb-1">Grade</label>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value as 'all' | TGrade)}
            className="h-[36px] px-3 rounded-md border border-border bg-surface-container text-body"
          >
            <option value="all">All</option>
            {(['A', 'B', 'C', 'D'] as TGrade[]).map((g) => (
              <option key={g} value={g}>
                Grade {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card variant="default">
        <CardContent>
          <DataTable
            data={filtered}
            keyField="id"
            emptyMessage="No review history"
            columns={[
              {
                key: 'device',
                header: 'Device',
                render: (r) => (
                  <div>
                    <div className="font-semibold text-text-primary">
                      {r.brand} {r.model}
                    </div>
                    <div className="text-caption font-mono text-text-muted">…{r.imei.slice(-4)}</div>
                  </div>
                ),
              },
              {
                key: 'store',
                header: 'Store',
                render: (r) => <span className="text-text-secondary">{r.storeName}</span>,
              },
              {
                key: 'grade',
                header: 'Grade',
                render: (r) => (
                  <span className="font-mono">
                    {r.gradeBefore}
                    {r.gradeBefore !== r.gradeAfter ? (
                      <>
                        {' '}
                        → <span className="font-semibold text-primary-700">{r.gradeAfter}</span>
                      </>
                    ) : null}
                  </span>
                ),
              },
              {
                key: 'price',
                header: 'Price change',
                render: (r) => {
                  const delta = r.recycleAfter - r.recycleBefore;
                  return (
                    <span className="text-caption">
                      ₹{r.recycleBefore.toLocaleString('en-IN')}
                      {delta !== 0 && (
                        <span className={delta < 0 ? ' text-dobara-error' : ' text-dobara-success'}>
                          {' '}
                          → ₹{r.recycleAfter.toLocaleString('en-IN')}
                        </span>
                      )}
                    </span>
                  );
                },
              },
              {
                key: 'result',
                header: 'Result',
                render: (r) => (
                  <Badge variant={r.result === 'direct_list' ? 'success' : 'warning'}>
                    {r.result === 'direct_list' ? 'Direct' : 'Adjust'}
                  </Badge>
                ),
              },
              {
                key: 'reviewer',
                header: 'Reviewer',
                render: (r) => <span className="text-text-secondary">{r.reviewer}</span>,
              },
              {
                key: 'duration',
                header: 'Duration',
                render: (r) => (
                  <span className="text-caption text-text-muted">{formatDuration(r.durationSec)}</span>
                ),
              },
              {
                key: 'actions',
                header: '',
                render: (r) => (
                  <Button size="sm" variant="ghost" icon={<Eye size={14} />} onClick={() => setDetail(r)}>
                    Detail
                  </Button>
                ),
                className: 'text-right',
              },
            ]}
          />
        </CardContent>
      </Card>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Review Detail" size="md">
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-text-muted">
              <History size={16} />
              <span className="text-caption font-mono">{detail.id}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-body">
              <div>
                <div className="text-caption text-text-muted">Device</div>
                <div className="font-semibold">
                  {detail.brand} {detail.model}
                </div>
                <div className="font-mono text-caption">{detail.imei}</div>
              </div>
              <div>
                <div className="text-caption text-text-muted">Store</div>
                <div>{detail.storeName}</div>
              </div>
              <div>
                <div className="text-caption text-text-muted">Grade</div>
                <div>
                  {detail.gradeBefore} → {detail.gradeAfter}
                </div>
              </div>
              <div>
                <div className="text-caption text-text-muted">Recycle price</div>
                <div>
                  ₹{detail.recycleBefore.toLocaleString('en-IN')} → ₹
                  {detail.recycleAfter.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <div className="text-caption text-text-muted">Reviewer</div>
                <div>{detail.reviewer}</div>
              </div>
              <div>
                <div className="text-caption text-text-muted">Duration</div>
                <div>{formatDuration(detail.durationSec)}</div>
              </div>
            </div>
            <div>
              <div className="text-caption text-text-muted mb-1">Adjust reason</div>
              <p className="text-body text-text-secondary">
                {detail.adjustReason || '— (direct list, no adjustment)'}
              </p>
            </div>
            <div>
              <div className="text-caption text-text-muted mb-1">Deduction codes</div>
              <div className="flex flex-wrap gap-1">
                {detail.deductionCodes.length === 0 ? (
                  <span className="text-caption text-text-muted">None</span>
                ) : (
                  detail.deductionCodes.map((c) => (
                    <Badge key={c} variant="neutral" size="sm">
                      {c}
                    </Badge>
                  ))
                )}
              </div>
            </div>
            {detail.mainImageName && (
              <div className="text-caption text-text-muted">Main image: {detail.mainImageName}</div>
            )}
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setDetail(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReviewHistory;
