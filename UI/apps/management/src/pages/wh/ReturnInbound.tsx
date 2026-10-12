import React, { useEffect, useState } from 'react';
import { Card, CardContent, Badge, Button } from '@dobara/ui';
import { PackageCheck } from 'lucide-react';

interface ITicket {
  id: string;
  orderId: string;
  type: string;
  reason: string;
  status: string;
  returnTrackingNo?: string;
}

/** WH-P0-07 售后退回入库确认 —— 退回设备核验防拆标签 + 出库快照比对 */
export default function ReturnInbound() {
  const [returning, setReturning] = useState<ITicket[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch('/api/after-sales')
      .then((r) => r.json())
      .then((d) => setReturning((d.tickets || []).filter((t: ITicket) => t.status === 'returning')))
      .catch(() => setReturning([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  const verify = async (id: string, intact: boolean) => {
    await fetch(`/api/after-sales/${id}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full: intact, note: intact ? '防拆标签完整 · 重新质检上架' : '防拆标签破损 · 争议处理' }),
    });
    load();
  };

  return (
    <div className="space-y-4" data-testid="wh-return-inbound">
      <div>
        <h2 className="text-h3 font-heading">Return Inbound</h2>
        <p className="text-caption text-text-muted mt-1">WH-P0-07 · 退回设备核验防拆标签 + 出库快照比对</p>
      </div>

      {loading ? (
        <p className="text-body text-text-muted">Loading…</p>
      ) : returning.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <PackageCheck size={36} className="mx-auto text-text-muted" />
            <p className="text-body text-text-secondary mt-2">暂无待退回入库设备</p>
          </CardContent>
        </Card>
      ) : (
        returning.map((t) => (
          <Card key={t.id} variant="flat" className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-text-primary">{t.id}</span>
              <span className="text-caption text-text-muted">Order {t.orderId}</span>
              <Badge variant="warning" className="ml-auto">Returning</Badge>
            </div>
            <p className="text-caption text-text-muted mb-2">
              {t.reason}
              {t.returnTrackingNo ? ` · 单号 ${t.returnTrackingNo}` : ''}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="primary" onClick={() => verify(t.id, true)} data-testid={`verify-intact-${t.id}`}>
                标签完整 · 重新质检上架
              </Button>
              <Button size="sm" variant="danger" onClick={() => verify(t.id, false)} data-testid={`verify-dispute-${t.id}`}>
                标签破损 · 争议
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
