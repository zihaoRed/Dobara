import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Modal, Tabs } from '@dobara/ui';
import { HelpCircle, Sparkles } from 'lucide-react';
import { PHOTO_ANGLES } from '@dobara/utils';
import { APPEARANCE_DIMENSIONS, ALL_APPEARANCE_ITEMS } from '../lib/appearanceItems';
import { mockAiAppearanceAnalysis, type TAiAppearanceResult } from '../lib/aiAnalysis';
import { markStepComplete } from '../lib/sessionProgress';

/** TAB-P0-13 — AI "Thinking" pre-fills the checklist from photos; clerk reviews & corrects. */
export default function AppearanceInspect() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [dim, setDim] = useState(APPEARANCE_DIMENSIONS[0].key);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [aiAnswers, setAiAnswers] = useState<Record<string, number>>({});
  const [thinking, setThinking] = useState(true);
  const [thinkingProgress, setThinkingProgress] = useState(0);
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

  // AI "Thinking" phase — upload photos to the server, recognise condition, pre-fill checklist.
  useEffect(() => {
    let cancelled = false;
    const started = Date.now();
    const DURATION = 2400;
    const iv = setInterval(() => {
      setThinkingProgress(Math.min(100, ((Date.now() - started) / DURATION) * 100));
    }, 80);
    mockAiAppearanceAnalysis(sessionId).then((results: TAiAppearanceResult) => {
      if (cancelled) return;
      clearInterval(iv);
      setAiAnswers(results);
      setAnswers(results);
      setThinkingProgress(100);
      setTimeout(() => setThinking(false), 250);
    });
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [sessionId]);

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
        JSON.stringify({ answers: resolved, aiAnswers, autoFilled: answeredCount < ALL_APPEARANCE_ITEMS.length }),
      );
    } catch { /* ignore */ }
    markStepComplete(sessionId, 'inspect');
    navigate(`/session/${sessionId}/hardware`);
  };

  if (thinking) {
    const status =
      thinkingProgress < 25
        ? 'Uploading photos…'
        : thinkingProgress < 55
        ? 'Detecting screen & glass…'
        : thinkingProgress < 80
        ? 'Detecting body, back & ports…'
        : 'Filling the checklist…';
    return (
      <div className="flex flex-col justify-center items-center p-6 min-h-full" data-testid="inspect-thinking">
        <div
          className="relative overflow-hidden rounded-2xl text-white w-full max-w-md"
          style={{ background: '#0c1613' }}
        >
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, #c9a227, transparent)' }}
          />
          <div className="p-8 text-center">
            <span className="relative flex h-3 w-3 mx-auto mb-4">
              <span className="dobara-pulse-dot absolute inline-flex h-full w-full rounded-full bg-accent-500" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-accent-500" />
            </span>
            <p className="text-eyebrow tracking-[0.14em] text-[#d7c48a] mb-2">Thinking</p>
            <p className="text-body text-white/85">AI is analysing your photos</p>
            <p className="text-caption text-white/45 mt-1">{status}</p>
            <div className="h-[3px] rounded-full bg-white/10 overflow-hidden mt-6">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${thinkingProgress}%`,
                  background: 'linear-gradient(90deg, #3fa37b, #c9a227)',
                  transition: 'width 80ms linear',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full" data-testid="appearance-inspect">
      <div className="flex-1 p-4 sm:p-6 pb-4">
        <div className="mb-4">
          <h1 className="text-h3 font-heading text-text-primary">Appearance Checklist</h1>
          <p className="text-caption text-text-muted mt-1">
            AI pre-filled the checklist from your photos. Review and correct any item before continuing.
          </p>
        </div>

        <div className="mb-4 rounded-lg bg-dobara-info-light text-[#1e3a8a] px-4 py-3 text-caption font-medium flex items-center gap-2">
          <Sparkles size={16} className="shrink-0" />
          <span>
            AI detected {Object.values(aiAnswers).filter((v) => v !== 0).length} wear item(s) and pre-filled all
            {ALL_APPEARANCE_ITEMS.length} checks. Items marked <b>AI</b> are suggestions — tap to correct.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] lg:grid-cols-[220px_1fr] gap-4 mb-4">
          <Card className="p-3 md:sticky md:top-0 self-start">
            <p className="text-eyebrow text-text-muted mb-2">Reference angle</p>
            <div className="aspect-[3/4] max-h-[220px] md:max-h-[280px] mx-auto w-full rounded-lg bg-surface-high flex flex-col items-center justify-center border border-dashed border-border">
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

          <div className="min-w-0">
            <Tabs
              tabs={APPEARANCE_DIMENSIONS.map((d) => ({
                key: d.key,
                label: `${d.label} (${answeredInDim(d.key)}/${d.items.length})`,
              }))}
              activeTab={dim}
              onChange={setDim}
              className="mb-3"
            />

            <div className="space-y-3 max-h-[min(420px,calc(100dvh-280px))] overflow-y-auto pr-1">
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
                        {aiAnswers[item.code] != null && (
                          <span className="ml-2 text-eyebrow font-normal text-accent-600">AI-suggested</span>
                        )}
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
                        {aiAnswers[item.code] === oi && (
                          <span className="ml-1 text-[9px] font-bold uppercase text-accent-600">AI</span>
                        )}
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
      </div>

      <div className="sticky bottom-0 z-20 px-3 pb-3 pt-1 bg-gradient-to-t from-surface via-surface to-transparent">
        <div className="rounded-2xl border border-border bg-white/95 backdrop-blur p-3 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-caption text-text-muted">
            {answeredCount === 0
              ? 'No items selected — continue to run system appearance QC'
              : `${answeredCount}/${ALL_APPEARANCE_ITEMS.length} marked · rest will auto-QC`}
          </p>
          <div className="flex gap-2 shrink-0">
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
