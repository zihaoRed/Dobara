import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Button, Badge } from '@dobara/ui';
import { ArrowLeft, Truck, Warehouse, CheckCircle, MapPin } from 'lucide-react';
import {
  getShipment,
  shipShipment,
  WAREHOUSES,
  warehouseById,
  markShipmentDelivered,
} from '../../lib/shipmentStore';

const ShipmentDetail: React.FC = () => {
  const { shipmentId = '' } = useParams<{ shipmentId: string }>();
  const navigate = useNavigate();
  const [warehouseId, setWarehouseId] = useState(getShipment(shipmentId)?.warehouseId ?? '');
  const [tick, setTick] = useState(0);
  const current = useMemo(() => {
    void tick;
    return getShipment(shipmentId);
  }, [tick, shipmentId]);

  if (!current) {
    return (
      <div className="text-center py-8 space-y-3">
        <p className="text-text-muted">Shipment not found for {shipmentId}</p>
        <Button variant="ghost" onClick={() => navigate('/db/dispatch')}>Back</Button>
      </div>
    );
  }

  const wh = warehouseById(current.warehouseId);

  const statusBadge = () => {
    switch (current.status) {
      case 'created':
        return <Badge variant="neutral">Awaiting ship</Badge>;
      case 'shipped':
        return <Badge variant="warning">In transit</Badge>;
      case 'delivered':
        return <Badge variant="success">Delivered</Badge>;
      case 'exception':
        return <Badge variant="error">Exception</Badge>;
      default:
        return null;
    }
  };

  const handleShip = () => {
    shipShipment(current.id, warehouseId);
    setTick((t) => t + 1);
  };

  return (
    <div className="space-y-4" data-testid="shipment-detail">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/db/dispatch')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h2 className="text-h3 font-heading">Dispatch detail</h2>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-h4 font-heading">{current.id}</h3>
            {statusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-body text-text-secondary">{current.storeName}</p>
          <div className="flex items-center gap-2 text-caption text-text-body">
            <Warehouse size={14} />
            <span>{wh?.name ?? current.warehouseId}</span>
            {current.selectSource === 'manual' && <Badge variant="warning">Manual re-route</Badge>}
          </div>
          {current.trackingNo && (
            <div className="flex items-center gap-2 text-caption text-text-body">
              <Truck size={14} />
              <span>Delhivery AWB {current.trackingNo}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Devices ({current.devices.length})</h3>
        </CardHeader>
        <CardContent className="space-y-2">
          {current.devices.map((d) => (
            <div key={d.imeiTail} className="flex justify-between py-1 border-b border-border last:border-0">
              <span className="text-body">
                {d.brand} {d.model} <span className="text-caption text-text-muted">· IMEI …{d.imeiTail}</span>
              </span>
              <span className="text-caption text-text-muted">Grade {d.grade}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {current.status === 'created' && (
        <Card>
          <CardHeader>
            <h3 className="text-h4 font-heading">Select warehouse & dispatch</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-caption font-semibold text-text-secondary">Target warehouse</label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="h-[40px] px-3 rounded-md border border-border bg-surface-container text-body"
                data-testid="warehouse-select"
              >
                {WAREHOUSES.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}{w.id === current.defaultWarehouseId ? ' (bound)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-caption text-text-muted flex items-center gap-1">
                <MapPin size={12} /> Default = store's bound warehouse; re-routing is audited (manual)
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              icon={<Truck size={18} />}
              data-testid="confirm-ship"
              onClick={handleShip}
            >
              Ship with Delhivery
            </Button>
          </CardContent>
        </Card>
      )}

      {current.status !== 'created' && (
        <Card>
          <CardHeader>
            <h3 className="text-h4 font-heading">Tracking</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {current.tracking.length === 0 && (
              <p className="text-caption text-text-muted">No tracking events yet.</p>
            )}
            {current.tracking.map((t, idx) => (
              <div key={idx} className="flex gap-3">
                <CheckCircle size={16} className="text-primary-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-body">{t.status}</p>
                  <p className="text-caption text-text-muted">
                    {t.note} · {new Date(t.at).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ))}
            {current.status === 'shipped' && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Warehouse size={16} />}
                data-testid="simulate-inbound"
                onClick={() => {
                  markShipmentDelivered(current.id);
                  setTick((t) => t + 1);
                }}
              >
                Simulate warehouse scan-in (delivered)
              </Button>
            )}
            {current.status === 'delivered' && (
              <p className="text-caption text-dobara-success flex items-center gap-1">
                <CheckCircle size={14} /> Warehouse scanned in · dispatch closed
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ShipmentDetail;
