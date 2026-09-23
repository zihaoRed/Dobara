import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Badge, Button } from '@dobara/ui';
import { ArrowLeft, Truck, PackageCheck } from 'lucide-react';
import { listShipments, warehouseById, batchShipShipments } from '../../lib/shipmentStore';

const statusBadge = (s: string) => {
  switch (s) {
    case 'created':
      return <Badge variant="neutral">Awaiting ship</Badge>;
    case 'shipped':
      return <Badge variant="warning">In transit</Badge>;
    case 'delivered':
      return <Badge variant="success">Delivered</Badge>;
    case 'exception':
      return <Badge variant="error">Exception</Badge>;
    default:
      return <Badge variant="neutral">{s}</Badge>;
  }
};

const ShipmentList: React.FC = () => {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const shipments = useMemo(() => {
    void tick;
    return listShipments();
  }, [tick]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState('');

  const pending = shipments.filter((s) => s.status === 'created');

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBatch = () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    const first = shipments.find((s) => s.id === ids[0]);
    if (!first) return;
    const wh = warehouseById(first.defaultWarehouseId);
    const shipped = batchShipShipments(ids, first.defaultWarehouseId);
    setSelected(new Set());
    setTick((t) => t + 1);
    setToast(`Dispatched ${shipped.length} shipment(s) to ${wh?.name ?? first.defaultWarehouseId}`);
  };

  return (
    <div className="space-y-4" data-testid="shipment-list">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" onClick={() => navigate('/db')} className="p-1 hover:bg-surface-high rounded">
            <ArrowLeft size={20} className="text-text-secondary" />
          </button>
          <div>
            <h2 className="text-h3 font-heading">Recycling dispatch</h2>
            <p className="text-caption text-text-muted">{pending.length} awaiting ship · store → warehouse</p>
          </div>
        </div>
        {selected.size > 0 && (
          <Button size="sm" variant="primary" icon={<Truck size={16} />} data-testid="batch-ship" onClick={handleBatch}>
            Ship {selected.size}
          </Button>
        )}
      </div>

      {toast && (
        <p className="text-caption text-primary-700 bg-primary-50 rounded-md px-3 py-2" data-testid="ship-toast">
          {toast}
        </p>
      )}

      {shipments.map((s) => {
        const wh = warehouseById(s.warehouseId);
        return (
          <Card
            key={s.id}
            variant={s.status === 'created' ? 'default' : 'flat'}
            className={s.status !== 'created' ? 'opacity-80' : ''}
            data-testid={`shipment-row-${s.id}`}
          >
            <CardContent>
              <div className="flex items-start gap-3">
                {s.status === 'created' ? (
                  <input
                    type="checkbox"
                    checked={selected.has(s.id)}
                    onChange={() => toggle(s.id)}
                    className="mt-1 w-4 h-4 rounded border-border accent-primary-500 flex-shrink-0"
                  />
                ) : (
                  <span className="mt-1 flex-shrink-0">
                    <PackageCheck size={18} className="text-text-muted" />
                  </span>
                )}
                <div
                  className="flex-1 cursor-pointer min-w-0"
                  onClick={() => navigate(`/db/dispatch/${s.id}`)}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-body font-semibold">{s.storeName}</span>
                    {statusBadge(s.status)}
                  </div>
                  <p className="text-caption text-text-body">
                    {s.id} · {s.devices.length} device{s.devices.length > 1 ? 's' : ''} ·{' '}
                    {s.devices.map((d) => `${d.brand} ${d.model}`).join(', ')}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-caption text-text-muted">→ {wh?.name ?? s.warehouseId}</span>
                    <span className="text-caption text-text-muted">
                      {s.status === 'shipped' && s.trackingNo
                        ? `AWB ${s.trackingNo}`
                        : s.status === 'delivered'
                          ? 'delivered'
                          : `created ${s.createdAt.slice(0, 10)}`}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ShipmentList;
