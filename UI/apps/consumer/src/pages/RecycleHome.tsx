import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input } from '@dobara/ui';
import { ClipboardCheck, Search, Tag, ArrowLeftRight, Recycle, ChevronRight } from 'lucide-react';

export function RecycleHome() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState('');

  return (
    <div className="max-w-lg mx-auto px-4 py-5">
      <div className="rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white p-5 mb-5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_90%_10%,#C9A227,transparent_45%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Tag size={22} className="text-accent-100" />
            <h1 className="text-h3 font-bold">Sell Your Phone</h1>
          </div>
          <p className="text-sm text-white/80">
            Get an instant quote, book a store visit, and walk out with cash or store credit.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          type="button"
          onClick={() => navigate('/sell/appointment')}
          className="rounded-2xl bg-accent-500 text-white p-4 text-left shadow-card"
        >
          <ArrowLeftRight size={24} className="mb-2" />
          <p className="font-bold">Exchange</p>
          <p className="text-xs text-white/80 mt-0.5">Upgrade with bonus</p>
        </button>
        <button
          type="button"
          onClick={() => navigate('/sell/appointment')}
          className="rounded-2xl bg-primary-700 text-white p-4 text-left shadow-card"
        >
          <Recycle size={24} className="mb-2" />
          <p className="font-bold">Recycle</p>
          <p className="text-xs text-white/80 mt-0.5">Go green, get paid</p>
        </button>
      </div>

      <Card
        variant="hover"
        onClick={() => navigate('/sell/appointment')}
        className="mb-4 !rounded-xl"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
            <ClipboardCheck className="text-primary-500" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-body font-bold text-text-primary">New Appointment</h3>
            <p className="text-caption text-text-muted">Book inspection & get a quote</p>
          </div>
          <ChevronRight size={18} className="text-text-muted" />
        </div>
      </Card>

      <Card className="space-y-3 !rounded-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-accent-50 rounded-xl flex items-center justify-center">
            <Search className="text-accent-500" size={24} />
          </div>
          <div>
            <h3 className="text-body font-bold text-text-primary">Check Report</h3>
            <p className="text-caption text-text-muted">Enter session ID to view your report</p>
          </div>
        </div>
        <Input
          placeholder="Session ID"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
        />
        <Button
          pill
          onClick={() => sessionId && navigate(`/sell/report/${sessionId}`)}
          disabled={!sessionId}
          className="w-full"
        >
          View Report
        </Button>
      </Card>
    </div>
  );
}
