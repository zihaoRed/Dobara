import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card } from '@dobara/ui';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { markStepComplete } from '../lib/sessionProgress';

/** TAB-P0-08 entry — pre-photo recyclability gate (step 1, before any capture) */
export default function AppearanceDecision() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  return (
    <div className="p-6" data-testid="appearance-decision">
      <h1 className="text-h3 font-heading text-text-primary mb-2">Appearance Review</h1>
      <p className="text-body text-text-body mb-6">
        Before capturing photos, check the device by hand and eye. Only continue if it is
        clearly recyclable — obvious total-loss damage is rejected right here, before any
        capture effort is spent. Rejection is only available before hardware diagnostics start.
      </p>

      <Card className="mb-6 bg-primary-50 border border-primary-100">
        <div className="flex items-start gap-3">
          <Eye size={20} className="text-primary-600 shrink-0 mt-0.5" />
          <div className="text-caption text-primary-800">
            <p className="font-semibold mb-1">Look &amp; feel quick check</p>
            <p>
              Shattered screen · bent body · exposed / burnt motherboard · heavy water
              corrosion · missing core parts — any of these means reject now.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
        <button
          type="button"
          data-testid="continue-inspect"
          onClick={() => {
            markStepComplete(sessionId, 'decision');
            navigate(`/session/${sessionId}/photo`);
          }}
          className="rounded-2xl bg-dobara-success text-white p-6 text-left shadow-card hover:opacity-95 transition-opacity"
        >
          <CheckCircle size={32} className="mb-3" />
          <p className="text-h4 font-bold">Continue to Photos</p>
          <p className="text-caption text-white/85 mt-1">
            Recyclable — proceed to 10-angle photos, then video, admission checks & hardware audit
          </p>
        </button>

        <button
          type="button"
          data-testid="go-reject"
          onClick={() => navigate(`/session/${sessionId}/reject`)}
          className="rounded-2xl bg-surface-container border-2 border-dobara-error/40 text-left p-6 shadow-card hover:bg-dobara-error-light transition-colors"
        >
          <XCircle size={32} className="mb-3 text-dobara-error" />
          <p className="text-h4 font-bold text-dobara-error">Reject Device</p>
          <p className="text-caption text-text-secondary mt-1">
            Not recyclable (shattered screen, bent body, severe water damage…)
          </p>
        </button>
      </div>

      <div className="flex justify-center mt-6">
        <Button variant="ghost" onClick={() => navigate(`/session/${sessionId}`)}>
          Back to Session
        </Button>
      </div>
    </div>
  );
}
