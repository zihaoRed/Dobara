import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Modal, Tabs } from '@dobara/ui';
import { HelpCircle } from 'lucide-react';
import { PHOTO_ANGLES } from '@dobara/utils';
import { APPEARANCE_DIMENSIONS, ALL_APPEARANCE_ITEMS } from '../lib/appearanceItems';
import { markStepComplete } from '../lib/sessionProgress';

/** TAB-P0-13 MVP — optional checklist; skip = system auto-inspect */
export default function AppearanceInspect() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [dim, setDim] = useState(APPEARANCE_DIMENSIONS[0].key);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [helpCode, setHelpCode] = useState<string | null>(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const dimension = APPEARANCE_DIMENSIONS.find((d) => d.key === dim) || APPEARANCE_DIMENSIONS[0];
  const helpItem = ALL_APPEARANCE_ITEMS.find((i) => i.code === helpCode);

  const hasRejectFlag = ALL_APPEARANCE_ITEMS.some((i) => {
    const optIdx = answers[i.code];
    return optIdx != null && i.options[optIdx]?.reject;
  });

  const answeredCount = Object.keys(answers).length;

  const answeredInDim = (key: string) => {
    const d = APPEARANCE_DIMENSIONS.find((x) => x.key === key);
    if (!d) return 0;
    return d.items.filter((i) => answers[i.code] != null).length;
  };

  const proceedToHardware = async () => {
    setSubmitting(true);
    // Unselected items → system auto-inspect (default to first / "None·Normal" grade)
    const resolved: Record<string, number> = {};
    for (const item of ALL_APPEARANCE_ITEMS) {
      resolved[item.code] = answers[item.code] ?? 0;
    }
    try {
      sessionStorage.setItem(
        `dobara_inspect_${sessionId}`,
        JSON.stringify({ answers: resolved, autoFilled: answeredCount < ALL_APPEARANCE_ITEMS.length }),
      );
    } catch { /* ignore */ }
    markStepComplete(sessionId, 'inspect');
    navigate(`/session/${sessionId}/hardware`);
  };

  return (
    <div className="p-6 pb-28" data-testid="appearance-inspect">
      <div className="mb-4">
        <h1 className="text-h3 font-heading text-text-primary">Appearance Checklist</h1>
        <p className="text-caption text-text-muted mt-1">
          Optional notes for the clerk. Leave blank and continue — the system will run appearance QC automatically.
        </p>
      </div>

      <div className="grid grid-cols-[220px_1fr] gap-4 mb-4">
        <Card className="p-3">
          <p className="text-eyebrow text-text-muted mb-2">Reference angle</p>
          <div className="aspect-[3/4] rounded-lg bg-surface-high flex flex-col items-center justify-center border border-dashed border-border">
            <span className="text-caption font-semibold text-text-primary text-center px-2">
              {PHOTO_ANGLES[photoIdx]}
            </span>
            <span className="text-eyebrow text-text-muted mt-1">Photo {photoIdx + 1}/10</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {PHOTO_ANGLES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPhotoIdx(i)}
                className={`w-7 h-7 rounded text-[10px] font-bold ${
                  photoIdx === i ? 'bg-primary-500 text-white' : 'bg-surface-high text-text-muted'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </Card>

        <div>
          <Tabs
            tabs={APPEARANCE_DIMENSIONS.map((d) => ({
              key: d.key,
              label: `${d.label} (${answeredInDim(d.key)}/${d.items.length})`,
            }))}
            activeTab={dim}
            onChange={setDim}
            className="mb-3"
          />

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {dimension.items.map((item) => (
              <Card key={item.code} variant="flat" className="p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <button
                    type="button"
                    className="text-left"
                    onClick={() => setPhotoIdx(item.photoIndex)}
                  >
                    <p className="text-caption font-semibold text-text-primary">
                      {item.code} · {item.name}
                      <span className="ml-2 text-eyebrow text-text-muted font-normal">optional</span>
                    </p>
                  </button>
                  <button
                    type="button"
                    className="p-1 text-text-muted hover:text-primary-600"
                    onClick={() => setHelpCode(item.code)}
                    aria-label={`Help ${item.code}`}
                  >
                    <HelpCircle size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.options.map((opt, oi) => (
                    <button
                      key={opt.label}
                      type="button"
                      data-testid={`inspect-${item.code}-${oi}`}
                      onClick={() => {
                        setAnswers((prev) => {
                          const next = { ...prev };
                          // Toggle off if same option clicked again
                          if (next[item.code] === oi) delete next[item.code];
                          else next[item.code] = oi;
                          return next;
                        });
                        setPhotoIdx(item.photoIndex);
                      }}
                      className={`px-2.5 py-1.5 rounded-md text-caption border transition-colors ${
                        answers[item.code] === oi
                          ? opt.reject
                            ? 'border-dobara-error bg-dobara-error-light text-dobara-error'
                            : 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-border text-text-secondary hover:bg-surface-high'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {hasRejectFlag && (
        <div className="mb-4 rounded-lg bg-dobara-error-light text-dobara-error px-4 py-3 text-caption font-semibold">
          A selected grade triggers rejection. Go back to Appearance Review and reject this device.
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 px-3 pb-3 z-20 pointer-events-none">
        <div className="max-w-[1024px] mx-auto pointer-events-auto">
          <div className="rounded-2xl border border-border bg-white/95 backdrop-blur p-3 shadow-card flex items-center justify-between gap-3">
            <p className="text-caption text-text-muted">
              {answeredCount === 0
                ? 'No items selected — continue to run system appearance QC'
                : `${answeredCount}/${ALL_APPEARANCE_ITEMS.length} marked · rest will auto-QC`}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => navigate(`/session/${sessionId}/decision`)}>
                Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                loading={submitting}
                disabled={hasRejectFlag}
                data-testid="confirm-inspect"
                onClick={proceedToHardware}
              >
                {answeredCount === 0 ? 'Continue · Auto QC' : 'Continue to Hardware'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Modal open={!!helpCode} onClose={() => setHelpCode(null)} title={helpItem ? `${helpItem.code} · ${helpItem.name}` : 'Help'} size="sm">
        <p className="text-body text-text-secondary mb-3">
          Optional. Pick the condition that matches the photo, or leave blank for system auto-QC.
        </p>
        <ul className="space-y-1 text-caption text-text-muted">
          {helpItem?.options.map((o) => (
            <li key={o.label}>
              · {o.label}
              {o.reject ? ' — may require rejection' : ''}
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}
