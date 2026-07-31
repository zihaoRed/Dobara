import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Badge, Button } from '@dobara/ui';
import { ArrowRight, TrendingUp, Clock, CheckCircle } from 'lucide-react';

interface TradeInItem {
  sessionId: string;
  customerName: string;
  device: string;
  oldDevicePrice: number;
  status: 'pending' | 'submitted' | 'confirmed';
  date: string;
}

const mockTradeIns: TradeInItem[] = [
  { sessionId: 'sess-001', customerName: 'Rahul Sharma', device: 'iPhone 13 128GB', oldDevicePrice: 38000, status: 'pending', date: '2026-07-30' },
  { sessionId: 'sess-002', customerName: 'Priya Patel', device: 'Galaxy S22 256GB', oldDevicePrice: 31000, status: 'pending', date: '2026-07-29' },
  { sessionId: 'sess-003', customerName: 'Amit Singh', device: 'OnePlus Nord 2 128GB', oldDevicePrice: 14000, status: 'submitted', date: '2026-07-28' },
];

const OwnerHome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <h2 className="text-h3 font-heading">Store Overview</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-accent-50">
              <Clock size={20} className="text-accent-500" />
            </div>
            <div>
              <p className="text-caption text-text-muted">Today Pending</p>
              <p className="text-h4 font-heading">12</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary-50">
              <CheckCircle size={20} className="text-primary-500" />
            </div>
            <div>
              <p className="text-caption text-text-muted">This Month</p>
              <p className="text-h4 font-heading">47</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-dobara-info-light">
              <TrendingUp size={20} className="text-dobara-info" />
            </div>
            <div>
              <p className="text-caption text-text-muted">Revenue</p>
              <p className="text-h4 font-heading">₹1.8L</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-dobara-success-light">
              <CheckCircle size={20} className="text-dobara-success" />
            </div>
            <div>
              <p className="text-caption text-text-muted">Closed</p>
              <p className="text-h4 font-heading">39</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Trade-ins */}
      <Card>
        <CardHeader>
          <h3 className="text-h4 font-heading">Pending Trade-ins</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockTradeIns.map((item) => (
            <div
              key={item.sessionId}
              onClick={() => navigate(`/owner/trade-in/${item.sessionId}`)}
              className="flex items-center justify-between p-3 rounded-md bg-surface-low hover:bg-surface-high cursor-pointer transition-colors"
            >
              <div>
                <p className="text-body font-medium">{item.customerName}</p>
                <p className="text-caption text-text-body">{item.device}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-body font-semibold">₹{(item.oldDevicePrice).toLocaleString('en-IN')}</p>
                  <Badge variant={item.status === 'pending' ? 'warning' : 'success'}>
                    {item.status}
                  </Badge>
                </div>
                <ArrowRight size={16} className="text-text-muted" />
              </div>
            </div>
          ))}
          {mockTradeIns.length === 0 && (
            <p className="text-center text-text-muted py-4">No pending trade-ins</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerHome;
