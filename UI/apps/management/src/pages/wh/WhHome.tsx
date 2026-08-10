import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Badge, Button } from '@dobara/ui';
import { ArrowRight, Package, Truck } from 'lucide-react';

const mockPendingInbound = [
  { imei: '350000000000001', brand: 'Apple', model: 'iPhone 13', grade: 'A', store: 'MobileXchange Andheri', color: 'Midnight' },
  { imei: '350000000000002', brand: 'Apple', model: 'iPhone 13', grade: 'B', store: 'GadgetMart CP', color: 'Blue' },
  { imei: '350000000000003', brand: 'Apple', model: 'iPhone 12', grade: 'A', store: 'MobileXchange Andheri', color: 'White' },
  { imei: '350000000000007', brand: 'Samsung', model: 'Galaxy S22', grade: 'A', store: 'MobileXchange Andheri', color: 'Phantom Black' },
];

const WhHome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <h2 className="text-h3 font-heading">Warehouse Overview</h2>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Card variant="hover" onClick={() => navigate('/wh/inbound')}>
          <CardContent className="text-center space-y-2 py-4">
            <div className="p-3 rounded-full bg-primary-50 w-fit mx-auto">
              <Package size={24} className="text-primary-500" />
            </div>
            <p className="text-body font-semibold">Inbound Scan</p>
            <p className="text-caption text-text-muted">Receive devices</p>
          </CardContent>
        </Card>
        <Card variant="hover" onClick={() => navigate('/wh/picking')}>
          <CardContent className="text-center space-y-2 py-4">
            <div className="p-3 rounded-full bg-accent-50 w-fit mx-auto">
              <Truck size={24} className="text-accent-500" />
            </div>
            <p className="text-body font-semibold">Picking</p>
            <p className="text-caption text-text-muted">Outbound orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Inbound */}
      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Pending Inbound ({mockPendingInbound.length})</h3>
        </CardHeader>
        <CardContent className="space-y-2">
          {mockPendingInbound.map((d) => (
            <div
              key={d.imei}
              onClick={() => navigate(`/wh/inbound/${d.imei}`)}
              className="flex items-center justify-between p-2 rounded-md bg-surface-low hover:bg-surface-high cursor-pointer transition-colors"
            >
              <div>
                <p className="text-body font-medium">{d.brand} {d.model}</p>
                <p className="text-caption text-text-body">{d.imei} · {d.color} · {d.store}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="warning">{d.grade}</Badge>
                <ArrowRight size={14} className="text-text-muted" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default WhHome;
