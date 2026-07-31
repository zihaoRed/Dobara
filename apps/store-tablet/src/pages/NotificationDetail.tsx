import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, CardHeader, CardContent, PriceDisplay, Badge } from '@dobara/ui';
import { ArrowLeft, Clock } from 'lucide-react';

const notificationData: Record<string, any> = {
  'n-1': {
    title: 'Price Adjustment - iPhone 13',
    originalPrice: 42000,
    adjustedPrice: 38500,
    reason: 'Screen has minor scratches not visible in photos. Adjusted from Grade A to Grade B.',
    adjustmentType: 'Grade: A → B',
    time: '2026-07-30 14:30',
    status: 'adjusted',
  },
  'n-2': {
    title: 'Grade Update - Galaxy S22',
    originalPrice: 40000,
    adjustedPrice: 35000,
    reason: 'Back cover shows signs of heavy use. Downgraded from A to B.',
    adjustmentType: 'Grade: A → B',
    time: '2026-07-30 11:15',
    status: 'adjusted',
  },
  'n-3': {
    title: 'Session Verified - Xiaomi Mi 11',
    originalPrice: 22000,
    adjustedPrice: 22000,
    reason: 'No adjustments. Customer accepted the offer.',
    adjustmentType: 'None',
    time: '2026-07-29 16:45',
    status: 'verified',
  },
  'n-4': {
    title: 'Deduction Alert - OnePlus Nord 2',
    originalPrice: 20000,
    adjustedPrice: 18000,
    reason: '₹2,000 deducted: original charger not included.',
    adjustmentType: 'Deduction: ₹2,000',
    time: '2026-07-28 10:00',
    status: 'adjusted',
  },
  'n-5': {
    title: 'Rejection Reviewed - iPhone 12',
    originalPrice: null,
    adjustedPrice: null,
    reason: 'Ops team confirmed the rejection. Device returned to customer.',
    adjustmentType: 'Rejected',
    time: '2026-07-27 09:00',
    status: 'rejected',
  },
};

export default function NotificationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const data = id ? notificationData[id] : null;

  if (!data) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate('/notifications')}>
          <ArrowLeft size={16} /> Back
        </Button>
        <p className="text-body text-text-muted mt-4">Notification not found.</p>
      </div>
    );
  }

  const hasPriceChange = data.originalPrice !== null && data.adjustedPrice !== null;
  const priceDiff = hasPriceChange ? data.originalPrice - data.adjustedPrice : 0;

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/notifications')}
        >
          <ArrowLeft size={16} />
        </Button>
        <h1 className="text-h3 font-heading text-text-primary">{data.title}</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-text-muted" />
            <span className="text-caption text-text-muted">{data.time}</span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-body text-text-secondary mb-6">{data.reason}</p>

          {hasPriceChange && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-surface-high rounded-lg">
              <div className="text-center">
                <p className="text-eyebrow text-text-muted uppercase mb-1">Original Price</p>
                <PriceDisplay amount={data.originalPrice} size="sm" strikethrough={priceDiff > 0} />
              </div>
              <div className="text-center">
                <p className="text-eyebrow text-text-muted uppercase mb-1">Adjustment</p>
                <span className={`text-lead font-bold ${priceDiff > 0 ? 'text-dobara-error' : 'text-dobara-success'}`}>
                  {priceDiff > 0 ? `-₹${priceDiff.toLocaleString('en-IN')}` : 'No Change'}
                </span>
              </div>
              <div className="text-center">
                <p className="text-eyebrow text-text-muted uppercase mb-1">Final Price</p>
                <PriceDisplay amount={data.adjustedPrice} size="sm" />
              </div>
            </div>
          )}

          {data.status === 'rejected' && (
            <div className="text-center p-4">
              <Badge variant="error" size="md">Device Rejected</Badge>
            </div>
          )}

          {data.status === 'verified' && (
            <div className="text-center p-4">
              <Badge variant="success" size="md">Verified</Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
