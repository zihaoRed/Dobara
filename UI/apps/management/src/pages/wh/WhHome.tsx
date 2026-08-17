import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Badge } from '@dobara/ui';
import { ArrowRight, Package, Truck, Printer, Search, ClipboardCheck } from 'lucide-react';
import { listPendingInbound, listPickOrders } from '../../lib/whStore';

const WhHome: React.FC = () => {
  const navigate = useNavigate();
  const pending = useMemo(() => listPendingInbound(), []);
  const openOrders = useMemo(() => listPickOrders(false), []);
  const b2cFirst = openOrders.filter((o) => o.channel === 'B2C').length;

  return (
    <div className="space-y-4" data-testid="wh-home">
      <h2 className="text-h3 font-heading">Warehouse Overview</h2>

      <div className="grid grid-cols-2 gap-3">
        <Card variant="hover" onClick={() => navigate('/wh/inbound')} data-testid="nav-inbound">
          <CardContent className="text-center space-y-2 py-4">
            <div className="p-3 rounded-full bg-primary-50 w-fit mx-auto">
              <Package size={24} className="text-primary-500" />
            </div>
            <p className="text-body font-semibold">Inbound</p>
            <p className="text-caption text-text-muted">{pending.length} awaiting</p>
          </CardContent>
        </Card>
        <Card variant="hover" onClick={() => navigate('/wh/picking')} data-testid="nav-picking">
          <CardContent className="text-center space-y-2 py-4">
            <div className="p-3 rounded-full bg-accent-50 w-fit mx-auto">
              <Truck size={24} className="text-accent-500" />
            </div>
            <p className="text-body font-semibold">Picking</p>
            <p className="text-caption text-text-muted">{openOrders.length} open · {b2cFirst} B2C</p>
          </CardContent>
        </Card>
        <Card variant="hover" onClick={() => navigate('/wh/inventory')} data-testid="nav-inventory">
          <CardContent className="text-center space-y-2 py-4">
            <div className="p-3 rounded-full bg-dobara-info-light w-fit mx-auto">
              <Search size={24} className="text-dobara-info" />
            </div>
            <p className="text-body font-semibold">Inventory</p>
            <p className="text-caption text-text-muted">Query stock</p>
          </CardContent>
        </Card>
        <Card variant="hover" onClick={() => navigate('/wh/picking')} data-testid="nav-labels">
          <CardContent className="text-center space-y-2 py-4">
            <div className="p-3 rounded-full bg-surface-high w-fit mx-auto">
              <Printer size={24} className="text-text-secondary" />
            </div>
            <p className="text-body font-semibold">Labels</p>
            <p className="text-caption text-text-muted">After IMEI scan</p>
          </CardContent>
        </Card>
        <Card variant="hover" onClick={() => navigate('/wh/review')} data-testid="nav-review">
          <CardContent className="text-center space-y-2 py-4">
            <div className="p-3 rounded-full bg-dobara-warning-light w-fit mx-auto">
              <ClipboardCheck size={24} className="text-dobara-warning" />
            </div>
            <p className="text-body font-semibold">Listing Review</p>
            <p className="text-caption text-text-muted">Approve & list devices</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Pending inbound ({pending.length})</h3>
        </CardHeader>
        <CardContent className="space-y-2">
          {pending.map((d) => (
            <div
              key={d.imei}
              onClick={() => navigate(`/wh/inbound?prefill=${d.imei}`)}
              className="flex items-center justify-between p-2 rounded-md bg-surface-low hover:bg-surface-high cursor-pointer transition-colors"
            >
              <div>
                <p className="text-body font-medium">{d.brand} {d.model}</p>
                <p className="text-caption text-text-body">{d.imei} · {d.color} · {d.storeName}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="warning">{d.grade}</Badge>
                <ArrowRight size={14} className="text-text-muted" />
              </div>
            </div>
          ))}
          {pending.length === 0 && (
            <p className="text-center text-text-muted py-4">No devices awaiting inbound</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WhHome;
