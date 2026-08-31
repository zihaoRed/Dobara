import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, ProgressBar } from '@dobara/ui';
import { CheckCircle, Loader, AlertTriangle, PackageCheck } from 'lucide-react';
import { markStepComplete } from '../lib/sessionProgress';

const packageItems = [
  { name: 'Photos (10/10)', type: 'Images' },
  { name: '360° video', type: 'Video' },
  { name: 'AI analysis results', type: 'Data' },
  { name: 'Appearance checklist', type: 'Data' },
  { name: 'Admission checks', type: 'Data' },
  { name: 'Hardware diagnostics', type: 'Data' },
  { name: 'Condition & accessories', type: 'Data' },
  { name: 'Invoice', type: 'Image (optional)' },
];

/** TAB-P0-03 — submit the collected inspection package to the server / pricing engine. */
export default function Submit() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!submitting || failed) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setSubmitting(false);
          return 100;
        }
        const next = prev + Math.random() * 18;
        const capped = Math.min(next, 100);
        const itemIndex = Math.floor(capped / (100 / packageItems.length));
        setCompletedItems(packageItems.slice(0, Math.min(itemIndex + 1, packageItems.length)).map((i) => i.name));
        return capped;
      });
    }, 350);
    return () => clearInterval(interval);
  }, [submitting, failed]);

  useEffect(() => {
    if (progress >= 100 && !failed) {
      markStepComplete(sessionId, 'submit');
      const timer = setTimeout(() => {
        markStepComplete(sessionId, 'report');
        navigate(`/session/${sessionId}/report`);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [progress, failed, sessionId, navigate]);

  const remaining = packageItems.length - completedItems.length;

  const retry = () => {
    setFailed(false);
    setProgress(0);
    setCompletedItems([]);
    setSubmitting(true);
  };

  return (
    <div className="p-6" data-testid="data-submit">
      <h1 className="text-h3 font-heading text-text-primary mb-2 flex items-center gap-2">
        <PackageCheck size={22} className="text-text-muted" /> Submit
      </h1>
      <p className="text-mono text-caption text-text-muted mb-1" data-testid="submit-session-id">
        session_id: {sessionId}
      </p>
      <p className="text-body text-text-body mb-6">
        Submitting inspection package… {remaining > 0 ? `${remaining} item(s) remaining` : 'finishing'}
      </p>

      {failed && (
        <div className="mb-4 rounded-lg bg-dobara-error-light text-dobara-error px-4 py-3 text-caption font-semibold flex items-center gap-2">
          <AlertTriangle size={16} /> Submit failed
          <Button size="sm" variant="danger" className="ml-auto" data-testid="submit-retry" onClick={retry}>
            Retry
          </Button>
        </div>
      )}

      <Card className="mb-6">
        <div className="mb-4">
          <ProgressBar value={progress} max={100} color={progress >= 100 ? 'success' : 'primary'} size="lg" showLabel />
        </div>
        <div className="space-y-2">
          {packageItems.map((item, idx) => {
            const isDone = completedItems.includes(item.name);
            const isCurrent = !isDone && completedItems.length === idx;
            return (
              <div
                key={item.name}
                className={`flex items-center gap-3 p-3 rounded-md ${
                  isDone ? 'bg-dobara-success-light' : isCurrent ? 'bg-primary-50' : 'bg-surface-high'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-caption font-semibold text-text-primary">{item.name}</div>
                  <div className="text-[11px] text-text-muted">{item.type}</div>
                </div>
                {isDone ? <CheckCircle size={18} className="text-dobara-success" /> : isCurrent ? <Loader size={18} className="text-primary-500 animate-spin" /> : null}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex justify-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          data-testid="sim-submit-fail"
          onClick={() => {
            setFailed(true);
            setSubmitting(false);
          }}
        >
          Simulate Failure
        </Button>
        {progress >= 100 && !failed && (
          <p className="text-body text-dobara-success font-semibold">Submit complete — opening report…</p>
        )}
      </div>
    </div>
  );
}
