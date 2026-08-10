import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, ProgressBar } from '@dobara/ui';
import { ArrowLeft, FileText, CheckCircle, Loader } from 'lucide-react';

const uploadFiles = [
  { name: 'photos.zip', size: '12.4 MB', type: 'Images' },
  { name: 'video.mp4', size: '24.8 MB', type: 'Video' },
  { name: 'diagnostics.json', size: '2.1 KB', type: 'Data' },
  { name: 'invoice.jpg', size: '3.2 MB', type: 'Image' },
];

export default function DataUpload() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [completedFiles, setCompletedFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(true);

  useEffect(() => {
    if (!uploading) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          return 100;
        }
        const next = prev + Math.random() * 15;
        const capped = Math.min(next, 100);

        const fileIndex = Math.floor(capped / 25);
        setCompletedFiles((old) => {
          const names = uploadFiles.slice(0, Math.min(fileIndex + 1, uploadFiles.length)).map((f) => f.name);
          return names;
        });

        return capped;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [uploading]);

  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => {
        navigate(`/session/${sessionId}/report`);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [progress, sessionId, navigate]);

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/session/${sessionId}`)}>
          <ArrowLeft size={16} />
        </Button>
        <h1 className="text-h3 font-heading text-text-primary">Data Upload</h1>
      </div>
      <p className="text-body text-text-body mb-6">
        Uploading inspection data to the server...
      </p>

      <Card className="mb-6">
        <div className="mb-4">
          <ProgressBar
            value={progress}
            max={100}
            color={progress >= 100 ? 'success' : 'primary'}
            size="lg"
            showLabel
          />
        </div>

        <div className="space-y-2">
          {uploadFiles.map((file) => {
            const isDone = completedFiles.includes(file.name);
            const isCurrent =
              !isDone &&
              completedFiles.length === uploadFiles.indexOf(file);
            return (
              <div
                key={file.name}
                className={`flex items-center gap-3 p-3 rounded-md ${
                  isDone
                    ? 'bg-dobara-success-light'
                    : isCurrent
                    ? 'bg-primary-50'
                    : 'bg-surface-high'
                }`}
              >
                <div className="w-8 h-8 rounded-md bg-surface-container flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-caption font-semibold text-text-primary">
                    {file.name}
                  </div>
                  <div className="text-[11px] text-text-muted">
                    {file.type} · {file.size}
                  </div>
                </div>
                <div className="shrink-0">
                  {isDone ? (
                    <CheckCircle size={18} className="text-dobara-success" />
                  ) : isCurrent ? (
                    <Loader size={18} className="text-primary-500 animate-spin" />
                  ) : (
                    <div className="w-[18px]" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex justify-center">
        {progress >= 100 ? (
          <p className="text-body text-dobara-success font-semibold">
            Upload complete! Redirecting to report...
          </p>
        ) : (
          <p className="text-caption text-text-muted">
            Please do not close this screen while uploading...
          </p>
        )}
      </div>
    </div>
  );
}
