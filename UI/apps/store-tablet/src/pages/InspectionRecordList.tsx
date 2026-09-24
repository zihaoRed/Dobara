import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Badge } from '@dobara/ui';
import { ArrowLeft, Play, RotateCcw, UploadCloud, ClipboardList } from 'lucide-react';
import {
  listInspectionRecords,
  RECORD_STATUS_FILTERS,
  RECORD_STATUS_LABEL,
  type IInspectionRecord,
  type TInspectionRecordStatus,
} from '../lib/recordStore';
import { getProgress, resumePath } from '../lib/sessionProgress';

type TBadgeVariant = 'neutral' | 'info' | 'success' | 'error' | 'warning';

const STATUS_BADGE: Record<TInspectionRecordStatus, TBadgeVariant> = {
  pending: 'neutral',
  inspecting: 'info',
  completed: 'success',
  rejected: 'error',
  redeemed: 'success',
  upload_failed: 'warning',
};

/** TAB-P1-06 — inspection record list with status filter + start/continue actions. */
export default function InspectionRecordList() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<TInspectionRecordStatus | 'all'>('all');
  const [records, setRecords] = useState<IInspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listInspectionRecords(status).then((list) => {
      if (cancelled) return;
      setRecords(list);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [status]);

  // 质检中 → 继续质检：从本地活跃进度恢复到中断步骤。
  const continueInspection = (r: IInspectionRecord) => {
    const p = getProgress();
    if (p && p.sessionId === r.sessionId) navigate(resumePath(p));
    else navigate(`/session/${r.sessionId}`);
  };

  // 待质检 → 开始质检：顾客到店二次核身（OTP）后进入质检流程。
  const startInspection = (r: IInspectionRecord) => {
    navigate(`/session/${r.sessionId}/verify`, { state: { phone: r.customerPhone } });
  };

  return (
    <div className="p-4 sm:p-6" data-testid="inspection-records">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft size={16} />
        </Button>
        <h1 className="text-h3 font-heading text-text-primary">Inspection Records</h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {RECORD_STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            data-testid={`filter-${f.key}`}
            onClick={() => setStatus(f.key)}
            className={`px-3 py-1.5 rounded-full text-caption font-medium border transition-colors ${
              status === f.key
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-border text-text-secondary hover:bg-surface-container'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 bg-surface-high rounded-xl animate-pulse" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <Card className="py-10 text-center">
          <ClipboardList size={32} className="text-text-muted mx-auto mb-2" />
          <p className="text-body text-text-secondary">No inspection records for this filter.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {records.map((r) => (
            <Card key={r.sessionId} variant="flat" className="p-3" data-testid={`record-${r.sessionId}`}>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-caption font-semibold text-text-primary">{r.device}</span>
                    <Badge variant={STATUS_BADGE[r.status]}>{RECORD_STATUS_LABEL[r.status]}</Badge>
                  </div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    {r.customerName} · +91 {r.customerPhone} · {r.sessionId} · {r.date}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {r.status === 'pending' && (
                    <Button size="sm" variant="primary" icon={<Play size={14} />} data-testid={`start-${r.sessionId}`} onClick={() => startInspection(r)}>
                      Start
                    </Button>
                  )}
                  {r.status === 'inspecting' && (
                    <Button size="sm" variant="primary" icon={<RotateCcw size={14} />} data-testid={`continue-${r.sessionId}`} onClick={() => continueInspection(r)}>
                      Continue
                    </Button>
                  )}
                  {r.status === 'upload_failed' && (
                    <Button size="sm" variant="secondary" icon={<UploadCloud size={14} />} onClick={() => navigate(`/session/${r.sessionId}/submit`)}>
                      Retry upload
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
