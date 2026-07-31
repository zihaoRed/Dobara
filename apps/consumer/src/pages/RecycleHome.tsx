import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input } from '@dobara/ui';
import { ClipboardCheck, Search } from 'lucide-react';

export function RecycleHome() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState('');

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-h3 font-heading text-text-primary mb-1">Device Recycling</h1>
      <p className="text-body text-text-muted mb-6">Get a quote for your old phone</p>

      <Card
        variant="hover"
        onClick={() => navigate('/recycle/appointment')}
        className="mb-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
            <ClipboardCheck className="text-primary-500" size={24} />
          </div>
          <div>
            <h3 className="text-h4 font-heading text-text-primary">New Recycling</h3>
            <p className="text-caption text-text-muted">Fill inspection form to get a quote</p>
          </div>
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-accent-50 rounded-xl flex items-center justify-center">
            <Search className="text-accent-500" size={24} />
          </div>
          <div>
            <h3 className="text-h4 font-heading text-text-primary">Check Report</h3>
            <p className="text-caption text-text-muted">Enter session ID to view your report</p>
          </div>
        </div>
        <Input
          placeholder="Session ID"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
        />
        <Button
          onClick={() => sessionId && navigate(`/recycle/report/${sessionId}`)}
          disabled={!sessionId}
          className="w-full"
        >
          View Report
        </Button>
      </Card>
    </div>
  );
}
