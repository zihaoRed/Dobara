import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card } from '@dobara/ui';
import { CheckCircle, XCircle } from 'lucide-react';
import { markStepComplete } from '../lib/sessionProgress';

/** TAB-P0-08 entry — continue inspection or reject after appearance capture */
export default function AppearanceDecision() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionId) markStepComplete(sessionId, 'video');
  }, [sessionId]);

  return (
    <div className="p-6" data-testid="appearance-decision">
      <h1 className="text-h3 font-heading text-text-primary mb-2">Appearance Review</h1>
      <p className="text-body text-text-body mb-6">
        Photos and video are complete. Confirm the device looks recyclable, or reject it now.
        Rejection is only available before hardware diagnostics start.
      </p>

      <Card className="mb-6 bg-primary-50 border border-primary-100">
        <p className="text-caption text-primary-800">
          ✓ 10 angle photos captured · ✓ 360° video recorded
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
        <button
          type="button"
          data-testid="continue-inspect"
          onClick={() => {
            markStepComplete(sessionId, 'decision');
            navigate(`/session/${sessionId}/inspect`);
          }}
          className="rounded-2xl bg-dobara-success text-white p-6 text-left shadow-card hover:opacity-95 transition-opacity"
        >
          <CheckCircle size={32} className="mb-3" />
          <p className="text-h4 font-bold">Continue Inspection</p>
          <p className="text-caption text-white/85 mt-1">
            Appearance OK — proceed to defect checklist, then hardware audit
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
        <Button variant="ghost" onClick={() => navigate(`/session/${sessionId}/video`)}>
          Back to Video
        </Button>
      </div>
    </div>
  );
}
