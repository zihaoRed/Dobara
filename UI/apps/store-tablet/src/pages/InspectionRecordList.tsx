import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Badge, Modal } from '@dobara/ui';
import { ArrowLeft, Play, RotateCcw, Pencil, RefreshCw, UploadCloud, X, ClipboardList, Eye } from 'lucide-react';
import {
  listInspectionRecords,
  RECORD_STATUS_TABS,
  HANDOVER_STATUS_LABEL,
  type IInspectionRecord,
  type TInspectionRecordStatus,
} from '../lib/recordStore';
import { getProgress, resumePath, modifyInspection, reInspect } from '../lib/sessionProgress';

/** TAB-P1-06 — inspection record list，按 5 个状态 Tab 分组；卡片不展示状态标签（Tab 已表意）. */
export default function InspectionRecordList() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<TInspectionRecordStatus>('pending');
  const [records, setRecords] = useState<IInspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<IInspectionRecord | null>(null);

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

  // 质检中 → 修改质检：回退到上一个已完成步骤重做。
  const modifyRecord = (r: IInspectionRecord) => {
    const path = modifyInspection(r.sessionId);
    if (path) navigate(path);
  };

  // 重新质检：归档并清空，跳转 /otp 新建会话。
  const reInspectRecord = () => {
    reInspect();
    navigate('/otp');
  };

  // 待质检 → 开始质检：顾客到店二次核身（OTP）后进入质检流程。
  const startInspection = (r: IInspectionRecord) => {
    navigate(`/session/${r.sessionId}/verify`, { state: { phone: r.customerPhone } });
  };

  const confirmCancel = () => {
    setCancelTarget(null);
    navigate('/records', { state: {} });
  };

  return (
    <div className="p-4 sm:p-6" data-testid="inspection-records">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft size={16} />
        </Button>
        <h1 className="text-h3 font-heading text-text-primary">Inspection Records</h1>
      </div>

      {/* 状态 Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto" data-testid="record-tabs">
        {RECORD_STATUS_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            data-testid={`tab-${t.key}`}
            onClick={() => setStatus(t.key)}
            className={`px-4 py-2 rounded-lg text-caption font-semibold whitespace-nowrap border transition-colors ${
              status === t.key
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-border text-text-secondary hover:bg-surface-container'
            }`}
          >
            {t.label}
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
          <p className="text-body text-text-secondary">No inspection records for this status.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {records.map((r) => (
            <Card key={r.sessionId} variant="flat" className="p-3" data-testid={`record-${r.sessionId}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-caption font-semibold text-text-primary">{r.device}</p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {r.customerName} · +91 {r.customerPhone} · {r.sessionId}
                  </p>

                  {status === 'pending' && (r.appointmentDate || r.appointmentSlot) && (
                    <p className="text-[11px] text-primary-600 mt-1">
                      Appointment: {[r.appointmentDate, r.appointmentSlot].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {status === 'inspecting' && r.uploadFailed && (
                    <p className="text-[11px] text-dobara-warning mt-1">Upload failed</p>
                  )}
                  {status === 'completed' && r.handoverStatus && (
                    <Badge variant={r.handoverStatus === 'verified' ? 'success' : 'info'} className="mt-1">
                      {HANDOVER_STATUS_LABEL[r.handoverStatus]}
                    </Badge>
                  )}
                  {status === 'rejected' && r.rejectionReason && (
                    <p className="text-[11px] text-dobara-error mt-1">Reason: {r.rejectionReason}</p>
                  )}
                  {status === 'cancelled' && (
                    <p className="text-[11px] text-text-muted mt-1">
                      Cancelled{r.cancelledAt ? ` · ${r.cancelledAt}` : ''}
                      {r.cancelReason ? ` · ${r.cancelReason}` : ''}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 shrink-0 flex-wrap justify-end max-w-[240px]">
                  {status === 'pending' && (
                    <>
                      <Button size="sm" variant="primary" icon={<Play size={14} />} data-testid={`start-${r.sessionId}`} onClick={() => startInspection(r)}>
                        Start
                      </Button>
                      <Button size="sm" variant="ghost" icon={<X size={14} />} data-testid={`cancel-${r.sessionId}`} onClick={() => setCancelTarget(r)}>
                        Cancel
                      </Button>
                    </>
                  )}
                  {status === 'inspecting' && (
                    <>
                      <Button size="sm" variant="primary" icon={<RotateCcw size={14} />} data-testid={`continue-${r.sessionId}`} onClick={() => continueInspection(r)}>
                        Continue
                      </Button>
                      <Button size="sm" variant="secondary" icon={<Pencil size={14} />} data-testid={`modify-${r.sessionId}`} onClick={() => modifyRecord(r)}>
                        Modify
                      </Button>
                      <Button size="sm" variant="secondary" icon={<RefreshCw size={14} />} data-testid={`reinspect-${r.sessionId}`} onClick={reInspectRecord}>
                        Re-inspect
                      </Button>
                      {r.uploadFailed && (
                        <Button size="sm" variant="secondary" icon={<UploadCloud size={14} />} onClick={() => navigate(`/session/${r.sessionId}/submit`)}>
                          Re-upload
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" icon={<X size={14} />} onClick={() => setCancelTarget(r)}>
                        Cancel
                      </Button>
                    </>
                  )}
                  {status === 'completed' && (
                    <Button size="sm" variant="secondary" icon={<Eye size={14} />} onClick={() => navigate(`/session/${r.sessionId}/report`)}>
                      View
                    </Button>
                  )}
                  {status === 'rejected' && (
                    <>
                      <Button size="sm" variant="secondary" icon={<Eye size={14} />} onClick={() => navigate(`/session/${r.sessionId}/reject`)}>
                        View
                      </Button>
                      <Button size="sm" variant="secondary" icon={<RefreshCw size={14} />} onClick={reInspectRecord}>
                        Re-inspect
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!cancelTarget} onClose={() => setCancelTarget(null)} title="Cancel inspection?" size="sm">
        <p className="text-body text-text-secondary mb-4">
          Cancel the inspection for <b>{cancelTarget?.customerName}</b> ({cancelTarget?.device})? The record will move
          to the Cancelled tab.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setCancelTarget(null)}>
            Keep it
          </Button>
          <Button variant="danger" className="flex-1" data-testid="confirm-cancel-record" onClick={confirmCancel}>
            Cancel inspection
          </Button>
        </div>
      </Modal>
    </div>
  );
}
