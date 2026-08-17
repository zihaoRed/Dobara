import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, Globe, Radio } from 'lucide-react';
import { Modal } from '../ui/Modal';
import {
  MARKET_SOURCES,
  quotesForEstimate,
  type IMarketSource,
  type TMarketSourceId,
} from './marketSources';

type TThought = { id: string; text: string };

interface EstimateSearchPanelProps {
  deviceLabel: string;
  estimate: number;
  running: boolean;
  durationMs?: number;
  onComplete?: () => void;
  compact?: boolean;
}

function inr(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

function SourceMark({ source, size = 32 }: { source: IMarketSource; size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-lg font-heading font-bold text-white shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size > 36 ? 14 : 11,
        background: source.accent,
        letterSpacing: source.id === 'cex' ? '-0.04em' : '0',
      }}
    >
      {source.mark}
    </span>
  );
}

function SourceDetail({
  source,
  quote,
  deviceLabel,
  onClose,
}: {
  source: IMarketSource;
  quote: number;
  deviceLabel: string;
  onClose: () => void;
}) {
  return (
    <Modal open onClose={onClose} title={source.name} size="md">
      <div className="space-y-4" data-testid={`source-detail-${source.id}`}>
        <div className="flex items-start gap-3">
          <SourceMark source={source} size={44} />
          <div className="min-w-0">
            <p className="text-body font-semibold text-text-primary">{source.tagline}</p>
            <p className="text-mono text-caption text-text-muted">{source.domain}</p>
          </div>
        </div>

        <div
          className="rounded-xl px-4 py-3"
          style={{ background: source.accentSoft, border: `1px solid ${source.accent}33` }}
        >
          <p className="text-eyebrow text-text-muted">{source.quoteRole}</p>
          <p className="text-h3 font-heading mt-1" style={{ color: source.accent }}>
            {inr(quote)}
          </p>
          <p className="text-caption text-text-secondary mt-1">{source.snippet(deviceLabel, quote)}</p>
        </div>

        <p className="text-body text-text-secondary">{source.about}</p>

        <dl className="grid grid-cols-1 gap-2 text-caption">
          <div className="flex justify-between gap-3 border-b border-border pb-2">
            <dt className="text-text-muted">Coverage</dt>
            <dd className="text-right font-medium">{source.coverage}</dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-border pb-2">
            <dt className="text-text-muted">Freshness</dt>
            <dd className="text-right font-medium">{source.freshness}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-text-muted">What we read</dt>
            <dd className="text-right font-medium">{source.method}</dd>
          </div>
        </dl>

        <p className="text-eyebrow text-text-muted">
          Demo snapshot for this prototype — not a live crawl. Final store price still comes from inspection.
        </p>

        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-caption font-semibold text-primary-600"
        >
          Open {source.domain} <ExternalLink size={14} />
        </a>
      </div>
    </Modal>
  );
}

export const EstimateSearchPanel: React.FC<EstimateSearchPanelProps> = ({
  deviceLabel,
  estimate,
  running,
  durationMs = 5000,
  onComplete,
  compact = false,
}) => {
  const quotes = useMemo(() => quotesForEstimate(estimate), [estimate]);
  const [now, setNow] = useState(running ? 0 : durationMs);
  const [openId, setOpenId] = useState<TMarketSourceId | null>(null);
  const [done, setDone] = useState(!running);
  const onCompleteRef = useRef(onComplete);
  const finishedRef = useRef(false);
  const openIdRef = useRef<TMarketSourceId | null>(null);
  const pendingCompleteRef = useRef(false);
  onCompleteRef.current = onComplete;
  openIdRef.current = openId;

  const emitComplete = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    pendingCompleteRef.current = false;
    onCompleteRef.current?.();
  };

  const timeline = useMemo(() => {
    const t = durationMs;
    return {
      thought1: 0,
      queryCashify: Math.round(t * 0.1),
      sourceCashify: Math.round(t * 0.18),
      thought2: Math.round(t * 0.32),
      queryCex: Math.round(t * 0.38),
      sourceCex: Math.round(t * 0.46),
      queryFlipkart: Math.round(t * 0.58),
      sourceFlipkart: Math.round(t * 0.66),
      thought3: Math.round(t * 0.78),
      lock: Math.round(t * 0.9),
      finish: t,
    };
  }, [durationMs]);

  useEffect(() => {
    if (!running) {
      setDone(true);
      setNow(durationMs);
      return;
    }
    finishedRef.current = false;
    pendingCompleteRef.current = false;
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
        if (openIdRef.current) {
          pendingCompleteRef.current = true;
        } else {
          emitComplete();
        }
        return;
      }
      setNow(elapsed);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, durationMs]);

  useEffect(() => {
    if (!openId && pendingCompleteRef.current) emitComplete();
  }, [openId]);

  const show = {
    thought1: now >= timeline.thought1,
    queryCashify: now >= timeline.queryCashify,
    cashify: now >= timeline.sourceCashify,
    thought2: now >= timeline.thought2,
    queryCex: now >= timeline.queryCex,
    cex: now >= timeline.sourceCex,
    queryFlipkart: now >= timeline.queryFlipkart,
    flipkart: now >= timeline.sourceFlipkart,
    thought3: now >= timeline.thought3,
    lock: now >= timeline.lock,
  };

  const revealed = MARKET_SOURCES.filter((s) => show[s.id]);
  const openSource = MARKET_SOURCES.find((s) => s.id === openId) || null;
  const progress = Math.min(100, (now / durationMs) * 100);

  const thoughts: TThought[] = [];
  if (show.thought1) {
    thoughts.push({ id: 't1', text: `Scanning buyback boards for ${deviceLabel}…` });
  }
  if (show.thought2) {
    thoughts.push({ id: 't2', text: 'Reading Cashify sell-now, CeX WeBuy and Flipkart exchange tiles.' });
  }
  if (show.thought3) {
    thoughts.push({
      id: 't3',
      text: 'Weighting the three quotes, then applying your reported battery / body / screen.',
    });
  }

  const queries: { id: TMarketSourceId; at: boolean }[] = [
    { id: 'cashify', at: show.queryCashify },
    { id: 'cex', at: show.queryCex },
    { id: 'flipkart', at: show.queryFlipkart },
  ];
  const activeQuery = [...queries].reverse().find((q) => q.at);
  const activeSource = activeQuery ? MARKET_SOURCES.find((s) => s.id === activeQuery.id) : null;

  if (compact) {
    return (
      <div data-testid="estimate-sources-compact">
        <p className="text-eyebrow text-text-muted mb-2">Base price sources</p>
        <div className="flex flex-wrap gap-2">
          {MARKET_SOURCES.map((s) => (
            <button
              key={s.id}
              type="button"
              data-testid={`source-chip-${s.id}`}
              onClick={() => setOpenId(s.id)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-container px-2.5 py-1.5 hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <SourceMark source={s} size={22} />
              <span className="text-caption font-semibold">{s.name}</span>
              <span className="text-mono text-[11px] text-text-muted">{inr(quotes[s.id])}</span>
            </button>
          ))}
        </div>
        {openSource && (
          <SourceDetail
            source={openSource}
            quote={quotes[openSource.id]}
            deviceLabel={deviceLabel}
            onClose={() => setOpenId(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl text-white"
      style={{ background: '#0c1613' }}
      data-testid="estimate-search-panel"
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #c9a227, transparent)' }}
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="dobara-radar-sweep absolute inset-x-0 h-24"
          style={{
            background: 'linear-gradient(180deg, transparent, rgba(201,162,39,0.12), transparent)',
          }}
        />
      </div>

      <div className="relative p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="dobara-pulse-dot absolute inline-flex h-full w-full rounded-full bg-accent-500" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-500" />
            </span>
            <p className="text-eyebrow tracking-[0.14em] text-[#d7c48a]">Market radar</p>
          </div>
          <p className="text-mono text-[11px] text-white/45">
            {done ? '3 sources · locked' : `${revealed.length}/3 sources`}
          </p>
        </div>

        <div className="h-[3px] rounded-full bg-white/10 overflow-hidden mb-4">
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
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
          {activeSource && !done && (
            <div className="dobara-thought-in ml-4 flex items-center gap-2 text-[11px] font-mono text-[#9fd4b8]">
              <Globe size={12} />
              <span className="truncate">{activeSource.query(deviceLabel)}</span>
            </div>
          )}
        </div>

        <div className="space-y-2 min-h-[168px]">
          {MARKET_SOURCES.filter((s) => show[s.id]).map((s) => (
            <button
              key={s.id}
              type="button"
              data-testid={`source-card-${s.id}`}
              onClick={() => setOpenId(s.id)}
              className="dobara-source-in w-full text-left rounded-xl border border-white/10 bg-white/[0.05] p-3 hover:bg-white/[0.08] hover:border-white/20"
            >
              <div className="flex items-center gap-3">
                <SourceMark source={s} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-caption font-semibold">{s.name}</span>
                    <span className="text-[10px] font-mono text-white/40">{s.domain}</span>
                  </div>
                  <p className="text-[11px] text-white/55 truncate mt-0.5">{s.snippet(deviceLabel, quotes[s.id])}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] uppercase tracking-wide text-white/35">{s.quoteRole}</p>
                  <p className="text-body font-heading font-bold" style={{ color: s.accent }}>
                    {inr(quotes[s.id])}
                  </p>
                </div>
              </div>
            </button>
          ))}
          {activeSource && !show[activeSource.id] && (
            <div
              className="h-[72px] rounded-xl border border-white/10 bg-white/[0.04] overflow-hidden flex items-center px-3 gap-3"
              data-testid={`source-searching-${activeSource.id}`}
            >
              <SourceMark source={activeSource} />
              <div className="flex-1 min-w-0">
                <p className="text-caption text-white/70">Searching {activeSource.name}…</p>
                <div className="mt-2 h-1.5 rounded-full overflow-hidden bg-white/10">
                  <div className="h-full dobara-shimmer rounded-full" />
                </div>
              </div>
            </div>
          )}
        </div>

        {show.lock && (
          <div
            className="dobara-source-in mt-4 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
            style={{ background: 'rgba(201,162,39,0.12)', border: '1px solid rgba(201,162,39,0.28)' }}
            data-testid="estimate-radar-lock"
          >
            <div className="flex items-center gap-2">
              <Radio size={16} className="text-accent-500" />
              <div>
                <p className="text-[11px] uppercase tracking-wide text-[#d7c48a]">Dobara reference</p>
                <p className="text-[11px] text-white/55">Median of 3 boards, then condition haircut</p>
              </div>
            </div>
            <p className="text-h3 font-heading text-white">{inr(estimate)}</p>
          </div>
        )}
      </div>

      {openSource && (
        <SourceDetail
          source={openSource}
          quote={quotes[openSource.id]}
          deviceLabel={deviceLabel}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
};

export { MARKET_SOURCES, quotesForEstimate };
export type { IMarketSource, TMarketSourceId };
