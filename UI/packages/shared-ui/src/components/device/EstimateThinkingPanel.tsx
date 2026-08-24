import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';

export interface IEstimateDeduction {
  label: string;
  detail?: string;
  /** Positive value = deduction (₹). */
  amount: number;
}

interface EstimateThinkingPanelProps {
  deviceLabel: string;
  estimate: number;
  running?: boolean;
  durationMs?: number;
  onComplete?: () => void;
  /** Condition deductions (battery / body / screen / repairs …). */
  deductions?: IEstimateDeduction[];
  /** Appearance-wear descriptors (e.g. "Minor scratches", "Perfect"). */
  appearance?: string[];
  /** Static breakdown for the report instead of the animated "thinking" panel. */
  compact?: boolean;
}

function inr(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export const EstimateThinkingPanel: React.FC<EstimateThinkingPanelProps> = ({
  deviceLabel,
  estimate,
  running = false,
  durationMs = 5000,
  onComplete,
  deductions = [],
  appearance = [],
  compact = false,
}) => {
  const [now, setNow] = useState(running ? 0 : durationMs);
  const [done, setDone] = useState(!running);
  const onCompleteRef = useRef(onComplete);
  const finishedRef = useRef(false);
  onCompleteRef.current = onComplete;

  const emitComplete = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onCompleteRef.current?.();
  };

  useEffect(() => {
    if (!running) {
      setDone(true);
      setNow(durationMs);
      return;
    }
    finishedRef.current = false;
    setDone(false);
    setNow(0);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDone(true);
      setNow(durationMs);
      emitComplete();
      return;
    }
    const started = performance.now();
    let raf = 0;
    const tick = (ts: number) => {
      const elapsed = ts - started;
      if (elapsed >= durationMs) {
        setDone(true);
        setNow(durationMs);
        emitComplete();
        return;
      }
      setNow(elapsed);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, durationMs]);

  const progress = Math.min(1, now / durationMs);
  const n = deductions.length;
  const show = {
    thought1: progress >= 0,
    appearance: progress >= 0.22,
    thought2: progress >= 0.3,
    thought3: progress >= 0.48,
    lock: progress >= 0.9,
  };
  const revealedDeductions =
    deductions.filter((_, i) => progress >= 0.5 + (i * 0.34) / Math.max(1, n)) ?? [];

  const thoughts: { id: string; text: string }[] = [];
  if (show.thought1) thoughts.push({ id: 't1', text: `Reading inspection data for ${deviceLabel}…` });
  if (show.thought2) thoughts.push({ id: 't2', text: 'Checking battery, screen and body wear…' });
  if (show.thought3) thoughts.push({ id: 't3', text: 'Applying condition deductions…' });

  if (compact) {
    return (
      <div data-testid="estimate-breakdown">
        <p className="text-eyebrow text-text-muted mb-2">How your price was calculated</p>
        {deductions.length > 0 ? (
          <div className="space-y-0.5">
            {deductions.map((d) => (
              <div
                key={d.label + (d.detail ?? '')}
                className="flex items-center justify-between gap-3 py-1.5 border-b border-border/50 last:border-0 text-body"
              >
                <div className="min-w-0">
                  <span className="font-medium">{d.label}</span>
                  {d.detail && <span className="text-caption text-text-muted ml-1.5">· {d.detail}</span>}
                </div>
                <span className="font-mono font-semibold text-dobara-error shrink-0">−{inr(d.amount)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-caption text-text-muted">Final price confirmed after in-store inspection.</p>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl text-white"
      style={{ background: '#0c1613' }}
      data-testid="estimate-thinking-panel"
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #c9a227, transparent)' }}
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="dobara-radar-sweep absolute inset-x-0 h-24"
          style={{ background: 'linear-gradient(180deg, transparent, rgba(201,162,39,0.12), transparent)' }}
        />
      </div>

      <div className="relative p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="dobara-pulse-dot absolute inline-flex h-full w-full rounded-full bg-accent-500" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-500" />
            </span>
            <p className="text-eyebrow tracking-[0.14em] text-[#d7c48a]">Analysing your device</p>
          </div>
          <p className="text-mono text-[11px] text-white/45">{done ? 'Offer ready' : 'Thinking…'}</p>
        </div>

        <div className="h-[3px] rounded-full bg-white/10 overflow-hidden mb-4">
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress * 100}%`,
              background: 'linear-gradient(90deg, #3fa37b, #c9a227)',
              transition: 'width 80ms linear',
            }}
          />
        </div>

        <div className="space-y-2 mb-4 min-h-[88px]">
          {thoughts.map((th, i) => {
            const latest = i === thoughts.length - 1 && !done;
            return (
              <div key={th.id} className="dobara-thought-in flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 bg-accent-500/80" />
                <p className="text-caption text-white/80 leading-relaxed">
                  {th.text}
                  {latest && <span className="dobara-cursor ml-0.5 inline-block w-[7px] h-[12px] align-[-1px] bg-[#c9a227]" />}
                </p>
              </div>
            );
          })}
          {show.appearance && appearance.length > 0 && (
            <div className="dobara-thought-in flex flex-wrap gap-1.5 pt-1">
              {appearance.map((a) => (
                <span
                  key={a}
                  className="text-[11px] text-white/70 bg-white/[0.06] border border-white/10 rounded-full px-2 py-0.5"
                >
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-0.5 min-h-[64px]">
          {revealedDeductions.map((d) => (
            <div
              key={d.label + (d.detail ?? '')}
              data-testid={`deduction-${d.label}`}
              className="dobara-source-in flex items-center justify-between gap-3 py-2 border-b border-white/5"
            >
              <div className="min-w-0">
                <span className="text-caption font-medium text-white/85">{d.label}</span>
                {d.detail && <span className="text-[11px] text-white/45 ml-1.5">· {d.detail}</span>}
              </div>
              <span className="text-caption font-mono font-semibold text-[#f0b7a4] shrink-0">
                −{inr(d.amount)}
              </span>
            </div>
          ))}
        </div>

        {show.lock && (
          <div
            className="dobara-source-in mt-4 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
            style={{ background: 'rgba(201,162,39,0.12)', border: '1px solid rgba(201,162,39,0.28)' }}
            data-testid="estimate-thinking-lock"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-accent-500" />
              <div>
                <p className="text-[11px] uppercase tracking-wide text-[#d7c48a]">Your offer</p>
                <p className="text-[11px] text-white/55">Condition-adjusted recycle price</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-[#9fd4b8]" />
              <p className="text-h3 font-heading text-white">{inr(estimate)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
