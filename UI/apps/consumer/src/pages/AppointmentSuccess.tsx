import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Button } from '@dobara/ui';
import { MapPin, Phone, Clock, CheckCircle, Info, Smartphone } from 'lucide-react';
import { getUser } from '../App';
import { maskPhone } from '@dobara/utils';

interface AppointmentState {
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  date?: string;
  slot?: string;
  brand?: string;
  model?: string;
  estimatePrice?: number;
  sessionId?: string;
}

export function AppointmentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as AppointmentState;
  const user = getUser();
  const phone = user?.phone || '';
  const phoneDisplay = phone ? maskPhone(phone) : '';

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-8" data-testid="appointment-success">
      <Card className="text-center py-8">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-dobara-success-light rounded-full flex items-center justify-center">
            <CheckCircle size={48} className="text-dobara-success" />
          </div>
        </div>
        <h1 className="text-h2 font-heading mb-2">Appointment Booked!</h1>
        <p className="text-body text-text-secondary mb-4">
          No appointment code needed. At the store, just tell the staff your phone number for OTP verification.
        </p>
        {state.sessionId && (
          <p className="text-mono text-caption text-text-muted mb-3" data-testid="appointment-session-id">
            Session {state.sessionId}
          </p>
        )}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 text-left">
          <p className="text-caption text-primary-700 font-semibold mb-1 flex items-center gap-1">
            <Phone size={14} /> Check-in with phone number
          </p>
          <p className="text-h4 font-mono font-bold text-primary-600" data-testid="checkin-phone">
            {phone ? phoneDisplay : 'your registered mobile number'}
          </p>
          <p className="text-eyebrow text-text-muted mt-2">
            Staff will send an OTP to this number to match your booking.
          </p>
        </div>
      </Card>

      <div className="flex items-start gap-2 p-3 bg-dobara-info-light rounded-lg">
        <Info size={16} className="text-dobara-info shrink-0 mt-0.5" />
        <p className="text-caption text-[#1e3a8a]">
          Walk-ins without a booking are also welcome — everyone checks in with phone + OTP.
        </p>
      </div>

      {state.estimatePrice != null && (
        <Card>
          <h3 className="text-h4 font-heading mb-2">Estimated offer</h3>
          <p className="text-h3 font-bold text-primary-600" data-testid="success-estimate-price">
            ₹{state.estimatePrice.toLocaleString('en-IN')}
          </p>
          <p className="text-caption text-text-muted mt-1">
            Final recycle price is confirmed after in-store inspection.
          </p>
        </Card>
      )}

      {(state.brand || state.model) && (
        <Card>
          <h3 className="text-h4 font-heading mb-2 flex items-center gap-2">
            <Smartphone size={18} /> Device
          </h3>
          <p className="text-body text-text-primary">
            {[state.brand, state.model].filter(Boolean).join(' ')}
          </p>
        </Card>
      )}

      <Card>
        <h3 className="text-h4 font-heading mb-3">Store & visit time</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <MapPin size={20} className="text-text-muted shrink-0 mt-0.5" />
            <div>
              <p className="text-body font-semibold text-text-primary">
                {state.storeName || 'MobileXchange Andheri'}
              </p>
              <p className="text-caption text-text-muted">
                {state.storeAddress || 'Andheri West, Mumbai 400058'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone size={20} className="text-text-muted shrink-0 mt-0.5" />
            <div>
              <p className="text-caption text-text-muted">Store contact</p>
              <p className="text-body text-text-primary">{state.storePhone || '+91-9876543201'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock size={20} className="text-text-muted shrink-0 mt-0.5" />
            <div>
              <p className="text-caption text-text-muted">Your slot</p>
              <p className="text-body text-text-primary" data-testid="appointment-slot">
                {state.date && state.slot
                  ? `${state.date} · ${state.slot}`
                  : 'As selected during booking'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-h4 font-heading mb-3">What to bring</h3>
        <ul className="space-y-2 text-body text-text-secondary">
          <li className="flex items-start gap-2">
            <span className="text-dobara-success mt-1">•</span>
            Your phone (fully charged) — tell staff your phone number
          </li>
          <li className="flex items-start gap-2">
            <span className="text-dobara-success mt-1">•</span>
            Original charger and accessories (if available)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-dobara-success mt-1">•</span>
            Valid government ID (Aadhaar / PAN / Driving License)
          </li>
        </ul>
      </Card>

      <Button variant="primary" size="lg" className="w-full" onClick={() => navigate('/home')} data-testid="appointment-success-home">
        Back to Home
      </Button>
    </div>
  );
}
