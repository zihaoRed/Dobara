import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, StatusBadge } from '@dobara/ui';
import { CheckCircle, Clock, UserCheck, ArrowLeft } from 'lucide-react';
import { TVerificationStatus } from '@dobara/utils';

const STATUS_STEPS: { key: TVerificationStatus; label: string; icon: React.ReactNode; statusKey: 'completed' | 'in_progress' | 'pending' }[] = [
  {
    key: 'pending_owner',
    label: 'Store Owner Entry',
    icon: <UserCheck size={24} />,
    statusKey: 'completed',
  },
  {
    key: 'pending_user',
    label: 'User Confirmation',
    icon: <Clock size={24} />,
    statusKey: 'in_progress',
  },
  {
    key: 'verified',
    label: 'Verified',
    icon: <CheckCircle size={24} />,
    statusKey: 'pending',
  },
];

export default function VerificationStatus() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [currentStatus] = useState<TVerificationStatus>('pending_user');

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/session/${sessionId}/report`)}
        >
          <ArrowLeft size={16} />
        </Button>
        <h1 className="text-h3 font-heading text-text-primary">Verification Status</h1>
      </div>

      <div className="space-y-6">
        {STATUS_STEPS.map((step, i) => {
          const isActive = currentStatus === step.key;
          const isPast = STATUS_STEPS.findIndex((s) => s.key === currentStatus) > i;

          let statusLabel = '';
          let statusColor = '';

          if (isPast || step.key === 'pending_owner') {
            statusLabel = 'Completed';
            statusColor = 'bg-dobara-success-light text-[#064e3b]';
          } else if (isActive) {
            statusLabel = 'In Progress';
            statusColor = 'bg-dobara-info-light text-[#1e3a8a]';
          } else {
            statusLabel = 'Pending';
            statusColor = 'bg-surface-high text-text-muted';
          }

          return (
            <Card key={step.key} variant="flat">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isPast || step.key === 'pending_owner'
                      ? 'bg-dobara-success-light text-dobara-success'
                      : isActive
                      ? 'bg-dobara-info-light text-dobara-info'
                      : 'bg-surface-high text-text-muted'
                  }`}
                >
                  {step.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lead font-semibold text-text-primary">{step.label}</h3>
                  <p className="text-caption text-text-muted">
                    {step.key === 'pending_owner'
                      ? 'Store owner has reviewed and approved the inspection'
                      : step.key === 'pending_user'
                      ? 'Waiting for customer to confirm the price offer'
                      : 'The session will be marked as complete'}
                  </p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-caption font-semibold ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
