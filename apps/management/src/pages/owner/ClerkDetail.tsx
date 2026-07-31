import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Badge, Button, Modal } from '@dobara/ui';
import { ArrowLeft, Phone, Shield, Clock, Trash2 } from 'lucide-react';

const clerkData = {
  'c-1': { name: 'Amit Singh', phone: '+91-9876543203', role: 'clerk', lastActive: '2 hours ago', monthlyInspections: 32, joinedDate: '2026-01-15' },
  'c-2': { name: 'Sunil Yadav', phone: '+91-9876543209', role: 'clerk', lastActive: '1 day ago', monthlyInspections: 28, joinedDate: '2026-03-10' },
  'c-3': { name: 'Meena Devi', phone: '+91-9876543210', role: 'senior_clerk', lastActive: '5 min ago', monthlyInspections: 45, joinedDate: '2025-11-01' },
};

const ClerkDetail: React.FC = () => {
  const { clerkId } = useParams<{ clerkId: string }>();
  const navigate = useNavigate();
  const [showRemove, setShowRemove] = useState(false);
  const [removed, setRemoved] = useState(false);

  const clerk = clerkData[clerkId || ''];

  if (!clerk) {
    return (
      <div className="text-center py-8 text-text-muted">
        <p>Clerk not found</p>
        <Button variant="ghost" onClick={() => navigate('/owner/clerks')}>Back to Clerks</Button>
      </div>
    );
  }

  if (removed) {
    return (
      <Card className="text-center py-6">
        <CardContent className="space-y-3">
          <h3 className="text-h3 font-heading">Clerk Removed</h3>
          <p className="text-body text-text-secondary">{clerk.name} has been removed</p>
          <Button onClick={() => navigate('/owner/clerks')}>Back to Clerks</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/owner/clerks')} className="p-1 hover:bg-surface-high rounded">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h2 className="text-h3 font-heading">{clerk.name}</h2>
      </div>

      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-body">
            <Phone size={16} className="text-text-muted" />
            <span>{clerk.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-body">
            <Shield size={16} className="text-text-muted" />
            <Badge variant="info">{clerk.role === 'clerk' ? 'Clerk' : 'Senior Clerk'}</Badge>
          </div>
          <div className="flex items-center gap-2 text-body">
            <Clock size={16} className="text-text-muted" />
            <span>Last Active: {clerk.lastActive}</span>
          </div>
          <div className="border-t border-border pt-3">
            <p className="text-caption text-text-muted">Monthly Inspections</p>
            <p className="text-h4 font-heading text-primary-500">{clerk.monthlyInspections}</p>
          </div>
          <div>
            <p className="text-caption text-text-muted">Joined</p>
            <p className="text-body">{clerk.joinedDate}</p>
          </div>
        </CardContent>
      </Card>

      <Button variant="danger" size="md" className="w-full" icon={<Trash2 size={18} />} onClick={() => setShowRemove(true)}>
        Remove Clerk
      </Button>

      <Modal open={showRemove} onClose={() => setShowRemove(false)} title="Remove Clerk">
        <p className="text-body text-text-secondary mb-4">
          Are you sure you want to remove <strong>{clerk.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setShowRemove(false)}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={() => { setShowRemove(false); setRemoved(true); }}>
            Confirm Remove
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ClerkDetail;
