import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Badge, Button } from '@dobara/ui';
import { ArrowRight, Box, MapPin, ArrowLeft } from 'lucide-react';

const mockOrders = [
  { orderId: 'ORD-001', device: 'iPhone 13', quantity: 5, destination: 'MobileXchange Andheri', status: 'ready' },
  { orderId: 'ORD-002', device: 'Galaxy S22', quantity: 3, destination: 'GadgetMart CP', status: 'ready' },
  { orderId: 'ORD-003', device: 'iPhone 14', quantity: 2, destination: 'Fonfix Koramangala', status: 'ready' },
];

const PickingList: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/wh')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h2 className="text-h3 font-heading">Pending Picking</h2>
      </div>

      {mockOrders.map((order) => (
        <Card
          key={order.orderId}
          variant="hover"
          onClick={() => navigate(`/wh/picking/${order.orderId}/scan`)}
        >
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-body font-semibold">{order.orderId}</span>
                  <Badge variant="success">{order.status}</Badge>
                </div>
                <p className="text-body text-text-secondary">{order.device} ×{order.quantity}</p>
                <p className="text-caption text-text-muted flex items-center gap-1">
                  <MapPin size={12} />
                  {order.destination}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Box size={20} className="text-text-muted" />
                <ArrowRight size={16} className="text-text-muted" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PickingList;
