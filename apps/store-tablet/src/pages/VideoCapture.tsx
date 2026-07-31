import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card } from '@dobara/ui';
import { Video, Square, Play } from 'lucide-react';

export default function VideoCapture() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [recorded, setRecorded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const minDuration = 10;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const startRecording = () => {
    setRecording(true);
    setElapsed(0);
    setRecorded(false);
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setRecording(false);
    setRecorded(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const canProceed = recorded && elapsed >= minDuration;

  return (
    <div className="p-6">
      <h1 className="text-h3 font-heading text-text-primary mb-2">Video Capture</h1>
      <p className="text-body text-text-body mb-6">
        Record a short video of the device. Minimum duration: 10 seconds.
      </p>

      <Card className="mb-6">
        <div className="aspect-video bg-surface-high rounded-md flex flex-col items-center justify-center mb-4 border-2 border-dashed border-border">
          {recording ? (
            <>
              <div className="w-4 h-4 rounded-full bg-dobara-error animate-pulse mb-3" />
              <span className="text-lead font-mono font-semibold text-dobara-error">
                REC ● {formatTime(elapsed)}
              </span>
            </>
          ) : recorded ? (
            <>
              <div className="w-14 h-14 rounded-full bg-dobara-success/10 flex items-center justify-center mb-3">
                <Video size={28} className="text-dobara-success" />
              </div>
              <span className="text-lead font-semibold text-dobara-success">
                Recording Complete
              </span>
              <span className="text-caption text-text-muted mt-1">
                Duration: {formatTime(elapsed)}
              </span>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mb-3">
                <Video size={28} className="text-text-muted" />
              </div>
              <span className="text-lead text-text-muted">
                Ready to record
              </span>
              <span className="text-caption text-text-muted mt-1">
                Press the button below to start
              </span>
            </>
          )}
        </div>

        <div className="flex justify-center gap-4">
          {!recording && !recorded && (
            <Button
              variant="accent"
              size="lg"
              icon={<Play size={18} />}
              onClick={startRecording}
            >
              Start Recording
            </Button>
          )}
          {recording && (
            <Button
              variant="danger"
              size="lg"
              icon={<Square size={18} />}
              onClick={stopRecording}
            >
              Stop Recording
            </Button>
          )}
          {recorded && elapsed < minDuration && (
            <div className="text-center">
              <p className="text-caption text-dobara-warning mb-2">
                Recording must be at least 10 seconds ({formatTime(elapsed)} recorded)
              </p>
              <Button
                variant="accent"
                size="md"
                icon={<Play size={18} />}
                onClick={startRecording}
              >
                Re-record
              </Button>
            </div>
          )}
        </div>
      </Card>

      <div className="flex justify-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate(`/session/${sessionId}/photo`)}
        >
          Back
        </Button>
        <Button
          variant="primary"
          size="lg"
          disabled={!canProceed}
          onClick={() => navigate(`/session/${sessionId}/hardware`)}
        >
          Continue to Hardware
        </Button>
      </div>
    </div>
  );
}
