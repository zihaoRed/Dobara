import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge } from '@dobara/ui';
import { MapPin, Phone, Clock, CheckCircle } from 'lucide-react';

export function AppointmentSuccess() {
  const navigate = useNavigate();
  // Generate a demo appointment code
  const appointmentCode = `DOB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <Card className="text-center py-8">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-dobara-success-light rounded-full flex items-center justify-center">
            <CheckCircle size={48} className="text-dobara-success" />
          </div>
        </div>
        <h1 className="text-h2 font-heading mb-2">Appointment Booked!</h1>
        <p className="text-body text-text-secondary mb-4">
          Show this code at the store for your inspection.
        </p>
        <div className="bg-surface-low rounded-lg p-4 mb-6">
          <p className="text-caption text-text-muted mb-1">Appointment Code</p>
          <p className="text-h3 font-mono font-bold text-primary-500">{appointmentCode}</p>
        </div>
      </Card>

      <Card>
        <h3 className="text-h4 font-heading mb-3">Store Information</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <MapPin size={20} className="text-text-muted shrink-0 mt-0.5" />
            <div>
              <p className="text-body font-semibold text-text-primary">MobileXchange Andheri</p>
              <p className="text-caption text-text-muted">Andheri West, Mumbai 400058</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone size={20} className="text-text-muted shrink-0 mt-0.5" />
            <div>
              <p className="text-caption text-text-muted">Contact</p>
              <p className="text-body text-text-primary">+91-9876543201</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock size={20} className="text-text-muted shrink-0 mt-0.5" />
            <div>
              <p className="text-caption text-text-muted">Hours</p>
              <p className="text-body text-text-primary">Mon – Sat, 10:00 AM – 8:00 PM</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-h4 font-heading mb-3">What to Bring</h3>
        <ul className="space-y-2 text-body text-text-secondary">
          <li className="flex items-start gap-2">
            <span className="text-dobara-success mt-1">•</span>
            Your phone (fully charged)
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

      <Button variant="primary" size="lg" className="w-full" onClick={() => navigate('/home')}>
        Back to Marketplace
      </Button>
    </div>
  );
}
