import React from 'react';
import { Card, CardHeader, CardContent, Badge } from '@dobara/ui';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const mockHistory = [
  { id: 'tr-001', customer: 'Rahul Sharma', oldDevice: 'iPhone 13', newDevice: 'iPhone 14', oldPrice: 38000, newPrice: 55000, actual: 17000, status: 'confirmed', date: '2026-07-28' },
  { id: 'tr-002', customer: 'Priya Patel', oldDevice: 'Galaxy S22', newDevice: 'Galaxy S23', oldPrice: 31000, newPrice: 52000, actual: 21000, status: 'confirmed', date: '2026-07-25' },
  { id: 'tr-003', customer: 'Amit Singh', oldDevice: 'OnePlus Nord 2', newDevice: 'OnePlus 11R', oldPrice: 14000, newPrice: 28000, actual: 14000, status: 'submitted', date: '2026-07-22' },
  { id: 'tr-004', customer: 'Sneha Reddy', oldDevice: 'Xiaomi Mi 11', newDevice: 'Xiaomi 13 Pro', oldPrice: 18000, newPrice: 35000, actual: 17000, status: 'submitted', date: '2026-07-20' },
];

const TradeInHistory: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/owner')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h2 className="text-h3 font-heading">Trade-in History</h2>
      </div>

      {mockHistory.map((item) => (
        <Card key={item.id}>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <p className="text-body font-semibold">{item.customer}</p>
              <Badge variant={item.status === 'confirmed' ? 'success' : 'warning'}>
                {item.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-caption text-text-body">
              <span>{item.oldDevice}</span>
              <span>→</span>
              <span>{item.newDevice}</span>
            </div>
            <div className="flex justify-between mt-2 text-caption text-text-muted">
              <span>Deduction: ₹{item.oldPrice.toLocaleString('en-IN')}</span>
              <span>New: ₹{item.newPrice.toLocaleString('en-IN')}</span>
              <span className="font-semibold text-text-primary">Paid: ₹{item.actual.toLocaleString('en-IN')}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TradeInHistory;
