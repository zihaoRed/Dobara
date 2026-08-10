import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, ProgressBar } from '@dobara/ui';
import { FileText, CheckCircle, Loader, AlertTriangle } from 'lucide-react';
import { markStepComplete } from '../lib/sessionProgress';

const uploadFiles = [
  { name: 'photos.zip', size: '12.4 MB', type: 'Images' },
  { name: 'video.mp4', size: '24.8 MB', type: 'Video' },
  { name: 'diagnostics.json', size: '2.1 KB', type: 'Data' },
  { name: 'invoice.jpg', size: '3.2 MB', type: 'Image' },
];

/** TAB-P0-03 — show sessionId, remaining files, retry on failure */
export default function DataUpload() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [completedFiles, setCompletedFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!uploading || failed) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          return 100;
        }
        // Demo: fail once around 55% if user hasn't retried after a prior fail — skip for clean path
        const next = prev + Math.random() * 18;
        const capped = Math.min(next, 100);
        const fileIndex = Math.floor(capped / 25);
        setCompletedFiles(
          uploadFiles.slice(0, Math.min(fileIndex + 1, uploadFiles.length)).map((f) => f.name),
        );
        return capped;
      });
    }, 350);
    return () => clearInterval(interval);
  }, [uploading, failed]);

  useEffect(() => {
    if (progress >= 100 && !failed) {
      markStepComplete(sessionId, 'upload');
      const timer = setTimeout(() => {
        markStepComplete(sessionId, 'report');
        navigate(`/session/${sessionId}/report`);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [progress, failed, sessionId, navigate]);

  const remaining = uploadFiles.length - completedFiles.length;

  const retry = () => {
    setFailed(false);
    setProgress(0);
    setCompletedFiles([]);
    setUploading(true);
  };

  return (
    <div className="p-6" data-testid="data-upload">
      <h1 className="text-h3 font-heading text-text-primary mb-2">Data Upload</h1>
      <p className="text-mono text-caption text-text-muted mb-1" data-testid="upload-session-id">
        session_id: {sessionId}
      </p>
      <p className="text-body text-text-body mb-6">
        Uploading inspection package… {remaining > 0 ? `${remaining} file(s) remaining` : 'finishing'}
      </p>

      {failed && (
        <div className="mb-4 rounded-lg bg-dobara-error-light text-dobara-error px-4 py-3 text-caption font-semibold flex items-center gap-2">
          <AlertTriangle size={16} /> Upload failed
          <Button size="sm" variant="danger" className="ml-auto" data-testid="upload-retry" onClick={retry}>
            Retry
          </Button>
        </div>
      )}

      <Card className="mb-6">
        <div className="mb-4">
          <ProgressBar value={progress} max={100} color={progress >= 100 ? 'success' : 'primary'} size="lg" showLabel />
        </div>
        <div className="space-y-2">
          {uploadFiles.map((file) => {
            const isDone = completedFiles.includes(file.name);
            const isCurrent = !isDone && completedFiles.length === uploadFiles.indexOf(file);
            return (
              <div
                key={file.name}
                className={`flex items-center gap-3 p-3 rounded-md ${
                  isDone ? 'bg-dobara-success-light' : isCurrent ? 'bg-primary-50' : 'bg-surface-high'
                }`}
              >
                <FileText size={16} className="text-text-muted" />
                <div className="flex-1 min-w-0">
                  <div className="text-caption font-semibold text-text-primary">{file.name}</div>
                  <div className="text-[11px] text-text-muted">{file.type} · {file.size}</div>
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
          data-testid="sim-upload-fail"
          onClick={() => {
            setFailed(true);
            setUploading(false);
          }}
        >
          Simulate Failure
        </Button>
        {progress >= 100 && !failed && (
          <p className="text-body text-dobara-success font-semibold">Upload complete — opening report…</p>
        )}
      </div>
    </div>
  );
}
