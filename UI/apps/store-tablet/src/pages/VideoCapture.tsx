import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card } from '@dobara/ui';
import { Video, Square, Play } from 'lucide-react';
import { markStepComplete } from '../lib/sessionProgress';

const MIN = 10;
const MAX = 30;

/** TAB-P0-01 — 10–30s video, auto-stop at 30s */
export default function VideoCapture() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [recorded, setRecorded] = useState(false);
  const [flash, setFlash] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopRecording = (finalElapsed?: number) => {
    setRecording(false);
    setRecorded(true);
    clearTimer();
    if (finalElapsed != null) setElapsed(finalElapsed);
  };

  const startRecording = () => {
    setRecording(true);
    setElapsed(0);
    setRecorded(false);
    setFlash(false);
    clearTimer();
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= MAX) {
          stopRecording(MAX);
          return MAX;
        }
        return next;
      });
    }, 1000);
  };

  useEffect(() => () => clearTimer(), []);

  const tryContinue = () => {
    if (!recorded || elapsed < MIN) {
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
      return;
    }
    markStepComplete(sessionId, 'video');
    navigate(`/session/${sessionId}/admission`);
  };

  const canProceed = recorded && elapsed >= MIN && elapsed <= MAX;

  return (
    <div className="p-6" data-testid="video-capture">
      <h1 className="text-h3 font-heading text-text-primary mb-2">Video Capture</h1>
      <p className="text-body text-text-body mb-6">
        Record a 360° rotation video · {MIN}–{MAX} seconds required
      </p>

      <Card className={`mb-6 ${flash ? 'ring-2 ring-dobara-error animate-pulse' : ''}`}>
        <div className="aspect-video bg-surface-high rounded-md flex flex-col items-center justify-center mb-4 border-2 border-dashed border-border">
          {recording ? (
            <>
              <div className="w-4 h-4 rounded-full bg-dobara-error animate-pulse mb-3" />
              <span className="text-lead font-mono font-semibold text-dobara-error">
                REC ● {formatTime(elapsed)}
              </span>
              <span className="text-caption text-text-muted mt-1">Auto-stops at {MAX}s</span>
            </>
          ) : recorded ? (
            <>
              <Video size={28} className={elapsed >= MIN ? 'text-dobara-success' : 'text-dobara-error'} />
              <span className={`text-lead font-semibold mt-2 ${elapsed >= MIN ? 'text-dobara-success' : 'text-dobara-error'}`}>
                {elapsed >= MIN ? 'Recording Complete' : 'Too short — re-record'}
              </span>
              <span className="text-caption text-text-muted mt-1">Duration: {formatTime(elapsed)}</span>
            </>
          ) : (
            <>
              <Video size={28} className="text-text-muted" />
              <span className="text-lead text-text-muted mt-2">Ready to record</span>
            </>
          )}
        </div>

        <div className="flex justify-center gap-4 flex-wrap">
          {!recording && (
            <Button variant="accent" size="lg" icon={<Play size={18} />} onClick={startRecording} data-testid="start-recording">
              {recorded ? 'Re-record' : 'Start Recording'}
            </Button>
          )}
          {recording && (
            <Button variant="danger" size="lg" icon={<Square size={18} />} onClick={() => stopRecording()} data-testid="stop-recording">
              Stop Recording
            </Button>
          )}
          {!recording && (
            <Button
              variant="ghost"
              size="sm"
              data-testid="demo-fill-video"
              onClick={() => {
                clearTimer();
                setRecording(false);
                setElapsed(15);
                setRecorded(true);
              }}
            >
              Demo: 15s Clip
            </Button>
          )}
        </div>
      </Card>

      <div className="flex justify-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/session/${sessionId}/photo`)}>Back</Button>
        <Button
          variant="primary"
          size="lg"
          disabled={!canProceed}
          data-testid="video-continue"
          onClick={tryContinue}
        >
          Continue to Appearance Review
        </Button>
      </div>
    </div>
  );
}
